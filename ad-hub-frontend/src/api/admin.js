import { fetchWithAuth } from './interceptor';

// Базовый fetch с автоматическим обновлением токенов
async function fetchAPI(endpoint, options = {}) {
    try {
        return await fetchWithAuth(endpoint, options);
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Не удалось подключиться к серверу. Проверьте, что backend запущен.');
        }
        // Обработка 403 для админских запросов
        if (error.message && error.message.includes('Доступ запрещен')) {
            throw error;
        }
        throw error;
    }
}

// API для админ-панели
export const adminAPI = {
    // Управление пользователями
    getUsers: async (page = 1, size = 20, search = '') => {
        const params = new URLSearchParams();
        if (page) params.append('page', page);
        if (size) params.append('size', size);
        if (search) params.append('search', search);
        
        const queryString = params.toString();
        const endpoint = `/api/admin/users${queryString ? `?${queryString}` : ''}`;
        
        return await fetchAPI(endpoint);
    },

    blockUser: async (userId) => {
        return await fetchAPI(`/api/admin/users/${userId}/block`, {
            method: 'PUT',
        });
    },

    unblockUser: async (userId) => {
        return await fetchAPI(`/api/admin/users/${userId}/unblock`, {
            method: 'PUT',
        });
    },

    updateUserRole: async (userId, roleName) => {
        return await fetchAPI(`/api/admin/users/${userId}/role`, {
            method: 'PUT',
            body: JSON.stringify({ roleName }),
        });
    },

    deleteUser: async (userId) => {
        return await fetchAPI(`/api/admin/users/${userId}`, {
            method: 'DELETE',
        });
    },

    // Управление категориями (используем существующий API)
    getCategories: async () => {
        return await fetchAPI('/api/categories');
    },

    createCategory: async (name, description) => {
        return await fetchAPI('/api/categories', {
            method: 'POST',
            body: JSON.stringify({ name, description }),
        });
    },

    updateCategory: async (id, name, description) => {
        return await fetchAPI(`/api/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ name, description }),
        });
    },

    deleteCategory: async (id) => {
        return await fetchAPI(`/api/categories/${id}`, {
            method: 'DELETE',
        });
    },

    // Статистика поиска
    getSearchStatistics: async () => {
        return await fetchAPI('/api/admin/statistics/search');
    },

    // Модерация объявлений
    getPendingAds: async (page = 1, size = 20) => {
        const params = new URLSearchParams();
        if (page) params.append('page', page);
        if (size) params.append('size', size);
        
        const queryString = params.toString();
        const endpoint = `/api/admin/ads/pending${queryString ? `?${queryString}` : ''}`;
        
        return await fetchAPI(endpoint);
    },

    approveAd: async (adId) => {
        return await fetchAPI(`/api/admin/ads/${adId}/approve`, {
            method: 'POST',
        });
    },

    rejectAd: async (adId) => {
        return await fetchAPI(`/api/admin/ads/${adId}/reject`, {
            method: 'POST',
        });
    },

    sendForRevision: async (adId) => {
        return await fetchAPI(`/api/admin/ads/${adId}/revision`, {
            method: 'POST',
        });
    },
};

