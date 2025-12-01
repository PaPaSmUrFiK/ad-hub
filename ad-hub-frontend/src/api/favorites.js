import { fetchWithAuth } from './interceptor';

// Базовый fetch с автоматическим обновлением токенов
async function fetchAPI(endpoint, options = {}) {
    try {
        return await fetchWithAuth(endpoint, options);
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

