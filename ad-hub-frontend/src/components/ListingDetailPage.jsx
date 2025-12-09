import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, MapPin, User, Phone, Mail, Clock, Loader2, AlertCircle, Trash2, ChevronLeft, ChevronRight, Archive, FileText, CheckCircle2, Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Header } from './Header';
import { Footer } from './Footer';
import { ImageWithFallback } from './ui/ImageWithFallback';
import { Badge } from './ui/badge';
import { adsAPI } from '../api/ads';
import { favoritesAPI } from '../api/favorites';
import { userAPI } from '../api/user';
import { commentsAPI } from '../api/comments';
import { getPrimaryImage, formatPrice } from '../utils/categoryUtils';
import { useRef } from 'react';
import { tokenStorage } from '../api/auth';

export function ListingDetailPage({
                                      listingId,
                                      onBack,
                                      isDarkTheme,
                                      onToggleTheme,
                                      isAuthenticated,
                                      onLoginClick,
                                      onLogout,
                                      onNavigate,
                                      isAdmin = false,
                                      isModerator = false
                                  }) {
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isArchiving, setIsArchiving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [phoneCopied, setPhoneCopied] = useState(false);
    const hasLoadedRef = useRef(false);
    const hasTrackedViewRef = useRef(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentError, setCommentError] = useState('');

    // Сбрасываем индекс изображения при изменении listingId
    useEffect(() => {
        setCurrentImageIndex(0);
    }, [listingId]);

    // Сбрасываем флаг загрузки при смене объявления
    useEffect(() => {
        hasLoadedRef.current = false;
    }, [listingId]);

    // Загружаем данные объявления при монтировании/смене объявления (однократно, чтобы не удваивать просмотры)
    useEffect(() => {
        if (!listingId) return;
        if (hasLoadedRef.current) return;
        hasLoadedRef.current = true;
            loadListing();
    }, [listingId]);

    // Отдельно отправляем событие просмотра (чтобы не зависеть от повторных загрузок данных)
    useEffect(() => {
        if (!listingId) return;
        if (hasTrackedViewRef.current) return;
        hasTrackedViewRef.current = true;

        const trackView = async () => {
            try {
                // Не отправляем если не авторизован? Нам нужно считать и анонимные просмотры, поэтому отправляем всегда
                await adsAPI.addView(listingId);
            } catch (err) {
                console.error('Ошибка при отправке просмотра:', err);
            }
        };

        trackView();
    }, [listingId]);

    // Загружаем ID текущего пользователя
    useEffect(() => {
        if (isAuthenticated) {
            loadCurrentUser();
        } else {
            setCurrentUserId(null);
        }
    }, [isAuthenticated]);

    // Загружаем комментарии при смене объявления
    useEffect(() => {
        loadComments();
    }, [listingId]);

    // Обработка нажатий клавиш для навигации по изображениям
    // Должен быть до условных возвратов, чтобы соблюдать правила хуков
    useEffect(() => {
        if (!listing || !listing.mediaFiles || listing.mediaFiles.length <= 1) return;
        
        const allImages = listing.mediaFiles.map(m => m.fileUrl) || [];
        if (allImages.length <= 1) return;
        
        // Убеждаемся, что индекс в пределах массива
        setCurrentImageIndex((prev) => {
            if (prev >= allImages.length) return 0;
            if (prev < 0) return 0;
            return prev;
        });
        
        const handleKeyPress = (e) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                setCurrentImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
            }
        };
        
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [listing]);

    const loadCurrentUser = async () => {
        try {
            const userData = await userAPI.getMe();
            setCurrentUserId(userData.id);
        } catch (err) {
            console.error('Ошибка при загрузке текущего пользователя:', err);
        }
    };

    const loadListing = async () => {
        try {
            setLoading(true);
            setError('');
            
            const adData = await adsAPI.getAdById(listingId);
            // Преобразуем данные для совместимости с фронтендом
            const transformedData = {
                ...adData,
                user: {
                    id: adData.userId,
                    username: adData.userUsername,
                    email: adData.userEmail,
                    phone: adData.userPhone,
                    avatarUrl: adData.userAvatarUrl,
                    firstName: adData.userFirstName,
                    lastName: adData.userLastName,
                }
            };
            setListing(transformedData);
            // Сбрасываем индекс изображения при загрузке нового объявления
            setCurrentImageIndex(0);
            
            // Обновляем isOnModeration и isOwner после загрузки
            // Они будут пересчитаны в рендере
            
        } catch (err) {
            console.error('Ошибка при загрузке объявления:', err);
            setError(err.message || 'Не удалось загрузить объявление');
        } finally {
            setLoading(false);
        }
    };

    const loadComments = async () => {
        if (!listingId) return;
        try {
            setCommentsLoading(true);
            setCommentError('');
            const data = await commentsAPI.getComments(listingId);
            setComments(data || []);
        } catch (err) {
            console.error('Ошибка при загрузке комментариев:', err);
            setCommentError(err.message || 'Не удалось загрузить комментарии');
            setComments([]);
        } finally {
            setCommentsLoading(false);
        }
    };

    // Проверяем статус избранного отдельно, чтобы не вызывать двойной запрос объявления
    useEffect(() => {
        const checkFavorite = async () => {
            if (!isAuthenticated || !listingId) {
                setIsFavorite(false);
                return;
            }
            try {
                const favorites = await favoritesAPI.getFavorites();
                const isInFavorites = favorites.favorites?.some(f => f.adId === listingId);
                setIsFavorite(Boolean(isInFavorites));
            } catch (err) {
                console.error('Ошибка при проверке избранного:', err);
            }
        };
        checkFavorite();
    }, [isAuthenticated, listingId]);

    const handleDeleteAd = async () => {
        if (!window.confirm('Вы уверены, что хотите удалить это объявление?')) {
            return;
        }

        try {
            setIsDeleting(true);
            await adsAPI.deleteAd(listingId);
            if (onNavigate) {
                onNavigate('profile');
            }
        } catch (err) {
            console.error('Ошибка при удалении объявления:', err);
            setError(err.message || 'Не удалось удалить объявление');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        try {
            setCommentError('');
            const newComment = await commentsAPI.addComment(listingId, commentText.trim());
            setComments(prev => [newComment, ...prev]);
            setCommentText('');
        } catch (err) {
            console.error('Ошибка при добавлении комментария:', err);
            setCommentError(err.message || 'Не удалось добавить комментарий');
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Удалить комментарий?')) return;
        try {
            await commentsAPI.deleteComment(listingId, commentId);
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (err) {
            console.error('Ошибка при удалении комментария:', err);
            setCommentError(err.message || 'Не удалось удалить комментарий');
        }
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleString();
    };

    const handleSaveAsDraft = async () => {
        try {
            setIsSavingDraft(true);
            const updatedAd = await adsAPI.saveAsDraft(listingId);
            // Преобразуем данные для совместимости с фронтендом
            const transformedData = {
                ...updatedAd,
                user: listing.user
            };
            setListing(transformedData);
            alert('Объявление сохранено как черновик');
            // Перезагружаем страницу для обновления данных
            if (onNavigate) {
                onNavigate('profile');
            }
        } catch (err) {
            console.error('Ошибка при сохранении черновика:', err);
            setError(err.message || 'Не удалось сохранить черновик');
        } finally {
            setIsSavingDraft(false);
        }
    };

    const handleArchiveAd = async () => {
        if (!window.confirm('Вы уверены, что хотите отправить это объявление в архив?')) {
            return;
        }

        try {
            setIsArchiving(true);
            setError('');
            const updatedAd = await adsAPI.archiveAd(listingId);
            // Преобразуем данные для совместимости с фронтендом
            const transformedData = {
                ...updatedAd,
                user: listing.user
            };
            setListing(transformedData);
            alert('Объявление отправлено в архив');
        } catch (err) {
            console.error('Ошибка при архивировании объявления:', err);
            setError(err.message || 'Не удалось отправить объявление в архив');
        } finally {
            setIsArchiving(false);
        }
    };

    const handlePublishAd = async () => {
        if (!window.confirm('Вы уверены, что хотите опубликовать это объявление? Оно будет отправлено на модерацию.')) {
            return;
        }

        try {
            setIsPublishing(true);
            setError('');
            const updatedAd = await adsAPI.publishAd(listingId);
            // Преобразуем данные для совместимости с фронтендом
            const transformedData = {
                ...updatedAd,
                user: listing.user
            };
            setListing(transformedData);
            alert('Объявление отправлено на модерацию');
        } catch (err) {
            console.error('Ошибка при публикации объявления:', err);
            setError(err.message || 'Не удалось опубликовать объявление');
        } finally {
            setIsPublishing(false);
        }
    };

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            onLoginClick?.();
            return;
        }

        // Оптимистичное обновление - сразу меняем состояние для мгновенной перерисовки
        const wasFavorite = isFavorite;
        const newFavoriteState = !wasFavorite;
        setIsFavorite(newFavoriteState);

        try {
            // Используем старое значение для определения действия
            if (wasFavorite) {
                // Было в избранном, теперь удаляем
                await favoritesAPI.removeFromFavorites(listingId);
            } else {
                // Не было в избранном, теперь добавляем
                await favoritesAPI.addToFavorites(listingId);
            }
        } catch (err) {
            console.error('Ошибка при изменении избранного:', err);
            // Откатываем изменение при ошибке
            setIsFavorite(!newFavoriteState);
            setError(err.message || 'Не удалось изменить статус избранного');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Не указано';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Сегодня';
        if (diffDays === 1) return 'Вчера';
        if (diffDays < 7) return `${diffDays} дня назад`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} недели назад`;
        return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const handleCopyPhone = async (phoneNumber) => {
        try {
            // Очищаем номер от форматирования для копирования
            const cleanPhone = phoneNumber.replace(/\D/g, '');
            await navigator.clipboard.writeText(cleanPhone);
            setPhoneCopied(true);
            setTimeout(() => {
                setPhoneCopied(false);
            }, 2000);
        } catch (err) {
            console.error('Ошибка при копировании телефона:', err);
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = phoneNumber.replace(/\D/g, '');
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setPhoneCopied(true);
                setTimeout(() => {
                    setPhoneCopied(false);
                }, 2000);
            } catch (e) {
                alert('Не удалось скопировать номер телефона');
            }
            document.body.removeChild(textArea);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen ${isDarkTheme ? 'bg-neutral-950' : 'bg-stone-100'} flex items-center justify-center`}>
                <div className="text-center">
                    <Loader2 className={`h-8 w-8 ${isDarkTheme ? 'text-orange-500' : 'text-teal-600'} animate-spin mx-auto mb-4`} />
                    <p className={isDarkTheme ? 'text-neutral-300' : 'text-stone-700'}>Загрузка объявления...</p>
                </div>
            </div>
        );
    }

    if (error || !listing) {
        return (
            <div className={`min-h-screen ${isDarkTheme ? 'bg-neutral-950 text-white' : 'bg-stone-100 text-stone-900'} flex items-center justify-center`}>
                <div className="text-center max-w-md px-4">
                    <AlertCircle className={`h-12 w-12 ${isDarkTheme ? 'text-red-400' : 'text-red-600'} mx-auto mb-4`} />
                    <h2 className="text-2xl font-bold mb-2">Объявление не найдено</h2>
                    <p className={`mb-6 ${isDarkTheme ? 'text-neutral-300' : 'text-stone-600'}`}>
                        {error || 'Объявление было удалено или не существует'}
                    </p>
                    <Button onClick={onBack} className={isDarkTheme ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700'}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Назад к объявлениям
                    </Button>
                </div>
            </div>
        );
    }

    const primaryImage = getPrimaryImage(listing.mediaFiles);
    const allImages = listing.mediaFiles?.map(m => m.fileUrl) || [];
    const isOnModeration = listing.status === 'ON_MODERATION';
    const isOwner = isAuthenticated && currentUserId === listing.user?.id;
    
    // Навигация по изображениям
    const handlePreviousImage = () => {
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
    };
    
    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
    };
    
    // Определяем текущее изображение с fallback
    const currentImage = allImages.length > 0 
        ? (allImages[currentImageIndex] || allImages[0] || primaryImage)
        : (primaryImage || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="500"%3E%3Crect fill="%23ddd" width="800" height="500"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E');

    const bgColor = isDarkTheme ? 'bg-neutral-950' : 'bg-stone-100';
    const cardBg = isDarkTheme ? 'bg-neutral-900' : 'bg-white';
    const borderColor = isDarkTheme ? 'border-neutral-800' : 'border-stone-200';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
    const textSecondary = isDarkTheme ? 'text-neutral-300' : 'text-stone-700';
    const textMuted = isDarkTheme ? 'text-neutral-400' : 'text-stone-600';
    const buttonBg = isDarkTheme ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700';

    return (
        <div className={`min-h-screen ${bgColor} flex flex-col`}>
            <Header
                onLoginClick={onLoginClick}
                onRegisterClick={onLoginClick}
                onFavoritesClick={() => onNavigate('favorites')}
                onLogout={onLogout}
                isAuthenticated={isAuthenticated}
                isDarkTheme={isDarkTheme}
                onToggleTheme={onToggleTheme}
                currentPage="listing"
                onNavigate={onNavigate}
                isAdmin={isAdmin}
                isModerator={isModerator}
            />

            <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    className={`mb-6 ${isDarkTheme ? 'text-neutral-300 hover:text-orange-500' : 'text-stone-700 hover:text-teal-600'}`}
                    onClick={onBack}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Назад к объявлениям
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Images Gallery */}
                        <div className={`${cardBg} rounded-xl border ${borderColor} overflow-hidden`}>
                            <div className={`relative aspect-[16/10] ${isDarkTheme ? 'bg-neutral-900' : 'bg-stone-200'}`}>
                                <ImageWithFallback
                                    src={currentImage}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                />
                                
                                {/* Нумерация изображений (вместо плашки "Новое") */}
                                {allImages.length > 1 && (
                                    <div className={`absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full ${isDarkTheme ? 'bg-neutral-800/80' : 'bg-white/80'} ${isDarkTheme ? 'text-neutral-100' : 'text-stone-900'} text-sm font-medium shadow-lg`}>
                                        {currentImageIndex + 1} / {allImages.length}
                                    </div>
                                )}
                                
                                {/* Кнопка избранного в правом верхнем углу */}
                                {isAuthenticated && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`absolute top-4 right-4 z-10 h-10 w-10 rounded-full transition-all duration-200 shadow-lg hover:scale-110 active:scale-95 ${
                                            // Фон одинаковый для избранного и не избранного на обеих темах, чтобы красное сердце было лучше видно
                                            isDarkTheme ? 'bg-white/80 hover:bg-white/90' : 'bg-white/80 hover:bg-white/90'
                                        }`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleFavorite();
                                        }}
                                        title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
                                    >
                                        <Heart 
                                            className={`h-5 w-5 transition-all duration-200 ${
                                                isFavorite 
                                                    ? 'fill-current text-red-600 scale-110' 
                                                    : `stroke-2 ${isDarkTheme ? 'stroke-neutral-100' : 'stroke-black'} fill-none hover:scale-110`
                                            }`} 
                                        />
                                    </Button>
                                )}
                                
                                {/* Навигация стрелками (если больше 1 изображения) */}
                                {allImages.length > 1 && (
                                    <>
                                        {/* Кнопка "Назад" */}
                                        <button
                                            onClick={handlePreviousImage}
                                            className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full ${isDarkTheme ? 'bg-neutral-800/80 hover:bg-neutral-700/90' : 'bg-white/80 hover:bg-white/90'} ${isDarkTheme ? 'text-neutral-100' : 'text-stone-900'} transition-all shadow-lg`}
                                            aria-label="Предыдущее изображение"
                                        >
                                            <ChevronLeft className="h-6 w-6" />
                                        </button>
                                        
                                        {/* Кнопка "Вперед" */}
                                        <button
                                            onClick={handleNextImage}
                                            className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full ${isDarkTheme ? 'bg-neutral-800/80 hover:bg-neutral-700/90' : 'bg-white/80 hover:bg-white/90'} ${isDarkTheme ? 'text-neutral-100' : 'text-stone-900'} transition-all shadow-lg`}
                                            aria-label="Следующее изображение"
                                        >
                                            <ChevronRight className="h-6 w-6" />
                                        </button>
                                    </>
                                )}
                            </div>
                            
                        </div>

                        {/* Details */}
                        <div className={`${cardBg} rounded-xl border ${borderColor} p-6`}>
                            <div className="mb-4">
                                    <h1 className={`${textColor} text-2xl font-bold mb-2`}>{listing.title}</h1>
                                    <div className={`flex items-center gap-2 ${textMuted}`}>
                                        <MapPin className="h-4 w-4" />
                                        <span>{listing.location}</span>
                                </div>
                            </div>

                            <div className={`${textColor} text-3xl font-bold mb-6`}>
                                {formatPrice(listing.price, listing.currency)}
                            </div>

                            <div>
                                <h2 className={`${textColor} text-xl font-semibold mb-3`}>Описание</h2>
                                <p className={`${textSecondary} leading-relaxed whitespace-pre-wrap`}>{listing.description}</p>
                            </div>

                            {/* Категория */}
                            {listing.category && (
                                <div>
                                    <h3 className={`${textColor} text-lg font-semibold mb-2`}>Категория</h3>
                                    <p className={textSecondary}>{listing.category.name}</p>
                                </div>
                            )}

                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-neutral-900' : 'bg-stone-50'}`}>
                                    <div className={textMuted}>Размещено</div>
                                    <div className={`${textColor} flex items-center gap-2 mt-1`}>
                                        <Clock className="h-4 w-4" />
                                        {formatDate(listing.createdAt)}
                                    </div>
                                </div>
                                <div className={`p-4 rounded-lg ${isDarkTheme ? 'bg-neutral-900' : 'bg-stone-50'}`}>
                                    <div className={textMuted}>Просмотров</div>
                                    <div className={`${textColor} mt-1`}>{listing.viewCount || 0}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Seller Info */}
                        {listing.user && (
                            <div className={`${cardBg} rounded-xl border ${borderColor} p-6`}>
                                <h3 className={`${textColor} text-lg font-semibold mb-4`}>Продавец</h3>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-12 h-12 rounded-full ${isDarkTheme ? 'bg-neutral-700' : 'bg-stone-200'} flex items-center justify-center overflow-hidden`}>
                                        {listing.user.avatarUrl ? (
                                            <ImageWithFallback
                                                src={listing.user.avatarUrl}
                                                alt={listing.user.username}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className={`h-6 w-6 ${textMuted}`} />
                                        )}
                                    </div>
                                    <div>
                                        <div className={`${textColor} font-medium`}>
                                            {listing.user.username || listing.user.firstName || 'Пользователь'}
                                        </div>
                                        <div className={textMuted}>
                                            {listing.user.createdAt 
                                                ? `На сайте с ${new Date(listing.user.createdAt).getFullYear()}`
                                                : 'Пользователь'
                                            }
                                        </div>
                                    </div>
                                </div>

                                {/* Контакты */}
                                {(listing.user.phone || listing.user.email) && (
                                    <div className="space-y-3 mb-4">
                                        {listing.user.phone && (
                                            <Button 
                                                className={`w-full ${phoneCopied ? (isDarkTheme ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700') : buttonBg} text-white flex items-center justify-center transition-colors`}
                                                onClick={() => {
                                                    if (listing.user.phone) {
                                                        handleCopyPhone(listing.user.phone);
                                                    }
                                                }}
                                            >
                                                {phoneCopied ? (
                                                    <>
                                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                                        Скопировано!
                                                    </>
                                                ) : (
                                                    <>
                                                        <Phone className="h-4 w-4 mr-2" />
                                                        {listing.user.phone}
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                        {listing.user.email && (
                                            <Button 
                                                variant="outline" 
                                                className={`w-full ${borderColor} flex items-center justify-center`}
                                                onClick={() => {
                                                    if (listing.user.email) {
                                                        window.location.href = `mailto:${listing.user.email}`;
                                                    }
                                                }}
                                            >
                                                <Mail className="h-4 w-4 mr-2" />
                                                {listing.user.email}
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* Кнопки для владельца */}
                                {isOwner && (
                                    <div className="space-y-3">
                                        {/* Кнопки управления: черновик, архив и публикация */}
                                        <div className="space-y-2">
                                            {listing.status === 'ARCHIVED' ? (
                                                <Button 
                                                    variant="outline" 
                                                    className={`w-full ${buttonBg} text-white flex items-center justify-center`}
                                                    onClick={handlePublishAd}
                                                    disabled={isPublishing}
                                                >
                                                    {isPublishing ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Публикация...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="h-4 w-4 mr-2" />
                                                            Опубликовать
                                                        </>
                                                    )}
                                                </Button>
                                            ) : (
                                                <>
                                                    {listing.status !== 'DRAFT' && listing.status !== 'ARCHIVED' && listing.status !== 'DELETED' && (
                                                        <Button 
                                                            variant="outline" 
                                                            className={`w-full ${borderColor} flex items-center justify-center`}
                                                            onClick={handleSaveAsDraft}
                                                            disabled={isSavingDraft}
                                                        >
                                                            {isSavingDraft ? (
                                                                <>
                                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                    Сохранение...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <FileText className="h-4 w-4 mr-2" />
                                                                    Сохранить черновик
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                    {listing.status !== 'ARCHIVED' && listing.status !== 'DELETED' && (
                                                        <Button 
                                                            variant="outline" 
                                                            className={`w-full ${borderColor} flex items-center justify-center`}
                                                            onClick={handleArchiveAd}
                                                            disabled={isArchiving}
                                                        >
                                                            {isArchiving ? (
                                                                <>
                                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                    Архивирование...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Archive className="h-4 w-4 mr-2" />
                                                                    Отправить в архив
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Кнопка удаления (красная, внизу) */}
                                        <Button 
                                            variant="outline" 
                                            className={`w-full ${isDarkTheme ? 'text-red-400 border-red-600 hover:bg-red-900/20' : 'text-red-600 border-red-300 hover:bg-red-50'} flex items-center justify-center`}
                                            onClick={handleDeleteAd}
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Удаление...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Удалить объявление
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                )}

                                {listing.user.rating && (
                                    <div className={`mt-4 p-4 rounded-lg ${isDarkTheme ? 'bg-neutral-900' : 'bg-stone-50'}`}>
                                        <div className={textMuted}>Рейтинг продавца</div>
                                        <div className={`${textColor} text-2xl font-bold mt-1`}>
                                            {listing.user.rating.toFixed(1)} ⭐
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Safety Tips */}
                        <div className={`${cardBg} rounded-xl border ${borderColor} p-6`}>
                            <h3 className={`${textColor} text-lg font-semibold mb-3`}>Безопасная сделка</h3>
                            <ul className={`${textSecondary} space-y-2 text-sm`}>
                                <li>• Встречайтесь в публичных местах</li>
                                <li>• Проверяйте товар перед оплатой</li>
                                <li>• Не отправляйте предоплату</li>
                                <li>• Используйте безопасные способы оплаты</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Комментарии */}
                <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className={`${cardBg} rounded-xl border ${borderColor} p-6 space-y-4`}>
                            <h3 className={`text-xl font-semibold ${textColor}`}>Комментарии</h3>

                            {isAuthenticated ? (
                                <form onSubmit={handleAddComment} className="space-y-3">
                                    <textarea
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        className={`w-full rounded-lg border ${borderColor} ${isDarkTheme ? 'bg-neutral-900 text-neutral-100' : 'bg-white text-stone-900'} px-3 py-2`}
                                        rows={3}
                                        placeholder="Оставьте комментарий..."
                                    />
                                    <div className="flex justify-between items-center">
                                        {commentError && (
                                            <span className={`${isDarkTheme ? 'text-red-400' : 'text-red-600'} text-sm`}>{commentError}</span>
                                        )}
                                        <Button
                                            type="submit"
                                            disabled={!commentText.trim()}
                                            className={`${buttonBg} text-white`}
                                        >
                                            Отправить
                                        </Button>
                                    </div>
                                </form>
                            ) : (
                                <div className={`${isDarkTheme ? 'text-neutral-300' : 'text-stone-700'}`}>
                                    Авторизуйтесь, чтобы оставить комментарий.
                                </div>
                            )}

                            {commentsLoading ? (
                                <div className={`${isDarkTheme ? 'text-neutral-300' : 'text-stone-700'}`}>Загрузка комментариев...</div>
                            ) : comments.length === 0 ? (
                                <div className={`${isDarkTheme ? 'text-neutral-400' : 'text-stone-600'}`}>Комментариев пока нет</div>
                            ) : (
                                <div className="space-y-4">
                                    {comments.map((c) => (
                                        <div key={c.id} className={`rounded-lg border ${borderColor} ${cardBg} p-4`}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className={`font-semibold ${textColor}`}>{c.userUsername || c.userName || 'Пользователь'}</div>
                                                    <div className={`${textMuted} text-xs`}>{formatDateTime(c.createdAt)}</div>
                                                </div>
                                                {currentUserId && c.userId === currentUserId && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={isDarkTheme ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}
                                                        onClick={() => handleDeleteComment(c.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <p className={`${textColor} mt-2 whitespace-pre-wrap`}>{c.commentText}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            </main>

            <Footer isDarkTheme={isDarkTheme} />
        </div>
    );
}