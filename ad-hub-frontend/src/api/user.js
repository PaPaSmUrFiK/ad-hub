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

        const url = `${API_BASE_URL}/api/users/avatar`;
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

    // Удалить аватар
    deleteAvatar: async () => {
        return await fetchAPI('/api/users/avatar', {
            method: 'DELETE',
        });
    },
};

