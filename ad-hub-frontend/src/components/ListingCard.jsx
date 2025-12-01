import { useState, useEffect } from 'react';
import { Heart, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ImageWithFallback } from './ui/ImageWithFallback';
import { favoritesAPI } from '../api/favorites';
import { tokenStorage } from '../api/auth';

export function ListingCard({
                                id,
                                title,
                                price,
                                location,
                                image, // Одно изображение (для обратной совместимости)
                                images, // Массив изображений (приоритет над image)
                                isNew,
                                isFeatured,
                                isDarkTheme = false,
                                onClick,
                                isFavorite: initialIsFavorite = false,
                                onFavoriteToggle,
                                status // Статус объявления (ACTIVE, DRAFT, ON_MODERATION, etc.)
                            }) {
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [isToggling, setIsToggling] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    
    // Определяем массив изображений
    const allImages = images && images.length > 0 ? images : (image ? [image] : []);
    const currentImage = allImages[currentImageIndex] || image;
    
    // Синхронизируем состояние с пропсом только если пользователь не взаимодействовал
    useEffect(() => {
        if (!hasUserInteracted) {
            setIsFavorite(initialIsFavorite);
        }
    }, [initialIsFavorite, hasUserInteracted]);
    
    // Сбрасываем индекс при изменении изображений
    useEffect(() => {
        setCurrentImageIndex(0);
    }, [images, image]);
    
    const handlePreviousImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1));
    };
    
    const handleNextImage = (e) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0));
    };
    
    const cardBg = isDarkTheme ? 'bg-neutral-800' : 'bg-white';
    const borderColor = isDarkTheme ? 'border-neutral-700' : 'border-stone-300';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
    const hoverTextColor = isDarkTheme ? 'group-hover:text-orange-500' : 'group-hover:text-teal-700';
    // Фон одинаковый для избранного и не избранного на обеих темах, чтобы красное сердце было лучше видно
    const iconBg = isDarkTheme ? 'bg-white/80 hover:bg-white/90' : 'bg-white/80 hover:bg-white/90';
    const favoriteIconBg = iconBg;

    // Функция для выполнения API запроса
    const performFavoriteToggle = async (wasFavorite) => {
        if (wasFavorite) {
            // Было в избранном, теперь удаляем
            await favoritesAPI.removeFromFavorites(id);
        } else {
            // Не было в избранном, теперь добавляем
            await favoritesAPI.addToFavorites(id);
        }
    };

    // Проверяем, можно ли добавлять в избранное (только ACTIVE объявления)
    const canAddToFavorites = !status || status === 'ACTIVE';

    const handleFavoriteClick = async (e) => {
        e.stopPropagation();
        
        // Если не авторизован, ничего не делаем
        if (!tokenStorage.isAuthenticated()) {
            return;
        }

        // Если объявление не активное, нельзя добавлять в избранное
        if (!canAddToFavorites && !isFavorite) {
            return;
        }

        if (isToggling) return;
        
        // Оптимистичное обновление - сразу меняем состояние для мгновенной перерисовки
        const wasFavorite = isFavorite;
        const newFavoriteState = !wasFavorite;
        setHasUserInteracted(true); // Помечаем, что пользователь взаимодействовал
        setIsFavorite(newFavoriteState);
        setIsToggling(true);
            
        // Если передан callback, вызываем его ДО API запроса для оптимистичного обновления родительского компонента
        // Это нужно для всех страниц (избранное, объявления, профиль, главная), чтобы состояние обновлялось мгновенно
            if (onFavoriteToggle) {
                onFavoriteToggle(e);
            }
        
        try {
            await performFavoriteToggle(wasFavorite);
        } catch (error) {
            console.error('Ошибка при изменении избранного:', error);
            // Откатываем изменение при ошибке
            setIsFavorite(wasFavorite);
            setHasUserInteracted(false); // Сбрасываем флаг при ошибке, чтобы можно было синхронизировать
            // Если callback был вызван до запроса и произошла ошибка,
            // родительский компонент должен сам обработать откат (например, перезагрузить список)
            // Мы не вызываем callback повторно, чтобы не создавать двойной откат
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <div
            className={`${cardBg} rounded-xl border ${borderColor} overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer`}
            onClick={onClick}
        >
            <div className={`relative aspect-[4/3] overflow-hidden ${isDarkTheme ? 'bg-neutral-900' : 'bg-stone-200'}`}>
                <ImageWithFallback
                    src={currentImage}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Нумерация в верхнем левом углу */}
                {allImages.length > 1 && (
                    <div className={`absolute top-3 left-3 z-10 px-2 py-1 rounded-full ${isDarkTheme ? 'bg-neutral-800/80' : 'bg-white/80'} ${isDarkTheme ? 'text-neutral-100' : 'text-stone-900'} text-xs font-medium shadow-lg`}>
                        {currentImageIndex + 1} / {allImages.length}
                    </div>
                )}
                
                {/* Кнопка избранного в правом верхнем углу */}
                {tokenStorage.isAuthenticated() && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`absolute top-3 right-3 z-10 ${favoriteIconBg} h-8 w-8 rounded-full transition-all duration-200 ${isToggling ? 'opacity-50' : ''} ${!canAddToFavorites && !isFavorite ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 active:scale-95'}`}
                        onClick={handleFavoriteClick}
                        disabled={isToggling || (!canAddToFavorites && !isFavorite)}
                        title={!canAddToFavorites && !isFavorite ? 'В избранное можно добавлять только активные объявления' : (isFavorite ? 'Удалить из избранного' : 'Добавить в избранное')}
                    >
                        <Heart 
                            className={`h-4 w-4 transition-all duration-200 ${
                                isFavorite 
                                    ? 'fill-current text-red-600 scale-110' 
                                    : `stroke-2 ${isDarkTheme ? 'stroke-neutral-100' : 'stroke-black'} fill-none hover:scale-110`
                            }`} 
                        />
                    </Button>
                )}
                
                {/* Стрелки навигации - всегда видны */}
                {allImages.length > 1 && (
                    <>
                        <button
                            onClick={handlePreviousImage}
                            className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full ${isDarkTheme ? 'bg-neutral-800/80 hover:bg-neutral-700/90' : 'bg-white/80 hover:bg-white/90'} ${isDarkTheme ? 'text-neutral-100' : 'text-stone-900'} transition-all shadow-lg`}
                            aria-label="Предыдущее изображение"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={handleNextImage}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full ${isDarkTheme ? 'bg-neutral-800/80 hover:bg-neutral-700/90' : 'bg-white/80 hover:bg-white/90'} ${isDarkTheme ? 'text-neutral-100' : 'text-stone-900'} transition-all shadow-lg`}
                            aria-label="Следующее изображение"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </>
                )}
            </div>

            <div className="p-4">
                <h3 className={`${textColor} mb-2 line-clamp-2 ${hoverTextColor} transition-colors`}>
                    {title}
                </h3>
                <div className={`${textColor} mb-3 font-semibold`}>
                    {price}
                </div>
                <div className={`flex items-center gap-1 ${isDarkTheme ? 'text-neutral-400' : 'text-stone-600'}`}>
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{location}</span>
                </div>
            </div>
        </div>
    );
}