import { useState, useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ListingCard } from './ListingCard';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { adsAPI } from '../api/ads';
import { categoriesAPI } from '../api/categories';
import { getPrimaryImage, formatPrice } from '../utils/categoryUtils';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from './ui/sheet';

// Маппинг значений сортировки на backend
const sortByMapping = {
    'newest': 'DATE_DESC',
    'oldest': 'DATE_ASC',
    'price-asc': 'PRICE_ASC',
    'price-desc': 'PRICE_DESC',
    'popular': 'POPULARITY_DESC',
};

export function AllListingsPage({
                                    isDarkTheme,
                                    onToggleTheme,
                                    isAuthenticated,
                                    onLoginClick,
                                    onLogout,
                                    onNavigate,
                                    onViewListing,
                                    initialSearchParams = {},
                                    onSearchParamsChange
                                }) {
    const [priceFrom, setPriceFrom] = useState('');
    const [priceTo, setPriceTo] = useState('');
    const [city, setCity] = useState('');
    const [searchQuery, setSearchQuery] = useState(initialSearchParams.query || '');
    const [category, setCategory] = useState(initialSearchParams.categoryId ? initialSearchParams.categoryId.toString() : 'all');
    const [sortBy, setSortBy] = useState('newest');
    const [categories, setCategories] = useState([]);
    const [ads, setAds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
    });

    const bgColor = isDarkTheme ? 'bg-neutral-950' : 'bg-stone-100';
    const cardBg = isDarkTheme ? 'bg-neutral-900' : 'bg-white';
    const borderColor = isDarkTheme ? 'border-neutral-800' : 'border-stone-200';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
    const textSecondary = isDarkTheme ? 'text-neutral-300' : 'text-stone-700';
    const textMuted = isDarkTheme ? 'text-neutral-400' : 'text-stone-600';
    const inputBg = isDarkTheme ? 'bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500' : 'bg-white border-stone-300';
    const buttonBg = isDarkTheme ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700';

    // Загружаем категории при монтировании
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await categoriesAPI.getAllCategories();
                setCategories(data || []);
            } catch (error) {
                console.error('Ошибка при загрузке категорий:', error);
            }
        };
        loadCategories();
    }, []);

    // Сбрасываем страницу на 1 при изменении фильтров (но не при изменении page)
    useEffect(() => {
        setPagination(prev => {
            if (prev.page !== 1) {
                return { ...prev, page: 1 };
            }
            return prev;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, category, sortBy, priceFrom, priceTo, city]);

    // Загружаем объявления при изменении параметров или страницы
    useEffect(() => {
        // Проверяем, что номер страницы не выходит за пределы
        setPagination(prev => {
            if (prev.page < 1) {
                return { ...prev, page: 1 };
            }
            if (prev.totalPages > 0 && prev.page > prev.totalPages) {
                return { ...prev, page: prev.totalPages };
            }
            return prev;
        });
        loadAds();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, category, sortBy, priceFrom, priceTo, city, pagination.page]);

    // Инициализация параметров поиска из пропсов
    useEffect(() => {
        if (initialSearchParams.query) {
            setSearchQuery(initialSearchParams.query);
        }
        if (initialSearchParams.categoryId) {
            setCategory(initialSearchParams.categoryId.toString());
        }
        if (initialSearchParams.minPrice) {
            setPriceFrom(initialSearchParams.minPrice.toString());
        }
        if (initialSearchParams.maxPrice) {
            setPriceTo(initialSearchParams.maxPrice.toString());
        }
        if (initialSearchParams.location) {
            setCity(initialSearchParams.location);
        }
        if (initialSearchParams.sortBy) {
            // Находим ключ по значению
            const sortKey = Object.keys(sortByMapping).find(key => sortByMapping[key] === initialSearchParams.sortBy);
            if (sortKey) {
                setSortBy(sortKey);
            }
        }
    }, [initialSearchParams]);

    const loadAds = async () => {
        try {
            setLoading(true);
            setError('');
            
            const params = {
                query: searchQuery?.trim() || null,
                categoryId: category === 'all' ? null : parseInt(category),
                minPrice: priceFrom ? parseFloat(priceFrom) : null,
                maxPrice: priceTo ? parseFloat(priceTo) : null,
                location: city?.trim() || null,
                sortBy: sortByMapping[sortBy] || null,
                page: pagination.page,
                size: pagination.size,
            };

            const data = await adsAPI.searchAds(params);
            
            setAds(data.content || []);
            setPagination(prev => ({
                ...prev,
                totalElements: data.totalElements || 0,
                totalPages: data.totalPages || 0,
                hasNext: data.hasNext || false,
                hasPrevious: data.hasPrevious || false,
            }));

            // Обновляем параметры поиска в родительском компоненте
            if (onSearchParamsChange) {
                onSearchParamsChange({
                    query: params.query,
                    categoryId: params.categoryId,
                    minPrice: params.minPrice,
                    maxPrice: params.maxPrice,
                    location: params.location,
                    sortBy: params.sortBy,
                });
            }
        } catch (err) {
            console.error('Ошибка при загрузке объявлений:', err);
            setError(err.message || 'Не удалось загрузить объявления');
            setAds([]);
        } finally {
            setLoading(false);
        }
    };

    const handleResetFilters = () => {
        setPriceFrom('');
        setPriceTo('');
        setCity('');
        setSearchQuery('');
        setCategory('all');
        setSortBy('newest');
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleApplyFilters = () => {
        // Применяем фильтры - сбрасываем на первую страницу
        // useEffect автоматически вызовет loadAds
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Сбрасываем на первую страницу, useEffect автоматически вызовет loadAds
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    // Сбрасываем страницу на 1 при изменении фильтров (но не при изменении page)
    useEffect(() => {
        setPagination(prev => {
            if (prev.page !== 1) {
                return { ...prev, page: 1 };
            }
            return prev;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, category, sortBy, priceFrom, priceTo, city]);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || (pagination.totalPages > 0 && newPage > pagination.totalPages)) {
            return; // Не позволяем перейти на недопустимую страницу
        }
        setPagination(prev => ({ ...prev, page: newPage }));
        // Прокручиваем страницу вверх при смене страницы
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            isFeatured: ad.viewCount > 100,
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
                currentPage="all-listings"
                onNavigate={onNavigate}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search and Filters */}
                <div className={`${cardBg} rounded-xl border ${borderColor} p-4 mb-6`}>
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 relative">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${textMuted}`} />
                            <Input
                                placeholder="Поиск объявлений..."
                                className={`${inputBg} pl-10`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className={`w-full md:w-[200px] ${inputBg}`}>
                                <SelectValue placeholder="Категория" />
                            </SelectTrigger>
                            <SelectContent className={isDarkTheme ? 'bg-neutral-800 border-neutral-700' : ''}>
                                <SelectItem value="all">Все категории</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id.toString()}>
                                        {cat.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className={`w-full md:w-[180px] ${inputBg}`}>
                                <SelectValue placeholder="Сортировка" />
                            </SelectTrigger>
                            <SelectContent className={isDarkTheme ? 'bg-neutral-800 border-neutral-700' : ''}>
                                <SelectItem value="newest">Сначала новые</SelectItem>
                                <SelectItem value="price-asc">Цена: по возрастанию</SelectItem>
                                <SelectItem value="price-desc">Цена: по убыванию</SelectItem>
                                <SelectItem value="popular">Популярные</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Filters Sheet */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button type="button" variant="outline" className={borderColor}>
                                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                                    Фильтры
                                </Button>
                            </SheetTrigger>
                            <SheetContent className={isDarkTheme ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                                <SheetHeader>
                                    <SheetTitle className={textColor}>Фильтры</SheetTitle>
                                    <SheetDescription className={textMuted}>
                                        Настройте параметры поиска объявлений
                                    </SheetDescription>
                                </SheetHeader>

                                <div className="mt-6 space-y-6">
                                    {/* Price Range */}
                                    <div>
                                        <Label className={`${textColor} block mb-2 font-medium`}>Цена, ₽</Label>
                                        <div className="grid grid-cols-2 gap-3 mt-2">
                                            <Input
                                                placeholder="От"
                                                type="number"
                                                value={priceFrom}
                                                onChange={(e) => setPriceFrom(e.target.value)}
                                                className={inputBg}
                                            />
                                            <Input
                                                placeholder="До"
                                                type="number"
                                                value={priceTo}
                                                onChange={(e) => setPriceTo(e.target.value)}
                                                className={inputBg}
                                            />
                                        </div>
                                    </div>


                                    {/* Location */}
                                    <div>
                                        <Label className={`${textColor} block mb-2 font-medium`}>Город</Label>
                                        <Input
                                            placeholder="Введите город"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            className={`mt-2 ${inputBg}`}
                                        />
                                    </div>


                                    {/* Buttons */}
                                    <div className="flex gap-3 pt-4">
                                        <Button
                                            type="button"
                                            className={`${buttonBg} text-white flex-1`}
                                            onClick={handleApplyFilters}
                                        >
                                            Применить
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={borderColor}
                                            onClick={handleResetFilters}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </form>
                </div>

                {error && (
                    <div className={`mb-4 p-3 ${isDarkTheme ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-700'} border rounded-lg`}>
                        {error}
                    </div>
                )}

                {/* Results Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className={`${textColor} text-2xl font-bold mb-1`}>Все объявления</h1>
                        {loading ? (
                            <p className={textMuted}>Загрузка...</p>
                        ) : (
                            <p className={textMuted}>
                                Найдено {pagination.totalElements} {getListingText(pagination.totalElements)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Listings Grid */}
                {loading ? (
                    <div className="text-center py-16">
                        <p className={textMuted}>Загрузка объявлений...</p>
                    </div>
                ) : ads.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {ads.map((ad) => {
                            const cardData = mapAdToCard(ad);
                            return (
                                <ListingCard
                                    key={ad.id}
                                    {...cardData}
                                    isDarkTheme={isDarkTheme}
                                    onClick={() => onViewListing && onViewListing(ad.id)}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className={`${cardBg} rounded-xl border ${borderColor} p-12 text-center`}>
                        <Search className={`h-12 w-12 ${textMuted} mx-auto mb-4`} />
                        <h3 className={`${textColor} text-xl font-semibold mb-2`}>Объявления не найдены</h3>
                        <p className={`${textMuted} mb-6`}>
                            Попробуйте изменить параметры поиска или сбросить фильтры
                        </p>
                        <Button
                            variant="outline"
                            className={borderColor}
                            onClick={handleResetFilters}
                        >
                            Сбросить фильтры
                        </Button>
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="mt-10 space-y-4">
                        {/* Информация о текущей странице */}
                        <div className={`text-center ${textMuted} text-sm`}>
                            Показано {((pagination.page - 1) * pagination.size) + 1} - {Math.min(pagination.page * pagination.size, pagination.totalElements)} из {pagination.totalElements} объявлений
                        </div>
                        
                        {/* Навигация */}
                        <div className="flex items-center justify-center gap-2 flex-wrap">
                            <Button 
                                variant="outline" 
                                className={borderColor} 
                                disabled={!pagination.hasPrevious || loading}
                                onClick={() => handlePageChange(pagination.page - 1)}
                            >
                                Предыдущая
                            </Button>
                            
                            {/* Номера страниц */}
                            {(() => {
                            const pages = [];
                            const maxVisible = 5;
                            const currentPage = pagination.page;
                            const totalPages = pagination.totalPages;

                            if (totalPages <= maxVisible) {
                                // Показываем все страницы
                                for (let i = 1; i <= totalPages; i++) {
                                    pages.push(i);
                                }
                            } else {
                                // Показываем страницы с умным алгоритмом
                                if (currentPage <= 3) {
                                    // В начале: 1 2 3 4 5 ... last
                                    for (let i = 1; i <= maxVisible; i++) {
                                        pages.push(i);
                                    }
                                    if (totalPages > maxVisible + 1) {
                                        pages.push('ellipsis');
                                    }
                                    pages.push(totalPages);
                                } else if (currentPage >= totalPages - 2) {
                                    // В конце: 1 ... (n-4) (n-3) (n-2) (n-1) n
                                    pages.push(1);
                                    if (totalPages > maxVisible + 1) {
                                        pages.push('ellipsis');
                                    }
                                    for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
                                        pages.push(i);
                                    }
                                } else {
                                    // В середине: 1 ... (p-1) p (p+1) ... n
                                    pages.push(1);
                                    pages.push('ellipsis');
                                    for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                                        pages.push(i);
                                    }
                                    pages.push('ellipsis');
                                    pages.push(totalPages);
                                }
                            }

                            return pages.map((page, index) => {
                                if (page === 'ellipsis') {
                                    return (
                                        <span key={`ellipsis-${index}`} className={`px-2 ${textMuted}`}>
                                            ...
                                        </span>
                                    );
                                }
                                
                                return (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? "default" : "outline"}
                                        className={currentPage === page ? `${buttonBg} text-white` : borderColor}
                                        disabled={loading}
                                        onClick={() => handlePageChange(page)}
                                    >
                                        {page}
                                    </Button>
                                );
                            });
                        })()}
                            
                            <Button 
                                variant="outline" 
                                className={borderColor}
                                disabled={!pagination.hasNext || loading}
                                onClick={() => handlePageChange(pagination.page + 1)}
                            >
                                Следующая
                            </Button>
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