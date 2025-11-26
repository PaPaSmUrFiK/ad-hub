const API_BASE_URL = 'http://localhost:8080';

// Утилиты для работы с токенами
export const tokenStorage = {
    getAccessToken: () => localStorage.getItem('accessToken'),
    getRefreshToken: () => localStorage.getItem('refreshToken'),
    setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    },
    clearTokens: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    },
    isAuthenticated: () => !!localStorage.getItem('accessToken'),
};

// Базовый fetch с обработкой ошибок
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    // Добавляем токен авторизации, если он есть
    const accessToken = tokenStorage.getAccessToken();
    if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
        console.log('fetchAPI: отправка запроса на', url, 'с конфигом:', config);
        const response = await fetch(url, config);
        
        console.log('fetchAPI: получен ответ со статусом', response.status);
        
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
                console.log('fetchAPI: данные ошибки:', errorData);
            } catch {
                errorData = { message: `Ошибка сервера: ${response.status} ${response.statusText}` };
            }
            
            // Обработка ошибок валидации (400 Bad Request)
            if (response.status === 400 && errorData.message) {
                throw new Error(errorData.message);
            }
            
            // Обработка ошибок авторизации (401 Unauthorized)
            if (response.status === 401) {
                throw new Error(errorData.message || 'Неверный email или пароль');
            }
            
            // Обработка других ошибок
            throw new Error(errorData.message || `Ошибка: ${response.status}`);
        }

        const jsonData = await response.json();
        console.log('fetchAPI: успешный ответ:', jsonData);
        return jsonData;
    } catch (error) {
        console.error('fetchAPI: ошибка:', error);
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Не удалось подключиться к серверу. Проверьте, что backend запущен.');
        }
        throw error;
    }
}

// API для авторизации
export const authAPI = {
    // Регистрация
    register: async (registerData) => {
        const response = await fetchAPI('/auth/register', {
            method: 'POST',
            body: JSON.stringify(registerData),
        });
        
        // Сохраняем токены
        if (response.accessToken && response.refreshToken) {
            tokenStorage.setTokens(response.accessToken, response.refreshToken);
        }
        
        return response;
    },

    // Вход
    login: async (email, password) => {
        console.log('authAPI.login вызван с email:', email);
        
        try {
            const response = await fetchAPI('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            
            console.log('Ответ от fetchAPI:', response);
            
            // Проверяем наличие токенов в ответе
            if (!response || (!response.accessToken && !response.refreshToken)) {
                console.error('Сервер не вернул токены авторизации. Ответ:', response);
                throw new Error('Сервер не вернул токены авторизации');
            }
            
            // Сохраняем токены
            if (response.accessToken && response.refreshToken) {
                tokenStorage.setTokens(response.accessToken, response.refreshToken);
                console.log('Токены успешно сохранены в localStorage');
            } else {
                console.error('Неполные данные авторизации получены от сервера:', response);
                throw new Error('Неполные данные авторизации получены от сервера');
            }
            
            return response;
        } catch (error) {
            // Логируем ошибку для отладки
            console.error('Ошибка в authAPI.login:', error);
            
            // Пробрасываем ошибку дальше с понятным сообщением
            if (error.message) {
                throw error;
            } else {
                throw new Error('Ошибка при входе. Проверьте данные и попробуйте снова.');
            }
        }
    },

    // Обновление токена
    refreshToken: async () => {
        const refreshToken = tokenStorage.getRefreshToken();
        if (!refreshToken) {
            throw new Error('Refresh token не найден');
        }

        const response = await fetchAPI('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
        });

        if (response.accessToken && response.refreshToken) {
            tokenStorage.setTokens(response.accessToken, response.refreshToken);
        }

        return response;
    },

    // Выход
    logout: async () => {
        const refreshToken = tokenStorage.getRefreshToken();
        
        // Очищаем токены локально в любом случае
        tokenStorage.clearTokens();
        
        // Пытаемся уведомить сервер о выходе (но не критично, если не получится)
        if (refreshToken) {
            try {
                const url = `${API_BASE_URL}/auth/logout`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken }),
                });
                
                // Не проверяем response.ok, так как токены уже очищены локально
                // Если сервер вернул ошибку, это не критично
                if (!response.ok) {
                    console.warn('Сервер вернул ошибку при выходе, но токены уже очищены локально');
                }
            } catch (error) {
                // Игнорируем ошибки сети, так как токены уже очищены
                console.warn('Не удалось уведомить сервер о выходе, но токены очищены локально:', error);
            }
        }
    },
};

