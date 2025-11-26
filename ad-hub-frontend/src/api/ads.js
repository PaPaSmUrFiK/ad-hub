import { tokenStorage } from './auth';
import { retryRequest } from '../utils/retry';

const API_BASE_URL = 'http://localhost:8080';

// Определяем, какие запросы являются критичными и требуют retry
const CRITICAL_ENDPOINTS = [
    '/api/ads/search',
    '/api/ads',
    '/api/auth/login',
    '/api/auth/register',
    '/api/users/me',
    '/api/users/profile',
];

// Базовый fetch с обработкой ошибок
async function fetchAPI(endpoint, options = {}, useRetry = false) {
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

    // Определяем, нужен ли retry для этого запроса
    const isCritical = useRetry || CRITICAL_ENDPOINTS.some(criticalPath => endpoint.includes(criticalPath));
    
    const fetchFunction = async () => {
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Ошибка сервера' }));
                const error = new Error(errorData.message || `Ошибка: ${response.status}`);
                error.response = { status: response.status, data: errorData };
                throw error;
            }

            return await response.json();
        } catch (error) {
            if (error instanceof TypeError && error.message.includes('fetch')) {
                const networkError = new Error('Не удалось подключиться к серверу. Проверьте, что backend запущен.');
                networkError.isNetworkError = true;
                throw networkError;
            }
            throw error;
        }
    };

    // Используем retry для критичных запросов
    if (isCritical) {
        return await retryRequest(fetchFunction, {
            maxRetries: 3,
            retryDelay: 1000,
            shouldRetry: (error) => {
                // Повторяем при сетевых ошибках
                if (error.isNetworkError) return true;
                // Повторяем при серверных ошибках (5xx)
                if (error.response?.status >= 500 && error.response?.status < 600) return true;
                // Повторяем при таймаутах и rate limiting
                if (error.response?.status === 408 || error.response?.status === 429) return true;
                return false;
            }
        });
    }

    // Для некритичных запросов выполняем без retry
    return await fetchFunction();
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

        const url = `${API_BASE_URL}/api/ads/${adId}/media`;
        const accessToken = tokenStorage.getAccessToken();
        
        const headers = {};
        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Ошибка сервера' }));
            throw new Error(errorData.message || `Ошибка: ${response.status}`);
        }

        return await response.json();
    },

    // Удалить медиа
    deleteMedia: async (adId, mediaId) => {
        return await fetchAPI(`/api/ads/${adId}/media/${mediaId}`, {
            method: 'DELETE',
        });
    },
};

