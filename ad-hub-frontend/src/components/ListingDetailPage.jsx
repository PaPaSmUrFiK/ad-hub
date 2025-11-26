import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Share2, MapPin, User, Phone, Mail, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Header } from './Header';
import { Footer } from './Footer';
import { ImageWithFallback } from './ui/ImageWithFallback';
import { Badge } from './ui/badge';
import { adsAPI } from '../api/ads';
import { favoritesAPI } from '../api/favorites';
import { getPrimaryImage, formatPrice } from '../utils/categoryUtils';

export function ListingDetailPage({
                                      listingId,
                                      onBack,
                                      isDarkTheme,
                                      onToggleTheme,
                                      isAuthenticated,
                                      onLoginClick,
                                      onLogout,
                                      onNavigate
                                  }) {
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFavorite, setIsFavorite] = useState(false);

    // Загружаем данные объявления при монтировании
    useEffect(() => {
        if (listingId) {
            loadListing();
        }
    }, [listingId, isAuthenticated]);

    const loadListing = async () => {
        try {
            setLoading(true);
            setError('');
            
            const adData = await adsAPI.getAdById(listingId);
            setListing(adData);
            
            // Проверяем, в избранном ли объявление (если пользователь авторизован)
            if (isAuthenticated) {
                try {
                    const favorites = await favoritesAPI.getFavorites();
                    const isInFavorites = favorites.favorites?.some(f => f.adId === listingId);
                    setIsFavorite(isInFavorites);
                } catch (err) {
                    console.error('Ошибка при проверке избранного:', err);
                }
            }
        } catch (err) {
            console.error('Ошибка при загрузке объявления:', err);
            setError(err.message || 'Не удалось загрузить объявление');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFavorite = async () => {
        if (!isAuthenticated) {
            onLoginClick?.();
            return;
        }

        try {
            if (isFavorite) {
                await favoritesAPI.removeFromFavorites(listingId);
                setIsFavorite(false);
            } else {
                await favoritesAPI.addToFavorites(listingId);
                setIsFavorite(true);
            }
        } catch (err) {
            console.error('Ошибка при изменении избранного:', err);
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
    const isNew = listing.createdAt && new Date(listing.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const bgColor = isDarkTheme ? 'bg-neutral-950' : 'bg-stone-100';
    const cardBg = isDarkTheme ? 'bg-neutral-900' : 'bg-white';
    const borderColor = isDarkTheme ? 'border-neutral-800' : 'border-stone-200';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
    const textSecondary = isDarkTheme ? 'text-neutral-300' : 'text-stone-700';
    const textMuted = isDarkTheme ? 'text-neutral-400' : 'text-stone-600';
    const buttonBg = isDarkTheme ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700';

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
                currentPage="listing"
                onNavigate={onNavigate}
            />

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
                        {/* Images */}
                        <div className={`${cardBg} rounded-xl border ${borderColor} overflow-hidden`}>
                            <div className={`relative aspect-[16/10] ${isDarkTheme ? 'bg-neutral-900' : 'bg-stone-200'}`}>
                                <ImageWithFallback
                                    src={primaryImage || 'https://via.placeholder.com/800x500?text=No+Image'}
                                    alt={listing.title}
                                    className="w-full h-full object-cover"
                                />
                                {(isNew || listing.viewCount > 100) && (
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        {isNew && (
                                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                                                Новое
                                            </Badge>
                                        )}
                                        {listing.viewCount > 100 && (
                                            <Badge className={`${isDarkTheme ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700'} text-white border-0`}>
                                                VIP
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                            {/* Дополнительные изображения (если есть) */}
                            {allImages.length > 1 && (
                                <div className="grid grid-cols-4 gap-2 p-4">
                                    {allImages.slice(1, 5).map((imageUrl, index) => (
                                        <div key={index} className="aspect-square rounded-lg overflow-hidden">
                                            <ImageWithFallback
                                                src={imageUrl}
                                                alt={`${listing.title} - фото ${index + 2}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Details */}
                        <div className={`${cardBg} rounded-xl border ${borderColor} p-6`}>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h1 className={`${textColor} text-2xl font-bold mb-2`}>{listing.title}</h1>
                                    <div className={`flex items-center gap-2 ${textMuted}`}>
                                        <MapPin className="h-4 w-4" />
                                        <span>{listing.location}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className={`${borderColor} ${isFavorite ? (isDarkTheme ? 'text-red-400 border-red-600' : 'text-red-600 border-red-300') : ''}`}
                                        onClick={handleToggleFavorite}
                                        title={isFavorite ? 'Удалить из избранного' : 'Добавить в избранное'}
                                    >
                                        <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className={borderColor}
                                        onClick={() => {
                                            if (navigator.share) {
                                                navigator.share({
                                                    title: listing.title,
                                                    text: listing.description,
                                                    url: window.location.href,
                                                }).catch(() => {});
                                            } else {
                                                navigator.clipboard.writeText(window.location.href);
                                                alert('Ссылка скопирована в буфер обмена');
                                            }
                                        }}
                                        title="Поделиться"
                                    >
                                        <Share2 className="h-4 w-4" />
                                    </Button>
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

                                {listing.user.phone && (
                                    <div className="space-y-3 mb-4">
                                        <Button className={`w-full ${buttonBg} text-white`}>
                                            <Phone className="h-4 w-4 mr-2" />
                                            {listing.user.phone}
                                        </Button>
                                        {listing.user.email && (
                                            <Button variant="outline" className={`w-full ${borderColor}`}>
                                                <Mail className="h-4 w-4 mr-2" />
                                                Написать сообщение
                                            </Button>
                                        )}
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
            </div>

            <Footer isDarkTheme={isDarkTheme} />
        </div>
    );
}