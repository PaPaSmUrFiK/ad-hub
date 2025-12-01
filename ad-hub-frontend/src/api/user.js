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

// API для работы с профилем пользователя
export const userAPI = {
    // Получить профиль пользователя
    getProfile: async () => {
        return await fetchAPI('/api/users/profile');
    },

    // Получить информацию о текущем пользователе
    getMe: async () => {
        return await fetchAPI('/api/users/me');
    },

    // Обновить профиль
    updateProfile: async (profileData) => {
        return await fetchAPI('/api/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
    },

    // Изменить пароль
    changePassword: async (passwordData) => {
        return await fetchAPI('/api/users/password', {
            method: 'PATCH',
            body: JSON.stringify(passwordData),
        });
    },

    // Загрузить аватар
    uploadAvatar: async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        // Используем fetchWithAuth для автоматического обновления токенов
        return await fetchWithAuth('/api/users/avatar', {
            method: 'POST',
            body: formData,
        });
    },

    // Удалить аватар
    deleteAvatar: async () => {
        return await fetchAPI('/api/users/avatar', {
            method: 'DELETE',
        });
    },
};

