import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { notificationsAPI } from '../api/notifications';

export function NotificationForm({
    isOpen,
    onClose,
    onSubmit,
    userId,
    adId,
    isDarkTheme = false,
    actionType = 'reject' // 'reject' или 'revision'
}) {
    const [notificationTypes, setNotificationTypes] = useState([]);
    const [selectedTypeId, setSelectedTypeId] = useState('');
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingTypes, setLoadingTypes] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadNotificationTypes();
            // Устанавливаем значения по умолчанию в зависимости от типа действия
            if (actionType === 'reject') {
                setTitle('Ваше объявление было отклонено');
                setMessage('К сожалению, ваше объявление не прошло модерацию и было отклонено.');
            } else if (actionType === 'revision') {
                setTitle('Ваше объявление отправлено на доработку');
                setMessage('Ваше объявление требует доработки. Пожалуйста, внесите необходимые изменения.');
            }
        }
    }, [isOpen, actionType]);

    const loadNotificationTypes = async () => {
        try {
            setLoadingTypes(true);
            const types = await notificationsAPI.getNotificationTypes();
            setNotificationTypes(types);
            if (types.length > 0) {
                setSelectedTypeId(types[0].id.toString());
            }
        } catch (err) {
            console.error('Ошибка при загрузке типов уведомлений:', err);
            setError('Не удалось загрузить типы уведомлений');
        } finally {
            setLoadingTypes(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedTypeId) {
            setError('Выберите тип уведомления');
            return;
        }
        
        if (!title.trim()) {
            setError('Заголовок обязателен');
            return;
        }
        
        if (!message.trim()) {
            setError('Сообщение обязательно');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            const notificationData = {
                userId,
                notificationTypeId: parseInt(selectedTypeId),
                title: title.trim(),
                message: message.trim(),
                relatedAdId: adId || null
            };

            await notificationsAPI.createNotification(notificationData);
            
            // Вызываем callback с данными уведомления
            if (onSubmit) {
                onSubmit(notificationData);
            }
            
            // Закрываем форму
            onClose();
            
            // Сбрасываем форму
            setTitle('');
            setMessage('');
            setSelectedTypeId('');
        } catch (err) {
            console.error('Ошибка при создании уведомления:', err);
            setError(err.message || 'Не удалось создать уведомление');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            setTitle('');
            setMessage('');
            setSelectedTypeId('');
            setError('');
            onClose();
        }
    };

    if (!isOpen) return null;

    const bgColor = isDarkTheme ? 'bg-neutral-900' : 'bg-white';
    const borderColor = isDarkTheme ? 'border-neutral-700' : 'border-stone-200';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
    const textMuted = isDarkTheme ? 'text-neutral-400' : 'text-stone-600';
    const inputBg = isDarkTheme ? 'bg-neutral-800' : 'bg-stone-50';
    const buttonBg = isDarkTheme ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div 
                className="fixed inset-0 bg-black/50"
                onClick={handleClose}
            />
            <div className={`relative ${bgColor} ${borderColor} border rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto`}>
                <div className="sticky top-0 flex items-center justify-between p-6 border-b border-inherit bg-inherit">
                    <h2 className={`${textColor} text-xl font-semibold`}>
                        {actionType === 'reject' ? 'Отправить уведомление об отклонении' : 'Отправить уведомление о доработке'}
                    </h2>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className={`${textMuted} hover:${textColor} transition-colors`}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className={`p-3 rounded-lg ${isDarkTheme ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="notificationType" className={textColor}>
                            Тип уведомления
                        </Label>
                        {loadingTypes ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className={textMuted}>Загрузка типов...</span>
                            </div>
                        ) : (
                            <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                                <SelectTrigger className={`${inputBg} ${borderColor}`}>
                                    <SelectValue placeholder="Выберите тип уведомления" />
                                </SelectTrigger>
                                <SelectContent className={bgColor}>
                                    {notificationTypes.map((type) => (
                                        <SelectItem key={type.id} value={type.id.toString()}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title" className={textColor}>
                            Заголовок
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={`${inputBg} ${borderColor} ${textColor}`}
                            placeholder="Введите заголовок уведомления"
                            maxLength={200}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message" className={textColor}>
                            Сообщение
                        </Label>
                        <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className={`${inputBg} ${borderColor} ${textColor}`}
                            placeholder="Введите сообщение для пользователя"
                            rows={6}
                            maxLength={2000}
                            required
                        />
                        <p className={`text-sm ${textMuted}`}>
                            {message.length} / 2000 символов
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={loading}
                            className={borderColor}
                        >
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || loadingTypes}
                            className={`${buttonBg} text-white`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Отправка...
                                </>
                            ) : (
                                'Отправить уведомление'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

