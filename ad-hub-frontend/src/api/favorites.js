import { tokenStorage } from './auth';
import { retryRequest } from '../utils/retry';

const API_BASE_URL = 'http://localhost:8080';

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
        const response = await fetch(url, config);
        
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
            
            throw new Error(errorData.message || `Ошибка: ${response.status}`);
        }

        // Для 204 No Content возвращаем null
        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Не удалось подключиться к серверу. Проверьте, что backend запущен.');
        }
        throw error;
    }
}

// API для работы с избранным
export const favoritesAPI = {
    // Получить все избранные объявления пользователя
    getFavorites: async () => {
        return await fetchAPI('/api/ads/favorites');
    },

    // Добавить объявление в избранное
    addToFavorites: async (adId) => {
        return await fetchAPI(`/api/ads/${adId}/favorite`, {
            method: 'POST',
        });
    },

    // Удалить объявление из избранного
    removeFromFavorites: async (adId) => {
        return await fetchAPI(`/api/ads/${adId}/favorite`, {
            method: 'DELETE',
        });
    },
};

