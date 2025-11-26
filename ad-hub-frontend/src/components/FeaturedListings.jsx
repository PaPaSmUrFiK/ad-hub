import { ListingCard } from './ListingCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useState, useEffect } from 'react';
import { adsAPI } from '../api/ads';
import { getPrimaryImage, formatPrice } from '../utils/categoryUtils';

export function FeaturedListings({ isDarkTheme = false, onViewListing, onNavigate }) {
    const bgColor = isDarkTheme ? 'bg-neutral-950' : 'bg-stone-100';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
    const textSecondary = isDarkTheme ? 'text-neutral-300' : 'text-stone-700';
    const linkColor = isDarkTheme ? 'text-orange-600 hover:text-orange-700' : 'text-teal-700 hover:text-teal-800';
    
    const [featuredAds, setFeaturedAds] = useState([]);
    const [newAds, setNewAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('featured');

    // Загружаем объявления при монтировании компонента
    useEffect(() => {
        const loadAds = async () => {
            try {
                setLoading(true);
                
                // Загружаем популярные объявления (сортировка по просмотрам)
                const featuredData = await adsAPI.searchAds({
                    sortBy: 'POPULARITY_DESC',
                    page: 1,
                    size: 8
                });
                
                // Загружаем новые объявления (сортировка по дате)
                const newData = await adsAPI.searchAds({
                    sortBy: 'DATE_DESC',
                    page: 1,
                    size: 8
                });

                setFeaturedAds(featuredData.content || []);
                setNewAds(newData.content || []);
            } catch (error) {
                console.error('Ошибка при загрузке объявлений:', error);
                setFeaturedAds([]);
                setNewAds([]);
            } finally {
                setLoading(false);
            }
        };

        loadAds();
    }, []);

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
            isFavorite: false, // Будет загружаться отдельно при необходимости
        };
    };

    return (
        <section id="listings" className={`py-16 ${bgColor}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
                        <div>
                            <h2 className={`text-3xl font-bold ${textColor} mb-2`}>
                                Актуальные объявления
                            </h2>
                            <p className={`text-lg ${textSecondary}`}>
                                Свежие предложения от проверенных продавцов
                            </p>
                        </div>

                        <TabsList className={isDarkTheme ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-stone-300'}>
                            <TabsTrigger
                                value="featured"
                                className={isDarkTheme
                                    ? 'data-[state=active]:bg-orange-600 data-[state=active]:text-white text-neutral-300'
                                    : 'data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700'
                                }
                            >
                                Популярные
                            </TabsTrigger>
                            <TabsTrigger
                                value="new"
                                className={isDarkTheme
                                    ? 'data-[state=active]:bg-orange-600 data-[state=active]:text-white text-neutral-300'
                                    : 'data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700'
                                }
                            >
                                Новинки
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <p className={textSecondary}>Загрузка объявлений...</p>
                        </div>
                    ) : (
                        <>
                            <TabsContent value="featured" className="mt-0">
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
                                        <p className={textSecondary}>Нет популярных объявлений</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="new" className="mt-0">
                                {newAds.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {newAds.map((ad) => (
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
                                        <p className={textSecondary}>Нет новых объявлений</p>
                                    </div>
                                )}
                            </TabsContent>
                        </>
                    )}
                </Tabs>

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