import { ListingCard } from './ListingCard';
import { useState, useEffect } from 'react';
import { adsAPI } from '../api/ads';
import { favoritesAPI } from '../api/favorites';
import { tokenStorage } from '../api/auth';
import { getPrimaryImage, formatPrice } from '../utils/categoryUtils';

export function FeaturedListings({ isDarkTheme = false, onViewListing, onNavigate, isAuthenticated, onLoginClick }) {
    const bgColor = isDarkTheme ? 'bg-neutral-950' : 'bg-stone-100';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
    const textSecondary = isDarkTheme ? 'text-neutral-300' : 'text-stone-700';
    const linkColor = isDarkTheme ? 'text-orange-600 hover:text-orange-700' : 'text-teal-700 hover:text-teal-800';
    
    const [featuredAds, setFeaturedAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favoriteAdIds, setFavoriteAdIds] = useState(new Set());

    // Загружаем объявления при монтировании компонента
    useEffect(() => {
        const loadAds = async () => {
            try {
                setLoading(true);
                
                const featuredData = await adsAPI.searchAds({
                    sortBy: 'POPULARITY_DESC',
                    page: 1,
                    size: 8
                });

                setFeaturedAds(featuredData.content || []);
            } catch (error) {
                console.error('Ошибка при загрузке объявлений:', error);
                setFeaturedAds([]);
            } finally {
                setLoading(false);
            }
        };

        loadAds();
    }, []);

    // Загружаем избранные объявления для авторизованного пользователя
    useEffect(() => {
        const loadFavorites = async () => {
            if (!isAuthenticated || !tokenStorage.isAuthenticated()) {
                setFavoriteAdIds(new Set());
                return;
            }
            
            try {
                const favorites = await favoritesAPI.getFavorites();
                const favoriteIds = new Set((favorites.favorites || []).map(f => f.adId));
                setFavoriteAdIds(favoriteIds);
            } catch (error) {
                console.error('Ошибка при загрузке избранного:', error);
                setFavoriteAdIds(new Set());
            }
        };
        
        loadFavorites();
    }, [isAuthenticated]);

    // Обработчик изменения избранного
    const handleFavoriteToggle = async (adId) => {
        if (!isAuthenticated || !tokenStorage.isAuthenticated()) {
            onLoginClick?.();
            return;
        }

        // Оптимистичное обновление - сразу меняем состояние для мгновенной перерисовки
        const isCurrentlyFavorite = favoriteAdIds.has(adId);
        const newFavoriteState = !isCurrentlyFavorite;
        
        // Сразу обновляем состояние
        setFavoriteAdIds(prev => {
            const newSet = new Set(prev);
            if (newFavoriteState) {
                newSet.add(adId);
            } else {
                newSet.delete(adId);
            }
            return newSet;
        });

        try {
            if (isCurrentlyFavorite) {
                await favoritesAPI.removeFromFavorites(adId);
            } else {
                await favoritesAPI.addToFavorites(adId);
            }
        } catch (error) {
            console.error('Ошибка при изменении избранного:', error);
            // Откатываем изменение при ошибке
            setFavoriteAdIds(prev => {
                const newSet = new Set(prev);
                if (isCurrentlyFavorite) {
                    newSet.add(adId);
                } else {
                    newSet.delete(adId);
                }
                return newSet;
            });
        }
    };

    // Преобразуем данные объявления для ListingCard
    const mapAdToCard = (ad) => {
        const primaryImage = getPrimaryImage(ad.mediaFiles);
        const isNew = ad.createdAt && new Date(ad.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        return {
            id: ad.id,
            title: ad.title,
            price: formatPrice(ad.price, ad.currency),
            location: ad.location || 'Не указано',
            image: primaryImage || 'https://via.placeholder.com/400x300?text=No+Image',
            isNew: isNew,
            isFeatured: ad.viewCount > 100, // VIP если много просмотров
            isFavorite: favoriteAdIds.has(ad.id),
            status: ad.status, // Передаем статус объявления
            onFavoriteToggle: () => handleFavoriteToggle(ad.id),
        };
    };

    return (
        <section id="listings" className={`py-16 ${bgColor}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
                    <div>
                        <h2 className={`text-3xl font-bold ${textColor} mb-2`}>
                            Актуальные объявления
                        </h2>
                        <p className={`text-lg ${textSecondary}`}>
                            Свежие предложения от проверенных продавцов
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <p className={textSecondary}>Загрузка объявлений...</p>
                    </div>
                ) : (
                    <>
                        {featuredAds.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {featuredAds.map((ad) => (
                                    <ListingCard
                                        key={ad.id}
                                        {...mapAdToCard(ad)}
                                        isDarkTheme={isDarkTheme}
                                        onClick={() => onViewListing && onViewListing(ad.id)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className={textSecondary}>Нет объявлений для отображения</p>
                            </div>
                        )}
                    </>
                )}

                <div className="text-center mt-10">
                    <button 
                        className={`font-medium ${linkColor} transition-colors`}
                        onClick={() => onNavigate && onNavigate('all-listings')}
                    >
                        Показать все объявления →
                    </button>
                </div>
            </div>
        </section>
    );
}