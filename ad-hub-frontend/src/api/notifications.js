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

    // Получить все типы уведомлений
    getNotificationTypes: async () => {
        return await fetchAPI('/api/notifications/types');
    },

    // Создать уведомление (только для модераторов/администраторов)
    createNotification: async (notificationData) => {
        return await fetchAPI('/api/notifications', {
            method: 'POST',
            body: JSON.stringify(notificationData),
        });
    },
};

