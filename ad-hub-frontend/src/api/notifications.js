import { tokenStorage } from './auth';

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

        return await response.json();
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Не удалось подключиться к серверу. Проверьте, что backend запущен.');
        }
        throw error;
    }
}

// API для работы с уведомлениями
export const notificationsAPI = {
    // Получить все уведомления пользователя
    getNotifications: async (params = {}) => {
        const queryParams = new URLSearchParams();
        
        if (params.page !== undefined && params.page !== null) queryParams.append('page', params.page);
        if (params.size !== undefined && params.size !== null) queryParams.append('size', params.size);

        const queryString = queryParams.toString();
        const endpoint = `/api/notifications${queryString ? `?${queryString}` : ''}`;
        
        return await fetchAPI(endpoint);
    },

    // Получить количество непрочитанных уведомлений
    getUnreadCount: async () => {
        return await fetchAPI('/api/notifications/unread-count');
    },

    // Отметить уведомление как прочитанное
    markAsRead: async (notificationId) => {
        return await fetchAPI(`/api/notifications/${notificationId}/read`, {
            method: 'PATCH',
        });
    },

    // Отметить все уведомления как прочитанные
    markAllAsRead: async () => {
        return await fetchAPI('/api/notifications/read-all', {
            method: 'PATCH',
        });
    },

    // Удалить уведомление
    deleteNotification: async (notificationId) => {
        return await fetchAPI(`/api/notifications/${notificationId}`, {
            method: 'DELETE',
        });
    },
};

