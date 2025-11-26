import { useState, useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Bell, Heart, MessageCircle, TrendingUp, CheckCheck } from 'lucide-react';
import { Button } from './ui/button';
import { notificationsAPI } from '../api/notifications';

// Маппинг типов уведомлений к иконкам
const getNotificationIcon = (typeName) => {
    if (!typeName) return Bell;
    
    const lowerType = typeName.toLowerCase();
    if (lowerType.includes('message') || lowerType.includes('комментарий') || lowerType.includes('сообщение')) {
        return MessageCircle;
    }
    if (lowerType.includes('favorite') || lowerType.includes('избранное')) {
        return Heart;
    }
    if (lowerType.includes('view') || lowerType.includes('просмотр')) {
        return TrendingUp;
    }
    return Bell;
};

// Форматирование времени
const formatTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
        return 'Только что';
    } else if (diffMins < 60) {
        return `${diffMins} ${getMinutesText(diffMins)} назад`;
    } else if (diffHours < 24) {
        return `${diffHours} ${getHoursText(diffHours)} назад`;
    } else if (diffDays === 1) {
        return 'Вчера';
    } else if (diffDays < 7) {
        return `${diffDays} ${getDaysText(diffDays)} назад`;
    } else {
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    }
};

const getMinutesText = (count) => {
    if (count === 1) return 'минуту';
    if (count >= 2 && count <= 4) return 'минуты';
    return 'минут';
};

const getHoursText = (count) => {
    if (count === 1) return 'час';
    if (count >= 2 && count <= 4) return 'часа';
    return 'часов';
};

const getDaysText = (count) => {
    if (count === 1) return 'день';
    if (count >= 2 && count <= 4) return 'дня';
    return 'дней';
};

