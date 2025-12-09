import { tokenStorage } from './auth';

const API_BASE_URL = 'http://localhost:8080';

// Флаг для предотвращения множественных одновременных обновлений токена
let isRefreshing = false;
let refreshPromise = null;

/**
 * Проверяет, истек ли токен или скоро истечет
 */
function isTokenExpiredOrExpiringSoon(token) {
    if (!token) return true;
    
    try {
        // Декодируем JWT токен (без проверки подписи, только для чтения exp)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp; // Время истечения в секундах (Unix timestamp)
        
        if (!exp) return true;
        
        const now = Math.floor(Date.now() / 1000); // Текущее время в секундах
        const timeUntilExpiry = exp - now;
        
        // Если токен истек или истечет в течение 1 минуты, считаем его недействительным
        return timeUntilExpiry <= 60;
    } catch (error) {
        console.warn('Ошибка при проверке срока действия токена:', error);
        return true; // В случае ошибки считаем токен недействительным
    }
}

/**
 * Централизованный fetch с автоматическим обновлением токенов
 */
export async function fetchWithAuth(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Проверяем токен перед отправкой запроса
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken && isTokenExpiredOrExpiringSoon(accessToken)) {
        try {
            await refreshAccessToken();
        } catch (refreshError) {
            console.error('Не удалось обновить токен перед запросом:', refreshError);
            // Продолжаем выполнение - если запрос вернет 401, попробуем обновить еще раз
        }
    }
    
    // Первая попытка запроса
    let response;
    try {
        response = await makeRequest(url, options);
    } catch (networkError) {
        // Сетевые ошибки (сервер недоступен)
        if (networkError instanceof TypeError || (networkError.message && networkError.message.includes('fetch'))) {
            const message = 'Сервер недоступен. Проверьте подключение или попробуйте позже.';
            window.dispatchEvent(new CustomEvent('fatal:error', { detail: message }));
            throw new Error(message);
        }
        throw networkError;
    }
    
    // Если получили 401, пытаемся обновить токен
    if (response.status === 401) {
        try {
            // Обновляем токен
            const refreshResult = await refreshAccessToken();
            
            // Повторяем запрос с новым токеном
            // ВАЖНО: makeRequest снова получит токен из tokenStorage, который уже обновлен
            response = await makeRequest(url, options);
            
            // Если снова 401, значит refresh token тоже истек или что-то не так
            if (response.status === 401) {
                console.warn('После обновления токена все еще 401, refresh token истек или недействителен');
                tokenStorage.clearTokens();
                window.dispatchEvent(new CustomEvent('auth:expired'));
                throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
            }
        } catch (refreshError) {
            console.error('Ошибка при обновлении токена:', refreshError);
            // Если ошибка уже содержит сообщение о истечении сессии, не дублируем
            if (refreshError.message && refreshError.message.includes('Сессия истекла')) {
                throw refreshError;
            }
            tokenStorage.clearTokens();
            window.dispatchEvent(new CustomEvent('auth:expired'));
            throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
        }
    }
    
    // Обрабатываем ответ
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = { message: `Ошибка сервера: ${response.status} ${response.statusText}` };
        }
        
        if (response.status === 400 && errorData.message) {
            throw new Error(errorData.message);
        }
        
        if (response.status === 401) {
            throw new Error(errorData.message || 'Необходима авторизация');
        }
        
        if (response.status === 413 || response.status === 417) {
            // 413 Payload Too Large или 417 Expectation Failed (для MaxUploadSizeExceededException)
            throw new Error(errorData.message || 'Размер загружаемого файла превышает максимально допустимый размер');
        }
        
        // Все ошибки 5xx считаем критическими
        if (response.status >= 500) {
            const message = errorData.message || `Критическая ошибка сервера: ${response.status}`;
            window.dispatchEvent(new CustomEvent('fatal:error', { detail: message }));
            throw new Error(message);
        }
        
        throw new Error(errorData.message || `Ошибка: ${response.status}`);
    }
    
    // Для 204 No Content возвращаем null
    if (response.status === 204) {
        return null;
    }
    
    // Проверяем, есть ли контент для парсинга
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    // Если нет контента или пустой ответ, возвращаем null
    if (contentLength === '0') {
        return null;
    }
    
    // Пытаемся прочитать текст
    const text = await response.text();
    
    // Если текст пустой, возвращаем null
    if (!text || text.trim() === '') {
        return null;
    }
    
    // Если content-type не JSON, но есть текст, возвращаем null (не пытаемся парсить)
    if (!contentType || !contentType.includes('application/json')) {
        // Для успешных ответов без JSON контента возвращаем null
        if (response.ok) {
            return null;
        }
        // Для ошибок пытаемся распарсить как JSON
        try {
            return JSON.parse(text);
        } catch {
            return null;
        }
    }
    
    // Парсим JSON
    try {
        return JSON.parse(text);
    } catch (error) {
        console.warn('Ошибка при парсинге JSON ответа:', error, 'Текст ответа:', text.substring(0, 100));
        // Если это успешный ответ, возвращаем null вместо ошибки
        if (response.ok) {
            return null;
        }
        throw error;
    }
}

/**
 * Выполняет HTTP запрос с токеном авторизации
 */
async function makeRequest(url, options = {}) {
    const config = {
        ...options,
        headers: {
            ...options.headers,
        },
    };
    
    // Добавляем Content-Type только если это не FormData
    if (!(options.body instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
    }
    // Если FormData, браузер сам установит правильный Content-Type с boundary
    
    // Добавляем токен авторизации, если он есть
    // ВАЖНО: Всегда получаем токен заново, чтобы использовать обновленный токен
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    return await fetch(url, config);
}

/**
 * Обновляет access token используя refresh token
 * Использует флаг для предотвращения множественных одновременных обновлений
 */
async function refreshAccessToken() {
    // Если уже идет обновление, ждем его завершения
    if (isRefreshing && refreshPromise) {
        return await refreshPromise;
    }
    
    isRefreshing = true;
    refreshPromise = (async () => {
        try {
            const refreshToken = tokenStorage.getRefreshToken();
            if (!refreshToken) {
                throw new Error('Refresh token не найден');
            }
            
            const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
            });
            
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { message: 'Ошибка обновления токена' };
                }
                console.error('Ошибка при обновлении токена:', response.status, errorData);
                throw new Error(errorData.message || 'Не удалось обновить токен');
            }
            
            const data = await response.json();
            
            if (data.accessToken && data.refreshToken) {
                tokenStorage.setTokens(data.accessToken, data.refreshToken);
                return data;
            } else {
                console.error('Сервер не вернул новые токены. Ответ:', data);
                throw new Error('Сервер не вернул новые токены');
            }
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();
    
    return await refreshPromise;
}

