import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Clock, Loader2, AlertCircle, CheckCircle2, XCircle, FileEdit, User, Phone, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Header } from './Header';
import { Footer } from './Footer';
import { ImageWithFallback } from './ui/ImageWithFallback';
import { adsAPI } from '../api/ads';
import { adminAPI } from '../api/admin';
import { NotificationForm } from './NotificationForm';
import { getPrimaryImage, formatPrice } from '../utils/categoryUtils';

export function ModerationListingDetailPage({
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
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
    const [isSendingForRevision, setIsSendingForRevision] = useState(false);
    const [showNotificationForm, setShowNotificationForm] = useState(false);
    const [notificationActionType, setNotificationActionType] = useState('reject');
    const [phoneCopied, setPhoneCopied] = useState(false);

    useEffect(() => {
        if (listingId) {
            loadListing();
        }
    }, [listingId]);

    const loadListing = async () => {
        try {
            setLoading(true);
            setError('');
            
            const adData = await adsAPI.getAdById(listingId);
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
            setCurrentImageIndex(0);
        } catch (err) {
            console.error('Ошибка при загрузке объявления:', err);
            setError(err.message || 'Не удалось загрузить объявление');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!window.confirm('Вы уверены, что хотите одобрить это объявление?')) {
            return;
        }

        try {
            setIsApproving(true);
            setError('');
            await adminAPI.approveAd(listingId);
            alert('Объявление успешно одобрено');
            if (onBack) {
                onBack();
            }
        } catch (err) {
            console.error('Ошибка при одобрении объявления:', err);
            setError(err.message || 'Не удалось одобрить объявление');
        } finally {
            setIsApproving(false);
        }
    };

    const handleReject = () => {
        setNotificationActionType('delete'); // удаляем объявление и уведомляем
        setShowNotificationForm(true);
    };

    const handleSendForRevision = () => {
        setNotificationActionType('revision');
        setShowNotificationForm(true);
    };

    const handleNotificationSubmit = async (notificationData) => {
        try {
            if (notificationActionType === 'delete') {
                setIsRejecting(true);
                await adminAPI.deleteAd(listingId);
                alert('Объявление удалено и уведомление отправлено пользователю');
            } else if (notificationActionType === 'revision') {
                setIsSendingForRevision(true);
                await adminAPI.sendForRevision(listingId);
                alert('Объявление отправлено на доработку и уведомление отправлено пользователю');
            }
            
            if (onBack) {
                onBack();
            }
        } catch (err) {
            console.error('Ошибка при выполнении действия:', err);
            setError(err.message || 'Не удалось выполнить действие');
        } finally {
            setIsRejecting(false);
            setIsSendingForRevision(false);
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
            const cleanPhone = phoneNumber.replace(/\D/g, '');
            await navigator.clipboard.writeText(cleanPhone);
            setPhoneCopied(true);
            setTimeout(() => {
                setPhoneCopied(false);
            }, 2000);
        } catch (err) {
            console.error('Ошибка при копировании телефона:', err);
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
                        Назад к модерации
                    </Button>
                </div>
            </div>
        );
    }

    const primaryImage = getPrimaryImage(listing.mediaFiles);
    const allImages = listing.mediaFiles?.map(m => m.fileUrl) || [];
    
    const handlePreviousImage = () => {
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
    };
    
    const handleNextImage = () => {
        setCurrentImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
    };
    
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
        <div className={`min-h-screen flex flex-col ${bgColor}`}>
            <Header
                onLoginClick={onLoginClick}
                onRegisterClick={onLoginClick}
                onFavoritesClick={() => onNavigate('favorites')}
                onLogout={onLogout}
                isAuthenticated={isAuthenticated}
                isDarkTheme={isDarkTheme}
                onToggleTheme={onToggleTheme}
                currentPage="moderation"
                onNavigate={onNavigate}
                isAdmin={isAdmin}
                isModerator={isModerator}
            />

            <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Button
                    variant="ghost"
                    className={`mb-6 ${isDarkTheme ? 'text-neutral-300 hover:text-orange-500' : 'text-stone-700 hover:text-teal-600'}`}
                    onClick={onBack}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Назад к модерации
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className={`${cardBg} rounded-xl border ${borderColor} overflow-hidden`}>
                            <div className={`relative aspect-[16/10] ${isDarkTheme ? 'bg-neutral-900' : 'bg-stone-200'}`}>
                                <ImageWithFallback
                                    src={currentImage}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                />
                                
                                {allImages.length > 1 && (
                                    <div className={`absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full ${isDarkTheme ? 'bg-neutral-800/80' : 'bg-white/80'} ${isDarkTheme ? 'text-neutral-100' : 'text-stone-900'} text-sm font-medium shadow-lg`}>
                                        {currentImageIndex + 1} / {allImages.length}
                                    </div>
                                )}
                                
                                {allImages.length > 1 && (
                                    <>
                                        <button
                                            onClick={handlePreviousImage}
                                            className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full ${isDarkTheme ? 'bg-neutral-800/80 hover:bg-neutral-700/90' : 'bg-white/80 hover:bg-white/90'} ${isDarkTheme ? 'text-neutral-100' : 'text-stone-900'} transition-all shadow-lg`}
                                        >
                                            ←
                                        </button>
                                        
                                        <button
                                            onClick={handleNextImage}
                                            className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full ${isDarkTheme ? 'bg-neutral-800/80 hover:bg-neutral-700/90' : 'bg-white/80 hover:bg-white/90'} ${isDarkTheme ? 'text-neutral-900' : 'text-stone-900'} transition-all shadow-lg`}
                                        >
                                            →
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

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

                            {listing.category && (
                                <div className="mt-4">
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

                    <div className="space-y-6">
                        {listing.user && (
                            <div className={`${cardBg} rounded-xl border ${borderColor} p-6`}>
                                <h3 className={`${textColor} text-lg font-semibold mb-4`}>Автор объявления</h3>
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
                                                className={`w-full ${phoneCopied ? (isDarkTheme ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700') : (isDarkTheme ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700')} text-white flex items-center justify-center transition-colors`}
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
                            </div>
                        )}

                        <div className={`${cardBg} rounded-xl border ${borderColor} p-6`}>
                            <h3 className={`${textColor} text-lg font-semibold mb-4`}>Действия модератора</h3>
                            
                            {error && (
                                <div className={`mb-4 p-3 rounded-lg ${isDarkTheme ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
                                    {error}
                                </div>
                            )}

                            <div className="space-y-3">
                                <Button
                                    onClick={handleApprove}
                                    disabled={isApproving || isRejecting || isSendingForRevision}
                                    className={`w-full ${buttonBg} text-white flex items-center justify-center transition-colors`}
                                >
                                    {isApproving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Одобрение...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Одобрить
                                        </>
                                    )}
                                </Button>

                                <Button
                                    onClick={handleSendForRevision}
                                    disabled={isApproving || isRejecting || isSendingForRevision}
                                    variant="outline"
                                    className={`w-full ${borderColor} flex items-center justify-center`}
                                >
                                    {isSendingForRevision ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Отправка...
                                        </>
                                    ) : (
                                        <>
                                            <FileEdit className="h-4 w-4 mr-2" />
                                            Отправить на доработку
                                        </>
                                    )}
                                </Button>

                                <Button
                                    onClick={handleReject}
                                    disabled={isApproving || isRejecting || isSendingForRevision}
                                    variant="outline"
                                    className={`w-full ${isDarkTheme ? 'text-red-400 border-red-600 hover:bg-red-900/20' : 'text-red-600 border-red-300 hover:bg-red-50'} flex items-center justify-center`}
                                >
                                    {isRejecting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Удаление...
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Удалить
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </main>

            <Footer isDarkTheme={isDarkTheme} />

            {showNotificationForm && listing.user && (
                <NotificationForm
                    isOpen={showNotificationForm}
                    onClose={() => setShowNotificationForm(false)}
                    onSubmit={handleNotificationSubmit}
                    userId={listing.user.id}
                    adId={listingId}
                    isDarkTheme={isDarkTheme}
                    actionType={notificationActionType}
                />
            )}
        </div>
    );
}

