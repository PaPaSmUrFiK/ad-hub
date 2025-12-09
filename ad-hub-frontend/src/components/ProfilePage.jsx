import { useState, useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { User, MapPin, Star, Package, Plus, Edit, Settings, Camera, Lock, Upload, Loader2, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ListingCard } from './ListingCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { userAPI } from '../api/user';
import { adsAPI } from '../api/ads';
import { favoritesAPI } from '../api/favorites';
import { getPrimaryImage, formatPrice } from '../utils/categoryUtils';
import { ImageWithFallback } from './ui/ImageWithFallback';
import { tokenStorage } from '../api/auth';

export function ProfilePage({
                                isDarkTheme,
                                onToggleTheme,
                                isAuthenticated,
                                onLoginClick,
                                onLogout,
                                onNavigate,
                                onViewListing,
                                onCreateListing,
                                onEditDraft,
                                isAdmin = false,
                                isModerator = false
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
    const [moderationAds, setModerationAds] = useState([]);
    const [draftAds, setDraftAds] = useState([]);
    const [archivedAds, setArchivedAds] = useState([]);
    const [publishingAdId, setPublishingAdId] = useState(null);
    const [deletingDraftId, setDeletingDraftId] = useState(null);
    const [favoriteAdIds, setFavoriteAdIds] = useState(new Set());
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
    const [showPasswordFields, setShowPasswordFields] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [passwordError, setPasswordError] = useState('');

    // Загружаем данные профиля при монтировании компонента
    useEffect(() => {
        if (isAuthenticated) {
            loadProfileData();
            loadFavorites();
        } else {
            setLoading(false);
            setFavoriteAdIds(new Set());
        }
    }, [isAuthenticated]);

    // Загружаем избранные объявления
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

    const handlePublishAd = async (adId) => {
        if (!window.confirm('Вы уверены, что хотите опубликовать это объявление? Оно будет отправлено на модерацию.')) {
            return;
        }

        try {
            setPublishingAdId(adId);
            setError('');
            await adsAPI.publishAd(adId);
            // Перезагружаем данные профиля
            await loadProfileData();
            alert('Объявление отправлено на модерацию');
        } catch (err) {
            console.error('Ошибка при публикации объявления:', err);
            setError(err.message || 'Не удалось опубликовать объявление');
        } finally {
            setPublishingAdId(null);
        }
    };

    const handleDeleteDraft = async (adId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот черновик?')) {
            return;
        }

        try {
            setDeletingDraftId(adId);
            setError('');
            await adsAPI.deleteAd(adId);
            // Перезагружаем данные профиля
            await loadProfileData();
            alert('Черновик удален');
        } catch (err) {
            console.error('Ошибка при удалении черновика:', err);
            setError(err.message || 'Не удалось удалить черновик');
        } finally {
            setDeletingDraftId(null);
        }
    };

    // Обработчик изменения избранного
    const handleFavoriteToggle = async (adId) => {
        if (!isAuthenticated || !tokenStorage.isAuthenticated()) {
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

            // Загружаем все объявления пользователя (без фильтра по статусу)
            let activeAdsData = null;
            let moderationAdsData = null;
            let draftAdsData = null;
            try {
                const userId = profileData.id || profileData.userId;
                if (userId) {
                    // Загружаем активные объявления
                    activeAdsData = await adsAPI.getAdsByUserId(userId, { status: 'ACTIVE', page: 1, size: 100 });
                    setActiveAds(activeAdsData.content || []);
                    
                    // Загружаем объявления на модерации
                    moderationAdsData = await adsAPI.getAdsByUserId(userId, { status: 'ON_MODERATION', page: 1, size: 100 });
                    setModerationAds(moderationAdsData.content || []);
                    
                    // Загружаем черновики
                    draftAdsData = await adsAPI.getAdsByUserId(userId, { status: 'DRAFT', page: 1, size: 100 });
                    setDraftAds(draftAdsData.content || []);
                } else {
                    setActiveAds([]);
                    setModerationAds([]);
                    setDraftAds([]);
                }
            } catch (err) {
                console.error('Ошибка при загрузке объявлений:', err);
                setActiveAds([]);
                setModerationAds([]);
                setDraftAds([]);
            }

            // Загружаем архивные объявления (ARCHIVED, BLOCKED, DELETED)
            try {
                const userId = profileData.id || profileData.userId;
                if (userId) {
                    // Загружаем архивные, заблокированные и удаленные объявления
                    const archivedAdsData = await adsAPI.getAdsByUserId(userId, { status: 'ARCHIVED', page: 1, size: 100 });
                    const blockedAdsData = await adsAPI.getAdsByUserId(userId, { status: 'BLOCKED', page: 1, size: 100 });
                    const deletedAdsData = await adsAPI.getAdsByUserId(userId, { status: 'DELETED', page: 1, size: 100 });
                    setArchivedAds([
                        ...(archivedAdsData.content || []), 
                        ...(blockedAdsData.content || []), 
                        ...(deletedAdsData.content || [])
                    ]);
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
        setShowPasswordFields(false);
        setPasswordForm({
            newPassword: '',
            confirmPassword: '',
        });
        setPasswordError('');
    };

    const handleSaveProfile = async () => {
        try {
            setError('');
            setPasswordError('');


            // Обновляем профиль
            const updatedProfile = await userAPI.updateProfile(editForm);
            setProfile(updatedProfile);
            setIsEditing(false);
            setShowPasswordFields(false);
            setPasswordForm({
                newPassword: '',
                confirmPassword: '',
            });
            setPasswordError('');
        } catch (err) {
            console.error('Ошибка при обновлении профиля:', err);
            setError(err.message || 'Не удалось обновить профиль');
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setShowPasswordFields(false);
        setPasswordForm({
            newPassword: '',
            confirmPassword: '',
        });
        setPasswordError('');
        if (profile) {
            setEditForm({
                username: profile.username || '',
                firstName: profile.firstName || '',
                lastName: profile.lastName || '',
                phone: profile.phone || '',
            });
        }
    };

    const handleChangePassword = async () => {
        setPasswordError('');

        // Валидация
        if (!passwordForm.newPassword) {
            setPasswordError('Введите новый пароль');
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            setPasswordError('Новый пароль должен содержать минимум 6 символов');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('Новые пароли не совпадают');
            return;
        }

        try {
            await userAPI.changePassword({
                newPassword: passwordForm.newPassword,
            });
            setShowPasswordFields(false);
            setPasswordForm({
                newPassword: '',
                confirmPassword: '',
            });
            setPasswordError('');
            alert('Пароль успешно изменен');
        } catch (err) {
            console.error('Ошибка при смене пароля:', err);
            setPasswordError(err.message || 'Не удалось изменить пароль');
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
        
        // Получаем все изображения из mediaFiles
        const allImages = ad.mediaFiles && ad.mediaFiles.length > 0
            ? ad.mediaFiles
                .filter(media => media.fileType === 'IMAGE')
                .sort((a, b) => {
                    // Сначала primary, потом по displayOrder
                    if (a.isPrimary) return -1;
                    if (b.isPrimary) return 1;
                    return (a.displayOrder || 0) - (b.displayOrder || 0);
                })
                .map(media => media.fileUrl)
            : [];
        
        return {
            id: ad.id,
            title: ad.title,
            price: formatPrice(ad.price, ad.currency),
            location: ad.location || 'Не указано',
            image: primaryImage || 'https://via.placeholder.com/400x300?text=No+Image',
            images: allImages.length > 0 ? allImages : (primaryImage ? [primaryImage] : []),
            isNew: isNew,
            isFeatured: ad.viewCount > 100,
            views: ad.viewCount || 0,
            status: ad.status, // Передаем статус объявления
            isFavorite: favoriteAdIds.has(ad.id), // Передаем состояние избранного
            onFavoriteToggle: () => handleFavoriteToggle(ad.id), // Обработчик изменения избранного
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
                isModerator={isModerator}
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
                                    
                                    {/* Кнопка и форма смены пароля */}
                                    <div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className={`w-full ${borderColor}`}
                                            onClick={() => setShowPasswordFields(!showPasswordFields)}
                                        >
                                            <Lock className="h-4 w-4 mr-2" />
                                            {showPasswordFields ? 'Скрыть смену пароля' : 'Сменить пароль'}
                                        </Button>
                                        
                                        {/* Поля смены пароля */}
                                        {showPasswordFields && (
                                            <div className={`mt-3 space-y-3 p-4 rounded-lg border ${borderColor} ${isDarkTheme ? 'bg-neutral-800/50' : 'bg-stone-50'}`}>
                                                {passwordError && (
                                                    <div className={`p-3 rounded-lg ${isDarkTheme ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'} text-sm`}>
                                                        {passwordError}
                                                    </div>
                                                )}
                                                <div>
                                                    <label className={`block text-sm ${textSecondary} mb-1`}>Новый пароль *</label>
                                                    <input
                                                        type="password"
                                                        value={passwordForm.newPassword}
                                                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                                        placeholder="Минимум 6 символов"
                                                        className={`w-full px-3 py-2 rounded-lg border ${borderColor} ${isDarkTheme ? 'bg-neutral-800 text-neutral-100' : 'bg-white text-stone-900'}`}
                                                        minLength={6}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block text-sm ${textSecondary} mb-1`}>Подтвердите новый пароль *</label>
                                                    <input
                                                        type="password"
                                                        value={passwordForm.confirmPassword}
                                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                                        placeholder="Повторите новый пароль"
                                                        className={`w-full px-3 py-2 rounded-lg border ${borderColor} ${isDarkTheme ? 'bg-neutral-800 text-neutral-100' : 'bg-white text-stone-900'}`}
                                                        minLength={6}
                                                    />
                                                </div>
                                                <Button
                                                    className={`w-full ${buttonBg} text-white`}
                                                    onClick={handleChangePassword}
                                                    disabled={!passwordForm.newPassword || !passwordForm.confirmPassword}
                                                >
                                                    <Lock className="h-4 w-4 mr-2" />
                                                    Изменить пароль
                                                </Button>
                                            </div>
                                        )}
                                    </div>
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
                                    value="moderation"
                                    className={isDarkTheme
                                        ? 'data-[state=active]:bg-orange-600 data-[state=active]:text-white text-neutral-300'
                                        : 'data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700'
                                    }
                                >
                                    На модерации ({moderationAds.length})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="draft"
                                    className={isDarkTheme
                                        ? 'data-[state=active]:bg-orange-600 data-[state=active]:text-white text-neutral-300'
                                        : 'data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700'
                                    }
                                >
                                    Черновики ({draftAds.length})
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

                            <TabsContent value="moderation" className="mt-6">
                                {moderationAds.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {moderationAds.map((ad) => {
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
                                                                <span className={`${isDarkTheme ? 'text-yellow-400' : 'text-yellow-600'} font-medium`}>
                                                                    ⏳ На модерации
                                                                </span>
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
                                        <h3 className={`${textColor} text-xl font-semibold mb-2`}>Нет объявлений на модерации</h3>
                                        <p className={textMuted}>Все ваши объявления уже прошли модерацию</p>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="draft" className="mt-6">
                                {draftAds.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        {draftAds.map((ad) => {
                                            const cardData = mapAdToCard(ad);
                                            return (
                                                <div key={ad.id} className="space-y-3">
                                                    <ListingCard
                                                        {...cardData}
                                                        isDarkTheme={isDarkTheme}
                                                        onClick={() => onEditDraft && onEditDraft(ad)}
                                                    />
                                                    <div className={`${cardBg} rounded-lg border ${borderColor} p-3`}>
                                                        <div className="flex items-center justify-between text-sm">
                                                            <div>
                                                                <span className={`${isDarkTheme ? 'text-gray-400' : 'text-gray-600'} font-medium`}>
                                                                    📝 Черновик
                                                                </span>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteDraft(ad.id)}
                                                                disabled={deletingDraftId === ad.id}
                                                                className={`${isDarkTheme ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                                                            >
                                                                {deletingDraftId === ad.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className={`${cardBg} rounded-xl border ${borderColor} p-12 text-center`}>
                                        <Package className={`h-12 w-12 ${textMuted} mx-auto mb-4`} />
                                        <h3 className={`${textColor} text-xl font-semibold mb-2`}>Нет черновиков</h3>
                                        <p className={textMuted}>Здесь будут отображаться ваши неопубликованные объявления</p>
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
                                                    <div className={`${cardBg} rounded-lg border ${borderColor} p-3`}>
                                                        <Button
                                                            className={`w-full ${buttonBg} text-white`}
                                                            onClick={() => handlePublishAd(ad.id)}
                                                            disabled={publishingAdId === ad.id}
                                                        >
                                                            {publishingAdId === ad.id ? (
                                                                <>
                                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                                    Публикация...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Upload className="h-4 w-4 mr-2" />
                                                                    Опубликовать
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
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