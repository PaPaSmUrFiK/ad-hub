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

// API для работы с объявлениями
export const adsAPI = {
    // Получить список объявлений с фильтрами
    getAds: async (params = {}) => {
        const queryParams = new URLSearchParams();
        
        if (params.page !== undefined && params.page !== null) queryParams.append('page', params.page);
        if (params.size !== undefined && params.size !== null) queryParams.append('size', params.size);
        if (params.categoryId !== undefined && params.categoryId !== null) queryParams.append('categoryId', params.categoryId);
        if (params.minPrice !== undefined && params.minPrice !== null) queryParams.append('minPrice', params.minPrice);
        if (params.maxPrice !== undefined && params.maxPrice !== null) queryParams.append('maxPrice', params.maxPrice);
        if (params.location) queryParams.append('location', params.location);
        if (params.search) queryParams.append('search', params.search);
        if (params.status) queryParams.append('status', params.status);

        const queryString = queryParams.toString();
        const endpoint = `/api/ads${queryString ? `?${queryString}` : ''}`;
        
        return await fetchAPI(endpoint);
    },

    // Поиск объявлений с расширенными фильтрами
    searchAds: async (params = {}) => {
        const queryParams = new URLSearchParams();
        
        if (params.query) queryParams.append('query', params.query);
        if (params.categoryId !== undefined && params.categoryId !== null) queryParams.append('categoryId', params.categoryId);
        if (params.minPrice !== undefined && params.minPrice !== null) queryParams.append('minPrice', params.minPrice);
        if (params.maxPrice !== undefined && params.maxPrice !== null) queryParams.append('maxPrice', params.maxPrice);
        if (params.location) queryParams.append('location', params.location);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.page !== undefined && params.page !== null) queryParams.append('page', params.page);
        if (params.size !== undefined && params.size !== null) queryParams.append('size', params.size);

        const queryString = queryParams.toString();
        const endpoint = `/api/ads/search${queryString ? `?${queryString}` : ''}`;
        
        return await fetchAPI(endpoint);
    },

    // Получить объявления пользователя
    getAdsByUserId: async (userId, params = {}) => {
        const queryParams = new URLSearchParams();
        
        if (params.status) queryParams.append('status', params.status);
        if (params.page !== undefined && params.page !== null) queryParams.append('page', params.page);
        if (params.size !== undefined && params.size !== null) queryParams.append('size', params.size);

        const queryString = queryParams.toString();
        const endpoint = `/api/ads/user/${userId}${queryString ? `?${queryString}` : ''}`;
        
        return await fetchAPI(endpoint);
    },

    // Получить объявление по ID
    getAdById: async (id) => {
        return await fetchAPI(`/api/ads/${id}`);
    },

    // Создать объявление
    createAd: async (adData) => {
        return await fetchAPI('/api/ads', {
            method: 'POST',
            body: JSON.stringify(adData),
        });
    },

    // Обновить объявление
    updateAd: async (id, adData) => {
        return await fetchAPI(`/api/ads/${id}`, {
            method: 'PUT',
            body: JSON.stringify(adData),
        });
    },

    // Удалить объявление
    deleteAd: async (id) => {
        return await fetchAPI(`/api/ads/${id}`, {
            method: 'DELETE',
        });
    },

    // Загрузить медиа для объявления
    uploadMedia: async (adId, file) => {
        const formData = new FormData();
        formData.append('file', file);

        // Используем fetchWithAuth для автоматического обновления токенов
        return await fetchWithAuth(`/api/ads/${adId}/media`, {
            method: 'POST',
            body: formData,
        });
    },

    // Удалить медиа
    deleteMedia: async (adId, mediaId) => {
        return await fetchAPI(`/api/ads/${adId}/media/${mediaId}`, {
            method: 'DELETE',
        });
    },

    // Сохранить как черновик
    saveAsDraft: async (id) => {
        return await fetchAPI(`/api/ads/${id}/draft`, {
            method: 'POST',
        });
    },

    // Отправить в архив
    archiveAd: async (id) => {
        return await fetchAPI(`/api/ads/${id}/archive`, {
            method: 'POST',
        });
    },

    // Опубликовать из архива
    publishAd: async (id) => {
        return await fetchAPI(`/api/ads/${id}/publish`, {
            method: 'POST',
        });
    },
};

