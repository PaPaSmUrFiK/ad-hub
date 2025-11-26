import { useState, useEffect } from 'react';
import { categoriesAPI } from '../api/categories';
import { adsAPI } from '../api/ads';
import { getCategoryConfig } from '../utils/categoryUtils';

export function Categories({ isDarkTheme = false, onNavigate }) {
    const bgColor = isDarkTheme ? 'bg-neutral-900' : 'bg-stone-50';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
    const textSecondary = isDarkTheme ? 'text-neutral-300' : 'text-stone-700';
    const borderColor = isDarkTheme ? 'border-neutral-800' : 'border-stone-300';
    const hoverBorder = isDarkTheme ? 'hover:border-orange-500' : 'hover:border-teal-400';
    const cardBg = isDarkTheme ? 'bg-neutral-800' : 'bg-white';
    
    const [categories, setCategories] = useState([]);
    const [categoryCounts, setCategoryCounts] = useState({});
    const [loading, setLoading] = useState(true);

    // Загружаем категории и количество объявлений
    useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoading(true);
                const categoriesData = await categoriesAPI.getAllCategories();
                setCategories(categoriesData || []);

                // Загружаем количество объявлений для каждой категории
                const counts = {};
                for (const category of categoriesData || []) {
                    try {
                        const adsData = await adsAPI.searchAds({
                            categoryId: category.id,
                            page: 1,
                            size: 1
                        });
                        counts[category.id] = adsData.totalElements || 0;
                    } catch (error) {
                        console.error(`Ошибка при загрузке количества объявлений для категории ${category.id}:`, error);
                        counts[category.id] = 0;
                    }
                }
                setCategoryCounts(counts);
            } catch (error) {
                console.error('Ошибка при загрузке категорий:', error);
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };

        loadCategories();
    }, []);

    const handleCategoryClick = (categoryId) => {
        if (onNavigate) {
            // Переходим на страницу объявлений с фильтром по категории
            onNavigate('all-listings', { categoryId });
        }
    };

    const formatCount = (count) => {
        if (count === 0) return '0';
        if (count < 1000) return count.toString();
        if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
        return `${(count / 1000000).toFixed(1)}M`;
    };

    return (
        <section id="categories" className={`py-16 ${bgColor}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className={`text-3xl font-bold ${textColor} mb-3`}>
                        Популярные категории
                    </h2>
                    <p className={`text-lg ${textSecondary}`}>
                        Выберите категорию для быстрого поиска
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <p className={textSecondary}>Загрузка категорий...</p>
                    </div>
                ) : categories.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {categories.map((category) => {
                            const config = getCategoryConfig(category.name);
                            const Icon = config.icon;
                            const count = categoryCounts[category.id] || 0;
                            
                            return (
                                <button
                                    key={category.id}
                                    onClick={() => handleCategoryClick(category.id)}
                                    className={`flex flex-col items-center p-6 rounded-xl border ${borderColor} ${hoverBorder} hover:shadow-md transition-all ${cardBg} group`}
                                >
                                    <div className={`w-12 h-12 rounded-lg ${isDarkTheme ? config.darkColor : config.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <span className={`${textColor} text-center mb-1 font-medium`}>
                                        {category.name}
                                    </span>
                                    <span className={`text-sm ${isDarkTheme ? 'text-neutral-400' : 'text-stone-600'}`}>
                                        {formatCount(count)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className={textSecondary}>Нет доступных категорий</p>
                    </div>
                )}
            </div>
        </section>
    );
}