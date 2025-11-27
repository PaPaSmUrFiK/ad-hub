import { useState, useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { ChevronRight, Loader2 } from 'lucide-react';
import { categoriesAPI } from '../api/categories';
import { adsAPI } from '../api/ads';
import { getCategoryConfig } from '../utils/categoryUtils';

export function CategoriesPage({
  isDarkTheme,
  onToggleTheme,
  isAuthenticated,
  onLoginClick,
  onLogout,
  onNavigate
}) {
  const bgColor = isDarkTheme ? 'bg-neutral-950' : 'bg-stone-100';
  const cardBg = isDarkTheme ? 'bg-neutral-900' : 'bg-white';
  const borderColor = isDarkTheme ? 'border-neutral-800' : 'border-stone-200';
  const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
  const textSecondary = isDarkTheme ? 'text-neutral-300' : 'text-stone-700';
  const textMuted = isDarkTheme ? 'text-neutral-400' : 'text-stone-600';
  const hoverBg = isDarkTheme ? 'hover:bg-neutral-800' : 'hover:bg-stone-50';

  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Загружаем категории и количество объявлений
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError('');
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
        setError('Не удалось загрузить категории');
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
    <div className={`min-h-screen ${bgColor}`}>
      <Header
        onLoginClick={onLoginClick}
        onRegisterClick={onLoginClick}
        onFavoritesClick={() => onNavigate('favorites')}
        onLogout={onLogout}
        isAuthenticated={isAuthenticated}
        isDarkTheme={isDarkTheme}
        onToggleTheme={onToggleTheme}
        currentPage="categories"
        onNavigate={onNavigate}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className={`${textColor} mb-2 text-3xl font-bold`}>Все категории</h1>
          <p className={textSecondary}>Выберите категорию для просмотра объявлений</p>
        </div>

        {error && (
          <div className={`mb-4 p-3 rounded ${isDarkTheme ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'}`}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className={`h-8 w-8 ${textMuted} mx-auto animate-spin`} />
            <p className={`${textMuted} mt-2`}>Загрузка категорий...</p>
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => {
              const config = getCategoryConfig(category.name);
              const Icon = config.icon;
              const count = categoryCounts[category.id] || 0;
              
              return (
                <div
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`${cardBg} rounded-xl border ${borderColor} p-6 ${hoverBg} transition-all cursor-pointer group`}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 rounded-xl ${isDarkTheme ? config.darkColor : config.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={textColor}>{category.name}</h3>
                        <ChevronRight className={`h-5 w-5 ${textMuted} ${isDarkTheme ? 'group-hover:text-orange-500' : 'group-hover:text-teal-600'} transition-colors`} />
                      </div>
                      <p className={textMuted}>{formatCount(count)} объявлений</p>
                    </div>
                  </div>
                  
                  {category.description && (
                    <div className={`mt-4 pt-4 border-t ${borderColor}`}>
                      <p className={`${textSecondary} text-sm leading-relaxed`}>
                        {category.description}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className={textSecondary}>Нет доступных категорий</p>
          </div>
        )}
      </div>

      <Footer isDarkTheme={isDarkTheme} />
    </div>
  );
}
