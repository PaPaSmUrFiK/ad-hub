import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, FileText } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Button } from './ui/button';
import { ListingCard } from './ListingCard';
import { adminAPI } from '../api/admin';
import { getPrimaryImage, formatPrice } from '../utils/categoryUtils';

export function ModerationPage({
    isDarkTheme = false,
    onToggleTheme,
    isAuthenticated = false,
    onLoginClick,
    onLogout,
    onNavigate,
    isAdmin = false,
    isModerator = false,
    onViewListing
}) {
    const [pendingAds, setPendingAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        if (isAuthenticated) {
            loadPendingAds();
        }
    }, [isAuthenticated, page]);

    const loadPendingAds = async () => {
        try {
            setLoading(true);
            setError('');
            const ads = await adminAPI.getPendingAds(page, 20);
            
            if (page === 1) {
                setPendingAds(ads);
            } else {
                setPendingAds(prev => [...prev, ...ads]);
            }
            
            setHasMore(ads.length === 20);
        } catch (err) {
            console.error('Ошибка при загрузке объявлений на модерации:', err);
            setError(err.message || 'Не удалось загрузить объявления на модерации');
        } finally {
            setLoading(false);
        }
    };

    const handleViewListing = (adId) => {
        if (onViewListing) {
            onViewListing(adId);
        } else if (onNavigate) {
            onNavigate('moderation-listing', { listingId: adId });
        }
    };

    const handleRefresh = () => {
        setPage(1);
        setPendingAds([]);
        loadPendingAds();
    };

    const bgColor = isDarkTheme ? 'bg-neutral-950' : 'bg-stone-100';
    const cardBg = isDarkTheme ? 'bg-neutral-900' : 'bg-white';
    const borderColor = isDarkTheme ? 'border-neutral-800' : 'border-stone-200';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
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
                currentPage="moderation"
                onNavigate={onNavigate}
                isAdmin={isAdmin}
                isModerator={isModerator}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <h1 className={`${textColor} text-3xl font-bold mb-2`}>Модерация объявлений</h1>
                    <p className={textMuted}>
                        Объявления, ожидающие проверки модератором
                    </p>
                </div>

                {error && (
                    <div className={`${cardBg} ${borderColor} border rounded-xl p-4 mb-6 flex items-center gap-3`}>
                        <AlertCircle className={`h-5 w-5 ${isDarkTheme ? 'text-red-400' : 'text-red-600'}`} />
                        <span className={textColor}>{error}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            className="ml-auto"
                        >
                            Обновить
                        </Button>
                    </div>
                )}

                {loading && pendingAds.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <Loader2 className={`h-8 w-8 ${isDarkTheme ? 'text-orange-500' : 'text-teal-600'} animate-spin mx-auto mb-4`} />
                            <p className={textMuted}>Загрузка объявлений...</p>
                        </div>
                    </div>
                ) : pendingAds.length === 0 ? (
                    <div className={`${cardBg} ${borderColor} border rounded-xl p-12 text-center`}>
                        <FileText className={`h-12 w-12 ${textMuted} mx-auto mb-4`} />
                        <h3 className={`${textColor} text-xl font-semibold mb-2`}>
                            Нет объявлений на модерации
                        </h3>
                        <p className={textMuted}>
                            Все объявления проверены или нет новых объявлений для модерации
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                            {pendingAds.map((ad) => {
                                const primaryImage = getPrimaryImage(ad.mediaFiles || []);
                                return (
                                    <ListingCard
                                        key={ad.id}
                                        id={ad.id}
                                        title={ad.title}
                                        price={ad.price}
                                        location={ad.location}
                                        image={primaryImage}
                                        images={ad.mediaFiles?.map(m => m.fileUrl) || []}
                                        isDarkTheme={isDarkTheme}
                                        onClick={() => handleViewListing(ad.id)}
                                        status={ad.status}
                                    />
                                );
                            })}
                        </div>

                        {hasMore && (
                            <div className="text-center">
                                <Button
                                    onClick={() => setPage(prev => prev + 1)}
                                    disabled={loading}
                                    className={buttonBg}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Загрузка...
                                        </>
                                    ) : (
                                        'Загрузить еще'
                                    )}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Footer isDarkTheme={isDarkTheme} />
        </div>
    );
}