export function NotificationsPage({
                                      isDarkTheme,
                                      onToggleTheme,
                                      isAuthenticated,
                                      onLoginClick,
                                      onLogout,
                                      onNavigate
                                  }) {
    const bgColor = isDarkTheme ? 'bg-neutral-950' : 'bg-stone-100';
    const cardBg = isDarkTheme ? 'bg-neutral-900' : 'bg-white';
    const borderColor = isDarkTheme ? 'border-neutral-800' : 'border-stone-200';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
    const textSecondary = isDarkTheme ? 'text-neutral-300' : 'text-stone-700';
    const textMuted = isDarkTheme ? 'text-neutral-400' : 'text-stone-600';
    const unreadBg = isDarkTheme ? 'bg-neutral-800' : 'bg-teal-50';
    const iconBg = isDarkTheme ? 'bg-orange-600/20 text-orange-500' : 'bg-teal-100 text-teal-700';
    
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Загружаем уведомления при монтировании компонента
    useEffect(() => {
        if (isAuthenticated) {
            loadNotifications();
            loadUnreadCount();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await notificationsAPI.getNotifications();
            setNotifications(data || []);
        } catch (err) {
            console.error('Ошибка при загрузке уведомлений:', err);
            setError(err.message || 'Не удалось загрузить уведомления');
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const loadUnreadCount = async () => {
        try {
            const count = await notificationsAPI.getUnreadCount();
            setUnreadCount(count || 0);
        } catch (err) {
            console.error('Ошибка при загрузке количества непрочитанных:', err);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            await loadNotifications();
            await loadUnreadCount();
        } catch (err) {
            console.error('Ошибка при отметке всех как прочитанных:', err);
            setError(err.message || 'Не удалось отметить все как прочитанные');
        }
    };

    const handleNotificationClick = async (notification) => {
        // Отмечаем как прочитанное, если еще не прочитано
        if (!notification.isRead) {
            try {
                await notificationsAPI.markAsRead(notification.id);
                // Обновляем локальное состояние
                setNotifications(prev => prev.map(n => 
                    n.id === notification.id ? { ...n, isRead: true } : n
                ));
                await loadUnreadCount();
            } catch (err) {
                console.error('Ошибка при отметке как прочитанного:', err);
            }
        }

        // Переход к объявлению, если оно связано
        if (notification.relatedAdId && onNavigate) {
            onNavigate('listing', { id: notification.relatedAdId });
        }
    };

    return (
        <div className={`min-h-screen ${bgColor}`}>
            <Header
                onLoginClick={onLoginClick}
                onRegisterClick={onLoginClick}
                onFavoritesClick={() => onNavigate('favorites')}
                onLogout={onLogout}
                isAuthenticated={isAuthenticated}
                isDarkTheme={isDarkTheme}
                onToggleTheme={onToggleTheme}
                currentPage="notifications"
                onNavigate={onNavigate}
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className={`${textColor} text-2xl font-bold mb-2`}>Уведомления</h1>
                        <p className={textMuted}>
                            {unreadCount} {getUnreadText(unreadCount)}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        className={`${borderColor} ${isDarkTheme ? 'text-neutral-300 hover:bg-neutral-800' : 'text-stone-700 hover:bg-stone-100'}`}
                        onClick={handleMarkAllAsRead}
                    >
                        <CheckCheck className="h-4 w-4 mr-2" />
                        Отметить все как прочитанные
                    </Button>
                </div>

                {error && (
                    <div className={`mb-4 p-3 ${isDarkTheme ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-700'} border rounded-lg`}>
                        {error}
                    </div>
                )}

                <div className={`${cardBg} rounded-xl border ${borderColor} overflow-hidden`}>
                    {loading ? (
                        <div className="text-center py-16">
                            <p className={textMuted}>Загрузка уведомлений...</p>
                        </div>
                    ) : !isAuthenticated ? (
                        <div className="text-center py-16">
                            <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${isDarkTheme ? 'bg-neutral-800' : 'bg-stone-200'} flex items-center justify-center`}>
                                <Bell className={`h-8 w-8 ${isDarkTheme ? 'text-neutral-400' : 'text-stone-400'}`} />
                            </div>
                            <h3 className={`${textColor} text-xl font-semibold mb-2`}>Необходима авторизация</h3>
                            <p className={textMuted}>Войдите, чтобы просматривать уведомления</p>
                            <Button
                                className={`mt-4 ${isDarkTheme ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700'} text-white`}
                                onClick={onLoginClick}
                            >
                                Войти
                            </Button>
                        </div>
                    ) : notifications.length > 0 ? (
                        <div className={`divide-y ${isDarkTheme ? 'divide-neutral-800' : 'divide-stone-200'}`}>
                            {notifications.map((notification) => {
                                const Icon = getNotificationIcon(notification.notificationTypeName);
                                return (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`p-4 ${isDarkTheme ? 'hover:bg-neutral-800' : 'hover:bg-stone-50'} transition-colors cursor-pointer ${!notification.isRead ? unreadBg : ''}`}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <h3 className={`${textColor} font-medium`}>{notification.title}</h3>
                                                    {!notification.isRead && (
                                                        <span className={`w-2 h-2 rounded-full ${isDarkTheme ? 'bg-orange-500' : 'bg-teal-500'} flex-shrink-0 mt-2`}></span>
                                                    )}
                                                </div>
                                                <p className={`${textSecondary} mb-2 leading-relaxed`}>{notification.message}</p>
                                                <p className={`${textMuted} text-sm`}>{formatTime(notification.sentAt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${isDarkTheme ? 'bg-neutral-800' : 'bg-stone-200'} flex items-center justify-center`}>
                                <Bell className={`h-8 w-8 ${isDarkTheme ? 'text-neutral-400' : 'text-stone-400'}`} />
                            </div>
                            <h3 className={`${textColor} text-xl font-semibold mb-2`}>Нет уведомлений</h3>
                            <p className={textMuted}>Здесь будут появляться ваши уведомления</p>
                        </div>
                    )}
                </div>
            </div>

            <Footer isDarkTheme={isDarkTheme} />
        </div>
    );
}

// Helper function for correct Russian plural forms
function getUnreadText(count) {
    if (count === 1) return 'непрочитанное';
    if (count >= 2 && count <= 4) return 'непрочитанных';
    return 'непрочитанных';
}