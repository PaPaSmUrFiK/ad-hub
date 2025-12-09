import { fetchWithAuth } from './interceptor';

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

export const commentsAPI = {
    getComments: async (adId) => {
        return await fetchAPI(`/api/ads/${adId}/comments`);
    },

    addComment: async (adId, commentText) => {
        return await fetchAPI(`/api/ads/${adId}/comments`, {
            method: 'POST',
            body: JSON.stringify({ commentText }),
        });
    },

    updateComment: async (adId, commentId, commentText) => {
        return await fetchAPI(`/api/ads/${adId}/comments/${commentId}`, {
            method: 'PUT',
            body: JSON.stringify({ commentText }),
        });
    },

    deleteComment: async (adId, commentId) => {
        return await fetchAPI(`/api/ads/${adId}/comments/${commentId}`, {
            method: 'DELETE',
        });
    },
};


