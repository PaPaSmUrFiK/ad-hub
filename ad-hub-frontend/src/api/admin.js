import { tokenStorage } from './auth.js';

const API_BASE_URL = 'http://localhost:8080';

// Базовый fetch с обработкой ошибок (копия из auth.js для админских запросов)
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    // Добавляем токен авторизации
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
            
            if (response.status === 403) {
                throw new Error(errorData.message || 'Доступ запрещен');
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
};

