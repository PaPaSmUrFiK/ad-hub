import { useState } from 'react';
import { Heart, MapPin } from 'lucide-react';
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
                                image,
                                isNew,
                                isFeatured,
                                isDarkTheme = false,
                                onClick,
                                isFavorite: initialIsFavorite = false,
                                onFavoriteToggle
                            }) {
    const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
    const [isToggling, setIsToggling] = useState(false);
    
    const cardBg = isDarkTheme ? 'bg-neutral-800' : 'bg-white';
    const borderColor = isDarkTheme ? 'border-neutral-700' : 'border-stone-300';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
    const hoverTextColor = isDarkTheme ? 'group-hover:text-orange-500' : 'group-hover:text-teal-700';
    const iconBg = isDarkTheme ? 'bg-neutral-700/90 hover:bg-neutral-700 text-neutral-300' : 'bg-white/90 hover:bg-white text-stone-700';
    const favoriteIconBg = isFavorite 
        ? (isDarkTheme ? 'bg-orange-600/20 text-orange-500' : 'bg-teal-100 text-teal-700')
        : iconBg;

    const handleFavoriteClick = async (e) => {
        e.stopPropagation();
        
        // Если не авторизован, ничего не делаем
        if (!tokenStorage.isAuthenticated()) {
            return;
        }

        if (isToggling) return;
        
        setIsToggling(true);
        try {
            if (isFavorite) {
                await favoritesAPI.removeFromFavorites(id);
                setIsFavorite(false);
            } else {
                await favoritesAPI.addToFavorites(id);
                setIsFavorite(true);
            }
            
            // Вызываем callback, если он передан
            if (onFavoriteToggle) {
                onFavoriteToggle(e);
            }
        } catch (error) {
            console.error('Ошибка при изменении избранного:', error);
            // Можно показать уведомление об ошибке
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
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {tokenStorage.isAuthenticated() && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className={`absolute top-3 right-3 ${favoriteIconBg} h-8 w-8 rounded-full transition-colors ${isToggling ? 'opacity-50' : ''}`}
                        onClick={handleFavoriteClick}
                        disabled={isToggling}
                    >
                        <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                    </Button>
                )}
                {(isNew || isFeatured) && (
                    <div className="absolute top-3 left-3 flex gap-2">
                        {isNew && (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                                Новое
                            </Badge>
                        )}
                        {isFeatured && (
                            <Badge className={`${isDarkTheme ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700'} text-white border-0`}>
                                VIP
                            </Badge>
                        )}
                    </div>
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