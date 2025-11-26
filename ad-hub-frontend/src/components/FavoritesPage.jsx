import { useState, useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ListingCard } from './ListingCard';
import { favoritesAPI } from '../api/favorites';
import { adsAPI } from '../api/ads';
import { getPrimaryImage, formatPrice } from '../utils/categoryUtils';

export function FavoritesPage({
                                  onBack,
                                  onViewListing,
                                  isDarkTheme,
                                  onToggleTheme,
                                  isAuthenticated,
                                  onLoginClick,
                                  onLogout,
                                  onNavigate
                              }) {
    const bgColor = isDarkTheme ? 'bg-neutral-950' : 'bg-stone-100';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
    const textSecondary = isDarkTheme ? 'text-neutral-300' : 'text-stone-700';
    
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Загружаем избранные объявления при монтировании компонента
    useEffect(() => {
        if (isAuthenticated) {
            loadFavorites();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const loadFavorites = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await favoritesAPI.getFavorites();
            
            // Загружаем полную информацию об объявлениях
            const favoritesWithAds = await Promise.all(
                (data.favorites || []).map(async (favorite) => {
                    try {
                        const ad = await adsAPI.getAdById(favorite.adId);
                        return {
                            ...favorite,
                            ad: ad
                        };
                    } catch (err) {
                        console.error(`Ошибка при загрузке объявления ${favorite.adId}:`, err);
                        return null;
                    }
                })
            );
            
            // Фильтруем null значения (объявления, которые не удалось загрузить)
            setFavorites(favoritesWithAds.filter(f => f !== null));
        } catch (err) {
            console.error('Ошибка при загрузке избранных:', err);
            setError(err.message || 'Не удалось загрузить избранные объявления');
            setFavorites([]);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromFavorites = async (adId, e) => {
        e.stopPropagation();
        try {
            await favoritesAPI.removeFromFavorites(adId);
            // Удаляем из локального состояния
            setFavorites(prev => prev.filter(f => f.adId !== adId));
        } catch (err) {
            console.error('Ошибка при удалении из избранного:', err);
            setError(err.message || 'Не удалось удалить из избранного');
        }
    };

    // Преобразуем данные избранного для ListingCard
    const mapFavoriteToCard = (favorite) => {
        if (!favorite.ad) return null;
        
        const ad = favorite.ad;
        const primaryImage = getPrimaryImage(ad.mediaFiles) || favorite.primaryImage?.fileUrl;
        const isNew = ad.createdAt && new Date(ad.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        return {
            id: ad.id,
            title: ad.title,
            price: formatPrice(ad.price, ad.currency),
            location: ad.location || 'Не указано',
            image: primaryImage || 'https://via.placeholder.com/400x300?text=No+Image',
            isNew: isNew,
            isFeatured: ad.viewCount > 100,
            isFavorite: true,
        };
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
                currentPage="favorites"
                onNavigate={onNavigate}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className={`${textColor} text-3xl font-bold mb-2`}>Избранные объявления</h1>
                    <p className={`${textSecondary} text-lg`}>
                        {loading ? 'Загрузка...' : `${favorites.length} ${getListingText(favorites.length)}`}
                    </p>
                </div>

                {error && (
                    <div className={`mb-4 p-3 ${isDarkTheme ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-700'} border rounded-lg`}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-16">
                        <p className={textSecondary}>Загрузка избранных объявлений...</p>
                    </div>
                ) : !isAuthenticated ? (
                    <div className="text-center py-16">
                        <div className={`w-24 h-24 mx-auto mb-4 rounded-full ${isDarkTheme ? 'bg-neutral-800' : 'bg-stone-200'} flex items-center justify-center`}>
                            <svg
                                className={`w-12 h-12 ${isDarkTheme ? 'text-neutral-400' : 'text-stone-400'}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                            </svg>
                        </div>
                        <h3 className={`${textColor} text-xl font-semibold mb-2`}>Необходима авторизация</h3>
                        <p className={`${textSecondary} mb-6`}>
                            Войдите, чтобы просматривать избранные объявления
                        </p>
                        <button
                            onClick={onLoginClick}
                            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                                isDarkTheme
                                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                            }`}
                        >
                            Войти
                        </button>
                    </div>
                ) : favorites.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {favorites.map((favorite) => {
                            const cardData = mapFavoriteToCard(favorite);
                            if (!cardData) return null;
                            
                            return (
                                <ListingCard
                                    key={favorite.id}
                                    {...cardData}
                                    isDarkTheme={isDarkTheme}
                                    onClick={() => onViewListing && onViewListing(favorite.adId)}
                                    onFavoriteToggle={(e) => handleRemoveFromFavorites(favorite.adId, e)}
                                    isFavorite={true}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className={`text-center py-16 ${textSecondary}`}>
                        <div className="max-w-md mx-auto">
                            <div className={`w-24 h-24 mx-auto mb-4 rounded-full ${isDarkTheme ? 'bg-neutral-800' : 'bg-stone-200'} flex items-center justify-center`}>
                                <svg
                                    className={`w-12 h-12 ${isDarkTheme ? 'text-neutral-400' : 'text-stone-400'}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className={`${textColor} text-xl font-semibold mb-2`}>Нет избранных объявлений</h3>
                            <p className={`${textSecondary} mb-6`}>
                                Добавляйте понравившиеся объявления в избранное, чтобы не потерять их
                            </p>
                            <button
                                onClick={onBack}
                                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                                    isDarkTheme
                                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                        : 'bg-teal-600 hover:bg-teal-700 text-white'
                                }`}
                            >
                                Найти объявления
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Footer isDarkTheme={isDarkTheme} />
        </div>
    );
}

// Helper function for correct Russian plural forms
function getListingText(count) {
    if (count === 1) return 'объявление';
    if (count >= 2 && count <= 4) return 'объявления';
    return 'объявлений';
}