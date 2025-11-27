import { useState, useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { User, MapPin, Star, Package, Plus, Edit, Settings, Camera } from 'lucide-react';
import { Button } from './ui/button';
import { ListingCard } from './ListingCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { userAPI } from '../api/user';
import { adsAPI } from '../api/ads';
import { favoritesAPI } from '../api/favorites';
import { getPrimaryImage, formatPrice } from '../utils/categoryUtils';
import { ImageWithFallback } from './ui/ImageWithFallback';

export function ProfilePage({
                                isDarkTheme,
                                onToggleTheme,
                                isAuthenticated,
                                onLoginClick,
                                onLogout,
                                onNavigate,
                                onViewListing,
                                onCreateListing,
                                isAdmin = false
                            }) {
    const bgColor = isDarkTheme ? 'bg-neutral-950' : 'bg-stone-100';
    const cardBg = isDarkTheme ? 'bg-neutral-900' : 'bg-white';
    const borderColor = isDarkTheme ? 'border-neutral-800' : 'border-stone-200';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
    const textSecondary = isDarkTheme ? 'text-neutral-300' : 'text-stone-700';
    const textMuted = isDarkTheme ? 'text-neutral-400' : 'text-stone-600';
    const buttonBg = isDarkTheme ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700';
    
    const [profile, setProfile] = useState(null);
    const [activeAds, setActiveAds] = useState([]);
    const [archivedAds, setArchivedAds] = useState([]);
    const [stats, setStats] = useState({
        activeCount: 0,
        totalViews: 0,
        favoritesCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('active');
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        username: '',
        firstName: '',
        lastName: '',
        phone: '',
    });

    // Загружаем данные профиля при монтировании компонента
    useEffect(() => {
        if (isAuthenticated) {
            loadProfileData();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const loadProfileData = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Загружаем профиль
            const profileData = await userAPI.getProfile();
            setProfile(profileData);
            setEditForm({
                username: profileData.username || '',
                firstName: profileData.firstName || '',
                lastName: profileData.lastName || '',
                phone: profileData.phone || '',
            });

            // Загружаем активные объявления пользователя
            let activeAdsData = null;
            try {
                const userId = profileData.id || profileData.userId;
                if (userId) {
                    // Используем новый endpoint для получения объявлений пользователя
                    activeAdsData = await adsAPI.getAdsByUserId(userId, { status: 'ACTIVE', page: 1, size: 100 });
                    setActiveAds(activeAdsData.content || []);
                } else {
                    setActiveAds([]);
                }
            } catch (err) {
                console.error('Ошибка при загрузке активных объявлений:', err);
                setActiveAds([]);
            }

            // Загружаем архивные объявления (SOLD, ARCHIVED и т.д.)
            try {
                const userId = profileData.id || profileData.userId;
                if (userId) {
                    // Используем новый endpoint для получения объявлений пользователя
                    const archivedAdsData = await adsAPI.getAdsByUserId(userId, { status: 'SOLD', page: 1, size: 100 });
                    setArchivedAds(archivedAdsData.content || []);
                } else {
                    setArchivedAds([]);
                }
            } catch (err) {
                console.error('Ошибка при загрузке архивных объявлений:', err);
                setArchivedAds([]);
            }

            // Загружаем статистику
            const activeAdsList = activeAdsData?.content || [];
            const totalViews = activeAdsList.reduce((sum, ad) => sum + (ad.viewCount || 0), 0);
            let favoritesData = { totalCount: 0 };
            try {
                favoritesData = await favoritesAPI.getFavorites();
            } catch (err) {
                console.error('Ошибка при загрузке избранного:', err);
            }
            
            setStats({
                activeCount: activeAdsList.length,
                totalViews: totalViews,
                favoritesCount: favoritesData.totalCount || 0,
            });
        } catch (err) {
            console.error('Ошибка при загрузке профиля:', err);
            setError(err.message || 'Не удалось загрузить данные профиля');
        } finally {
            setLoading(false);
        }
    };

    const handleEditProfile = () => {
        setIsEditing(true);
    };

    const handleSaveProfile = async () => {
        try {
            setError('');
            const updatedProfile = await userAPI.updateProfile(editForm);
            setProfile(updatedProfile);
            setIsEditing(false);
        } catch (err) {
            console.error('Ошибка при обновлении профиля:', err);
            setError(err.message || 'Не удалось обновить профиль');
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        if (profile) {
            setEditForm({
                username: profile.username || '',
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                phone: profile.phone || '',
            });
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setError('');
            const result = await userAPI.uploadAvatar(file);
            await loadProfileData(); // Перезагружаем профиль
        } catch (err) {
            console.error('Ошибка при загрузке аватара:', err);
            setError(err.message || 'Не удалось загрузить аватар');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
    };

    const formatPhone = (phone) => {
        if (!phone) return 'Не указано';
        return phone;
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
            views: ad.viewCount || 0,
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
                currentPage="profile"
                onNavigate={onNavigate}
                hideCreateButton={true}
                isAdmin={isAdmin}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className={`mb-4 p-3 ${isDarkTheme ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-700'} border rounded-lg`}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-16">
                        <p className={textSecondary}>Загрузка профиля...</p>
                    </div>
                ) : !isAuthenticated ? (
                    <div className="text-center py-16">
                        <h3 className={`${textColor} text-xl font-semibold mb-2`}>Необходима авторизация</h3>
                        <p className={`${textSecondary} mb-6`}>Войдите, чтобы просматривать профиль</p>
                        <Button
                            className={`${buttonBg} text-white`}
                            onClick={onLoginClick}
                        >
                            Войти
                        </Button>
                    </div>
                ) : profile ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Profile Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* User Info Card */}
                        <div className={`${cardBg} rounded-xl border ${borderColor} p-6`}>
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="relative">
                                    <div className={`w-24 h-24 rounded-full ${isDarkTheme ? 'bg-neutral-800' : 'bg-stone-200'} overflow-hidden flex items-center justify-center mb-4`}>
                                        {profile.avatarUrl ? (
                                            <ImageWithFallback
                                                src={profile.avatarUrl}
                                                alt={profile.username}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className={`h-12 w-12 ${textMuted}`} />
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 bg-teal-600 hover:bg-teal-700 text-white rounded-full p-2 cursor-pointer">
                                        <Camera className="h-4 w-4" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleAvatarUpload}
                                        />
                                    </label>
                                </div>
                                <h2 className={`${textColor} text-xl font-bold mb-1`}>
                                    {profile.firstName && profile.lastName 
                                        ? `${profile.firstName} ${profile.lastName}`
                                        : profile.username}
                                </h2>
                                <p className={textMuted}>{profile.email}</p>
                            </div>

                            {isEditing ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className={`block text-sm ${textSecondary} mb-1`}>Имя пользователя</label>
                                        <input
                                            type="text"
                                            value={editForm.username}
                                            onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                                            className={`w-full px-3 py-2 rounded-lg border ${borderColor} ${isDarkTheme ? 'bg-neutral-800 text-neutral-100' : 'bg-white text-stone-900'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm ${textSecondary} mb-1`}>Имя</label>
                                        <input
                                            type="text"
                                            value={editForm.firstName}
                                            onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                                            className={`w-full px-3 py-2 rounded-lg border ${borderColor} ${isDarkTheme ? 'bg-neutral-800 text-neutral-100' : 'bg-white text-stone-900'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm ${textSecondary} mb-1`}>Фамилия</label>
                                        <input
                                            type="text"
                                            value={editForm.lastName}
                                            onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                                            className={`w-full px-3 py-2 rounded-lg border ${borderColor} ${isDarkTheme ? 'bg-neutral-800 text-neutral-100' : 'bg-white text-stone-900'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-sm ${textSecondary} mb-1`}>Телефон</label>
                                        <input
                                            type="tel"
                                            value={editForm.phone}
                                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                            placeholder="+375 (XX) XXX-XX-XX"
                                            className={`w-full px-3 py-2 rounded-lg border ${borderColor} ${isDarkTheme ? 'bg-neutral-800 text-neutral-100' : 'bg-white text-stone-900'}`}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            className={`flex-1 ${buttonBg} text-white`}
                                            onClick={handleSaveProfile}
                                        >
                                            Сохранить
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className={`flex-1 ${borderColor}`}
                                            onClick={handleCancelEdit}
                                        >
                                            Отмена
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <Button
                                        variant="outline"
                                        className={`w-full ${borderColor}`}
                                        onClick={handleEditProfile}
                                    >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Редактировать профиль
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Stats Card */}
                        <div className={`${cardBg} rounded-xl border ${borderColor} p-6`}>
                            <h3 className={`${textColor} text-lg font-semibold mb-4`}>Статистика</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className={textMuted}>Активных объявлений</span>
                                    <span className={`${textColor} font-medium`}>{stats.activeCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={textMuted}>Всего просмотров</span>
                                    <span className={`${textColor} font-medium`}>{stats.totalViews}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={textMuted}>В избранном</span>
                                    <span className={`${textColor} font-medium`}>{stats.favoritesCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className={textMuted}>На сайте с</span>
                                    <span className={`${textColor} font-medium`}>{formatDate(profile.createdAt)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Location Card */}
                        {profile.phone && (
                            <div className={`${cardBg} rounded-xl border ${borderColor} p-6`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin className={`h-5 w-5 ${isDarkTheme ? 'text-orange-500' : 'text-teal-600'}`} />
                                    <h3 className={`${textColor} font-medium`}>Контакты</h3>
                                </div>
                                <p className={textSecondary}>{formatPhone(profile.phone)}</p>
                            </div>
                        )}
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <h1 className={`${textColor} text-2xl font-bold`}>Мои объявления</h1>
                            <Button
                                className={`${buttonBg} text-white shadow-md`}
                                onClick={onCreateListing}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Разместить объявление
                            </Button>
                        </div>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className={isDarkTheme ? 'bg-neutral-800 border border-neutral-700' : 'bg-white border border-stone-300'}>
                                <TabsTrigger
                                    value="active"
                                    className={isDarkTheme
                                        ? 'data-[state=active]:bg-orange-600 data-[state=active]:text-white text-neutral-300'
                                        : 'data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700'
                                    }
                                >
                                    <Package className="h-4 w-4 mr-2" />
                                    Активные ({activeAds.length})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="archive"
                                    className={isDarkTheme
                                        ? 'data-[state=active]:bg-orange-600 data-[state=active]:text-white text-neutral-300'
                                        : 'data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700'
                                    }
                                >
                                    Архив ({archivedAds.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="active" className="mt-6">
                                {activeAds.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {activeAds.map((ad) => {
                                            const cardData = mapAdToCard(ad);
                                            return (
                                                <div key={ad.id} className="space-y-3">
                                                    <ListingCard
                                                        {...cardData}
                                                        isDarkTheme={isDarkTheme}
                                                        onClick={() => onViewListing && onViewListing(ad.id)}
                                                    />
                                                    <div className={`${cardBg} rounded-lg border ${borderColor} p-3`}>
                                                        <div className="flex items-center justify-between text-sm">
                                                            <div>
                                                                <span className={textMuted}>Просмотров: </span>
                                                                <span className={`${textColor} font-medium`}>{cardData.views}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className={`${cardBg} rounded-xl border ${borderColor} p-12 text-center`}>
                                        <Package className={`h-12 w-12 ${textMuted} mx-auto mb-4`} />
                                        <h3 className={`${textColor} text-xl font-semibold mb-2`}>Нет активных объявлений</h3>
                                        <p className={`${textMuted} mb-6`}>
                                            Начните продавать прямо сейчас
                                        </p>
                                        <Button
                                            className={`${buttonBg} text-white`}
                                            onClick={onCreateListing}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Создать объявление
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="archive" className="mt-6">
                                {archivedAds.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {archivedAds.map((ad) => {
                                            const cardData = mapAdToCard(ad);
                                            return (
                                                <div key={ad.id} className="space-y-3">
                                                    <ListingCard
                                                        {...cardData}
                                                        isDarkTheme={isDarkTheme}
                                                        onClick={() => onViewListing && onViewListing(ad.id)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className={`${cardBg} rounded-xl border ${borderColor} p-12 text-center`}>
                                        <Package className={`h-12 w-12 ${textMuted} mx-auto mb-4`} />
                                        <h3 className={`${textColor} text-xl font-semibold mb-2`}>Архив пуст</h3>
                                        <p className={textMuted}>Здесь появятся ваши архивные объявления</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
                ) : null}
            </div>

            <Footer isDarkTheme={isDarkTheme} />
        </div>
    );
}