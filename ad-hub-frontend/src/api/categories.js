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
            const errorData = await response.json().catch(() => ({ message: 'Ошибка сервера' }));
            throw new Error(errorData.message || `Ошибка: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Не удалось подключиться к серверу. Проверьте, что backend запущен.');
        }
        throw error;
    }
}

// API для работы с категориями
export const categoriesAPI = {
    // Получить все категории
    getAllCategories: async () => {
        return await fetchAPI('/api/categories');
    },

    // Получить категорию по ID
    getCategoryById: async (id) => {
        return await fetchAPI(`/api/categories/${id}`);
    },

    // Создать категорию (только для админов)
    createCategory: async (categoryData) => {
        return await fetchAPI('/api/categories', {
            method: 'POST',
            body: JSON.stringify(categoryData),
        });
    },

    // Обновить категорию (только для админов)
    updateCategory: async (id, categoryData) => {
        return await fetchAPI(`/api/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(categoryData),
        });
    },

    // Удалить категорию (только для админов)
    deleteCategory: async (id) => {
        return await fetchAPI(`/api/categories/${id}`, {
            method: 'DELETE',
        });
    },
};

