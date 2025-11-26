/**
 * Утилита для повторных попыток выполнения запросов
 */

/**
 * Выполняет функцию с повторными попытками при ошибках сети
 * @param {Function} fn - Функция для выполнения (async)
 * @param {Object} options - Опции для retry
 * @param {number} options.maxRetries - Максимальное количество попыток (по умолчанию 3)
 * @param {number} options.retryDelay - Задержка между попытками в мс (по умолчанию 1000)
 * @param {Function} options.shouldRetry - Функция для определения, нужно ли повторять (по умолчанию проверяет сетевые ошибки)
 * @returns {Promise} - Результат выполнения функции
 */
export async function retryRequest(fn, options = {}) {
    const {
        maxRetries = 3,
        retryDelay = 1000,
        shouldRetry = (error) => {
            // Повторяем при сетевых ошибках или ошибках таймаута
            if (error instanceof TypeError && error.message.includes('fetch')) {
                return true;
            }
            // Повторяем при 5xx ошибках (серверные ошибки)
            if (error.response?.status >= 500 && error.response?.status < 600) {
                return true;
            }
            // Повторяем при 408 (Request Timeout) или 429 (Too Many Requests)
            if (error.response?.status === 408 || error.response?.status === 429) {
                return true;
            }
            return false;
        }
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            // Если это последняя попытка или не нужно повторять - выбрасываем ошибку
            if (attempt === maxRetries || !shouldRetry(error)) {
                throw error;
            }
            
            // Вычисляем задержку с экспоненциальным backoff
            const delay = retryDelay * Math.pow(2, attempt);
            
            // Ждем перед следующей попыткой
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
}

/**
 * Обертка для fetch с автоматическими retry для критичных запросов
 */
export async function fetchWithRetry(url, options = {}, retryOptions = {}) {
    return retryRequest(
        async () => {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ 
                    message: `Ошибка: ${response.status}`,
                    status: response.status 
                }));
                const error = new Error(errorData.message || `Ошибка: ${response.status}`);
                error.response = { status: response.status, data: errorData };
                throw error;
            }
            
            return await response.json();
        },
        retryOptions
    );
}

