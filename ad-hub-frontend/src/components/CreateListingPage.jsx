import { useState, useEffect } from 'react';
import { ArrowLeft, Upload, X, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Header } from './Header';
import { Footer } from './Footer';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { adsAPI } from '../api/ads';
import { categoriesAPI } from '../api/categories';
import { 
    validateAdTitle, 
    validateAdDescription, 
    validatePrice, 
    validateLocation, 
    validatePhone, 
    validateEmail 
} from '../utils/validation';

export function CreateListingPage({
                                      onBack,
                                      isDarkTheme,
                                      onToggleTheme,
                                      isAuthenticated,
                                      onLoginClick,
                                      onLogout,
                                      onNavigate
                                  }) {
    const [images, setImages] = useState([]); // Array of File objects
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        categoryId: '',
        description: '',
        price: '',
        currency: 'BYN',
        location: '',
        address: '',
        phone: '',
        email: '',
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
                setLoadingCategories(true);
                const data = await categoriesAPI.getAllCategories();
                setCategories(data || []);
            } catch (err) {
                console.error('Ошибка при загрузке категорий:', err);
                setError('Не удалось загрузить категории. Попробуйте обновить страницу.');
            } finally {
                setLoadingCategories(false);
            }
        };
        loadCategories();
    }, []);

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        const remainingSlots = 10 - images.length;
        const filesToAdd = files.slice(0, remainingSlots);
        setImages([...images, ...filesToAdd]);
    };

    const handleRemoveImage = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const formatPhone = (value) => {
        // Простой формат для телефона
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length === 0) return '';
        if (cleaned.length <= 1) return `+${cleaned}`;
        if (cleaned.length <= 4) return `+${cleaned.slice(0, 1)} (${cleaned.slice(1)}`;
        if (cleaned.length <= 7) return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4)}`;
        if (cleaned.length <= 9) return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
        return `+${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
    };

    const [fieldErrors, setFieldErrors] = useState({});

    const validateForm = () => {
        const errors = {};
        
        // Валидация названия
        const titleError = validateAdTitle(formData.title);
        if (titleError) errors.title = titleError;
        
        // Валидация описания
        const descriptionError = validateAdDescription(formData.description);
        if (descriptionError) errors.description = descriptionError;
        
        // Валидация категории
        if (!formData.categoryId || formData.categoryId === '') {
            errors.categoryId = 'Необходимо выбрать категорию';
        }
        
        // Валидация цены
        const priceError = validatePrice(formData.price);
        if (priceError) errors.price = priceError;
        
        // Валидация местоположения
        const locationError = validateLocation(formData.location);
        if (locationError) errors.location = locationError;
        
        // Валидация телефона (необязателен, но если указан - должен быть корректным)
        if (formData.phone && formData.phone.trim()) {
            const phoneError = validatePhone(formData.phone, false);
            if (phoneError) errors.phone = phoneError;
        }
        
        // Валидация email (необязателен, но если указан - должен быть корректным)
        if (formData.email && formData.email.trim()) {
            const emailError = validateEmail(formData.email);
            if (emailError) errors.email = emailError;
        }
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setFieldErrors({});

        // Валидация формы
        if (!validateForm()) {
            const firstError = Object.values(fieldErrors)[0];
            setError(firstError || 'Пожалуйста, исправьте ошибки в форме');
            return;
        }
        if (!formData.categoryId) {
            setError('Выберите категорию');
            return;
        }
        if (!formData.price || parseFloat(formData.price) < 0) {
            setError('Введите корректную цену');
            return;
        }
        if (images.length === 0) {
            setError('Добавьте хотя бы одно фото');
            return;
        }

        try {
            setLoading(true);

            // Подготовка данных для создания объявления
            const locationStr = formData.address 
                ? `${formData.location}, ${formData.address}`.trim()
                : formData.location;

            const adData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                price: parseFloat(formData.price),
                currency: formData.currency || 'BYN',
                location: locationStr || null,
                categoryId: parseInt(formData.categoryId),
            };

            // Создаем объявление
            const createdAd = await adsAPI.createAd(adData);
            
            // Загружаем изображения
            try {
                for (const imageFile of images) {
                    await adsAPI.uploadMedia(createdAd.id, imageFile);
                }
            } catch (mediaError) {
                console.error('Ошибка при загрузке изображений:', mediaError);
                // Продолжаем даже если не все изображения загрузились
            }

            setSuccess(true);
            
            // Переходим на страницу объявления через 2 секунды
            setTimeout(() => {
                // Сохраняем ID созданного объявления для просмотра
                if (onNavigate) {
                    // Переходим на страницу профиля, где пользователь увидит свое новое объявление
                    onNavigate('profile');
                }
            }, 2000);

        } catch (err) {
            console.error('Ошибка при создании объявления:', err);
            setError(err.message || 'Не удалось создать объявление. Попробуйте еще раз.');
        } finally {
            setLoading(false);
        }
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
                currentPage="create-listing"
                onNavigate={onNavigate}
                hideCreateButton={true}
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Button
                    variant="ghost"
                    className={`mb-6 ${isDarkTheme ? 'text-neutral-300 hover:text-orange-400' : 'text-stone-700 hover:text-teal-600'}`}
                    onClick={onBack}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Вернуться к профилю
                </Button>

                <div className={`${cardBg} rounded-xl border ${borderColor} p-6 md:p-8`}>
                    <h1 className={`${textColor} text-2xl font-bold mb-6`}>Разместить объявление</h1>

                    {error && (
                        <div className={`mb-6 p-4 rounded-lg border ${isDarkTheme ? 'bg-red-900/20 border-red-800 text-red-400' : 'bg-red-50 border-red-200 text-red-700'} flex items-start gap-3`}>
                            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium">Ошибка</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    {success && (
                        <div className={`mb-6 p-4 rounded-lg border ${isDarkTheme ? 'bg-green-900/20 border-green-800 text-green-400' : 'bg-green-50 border-green-200 text-green-700'} flex items-start gap-3`}>
                            <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium">Успешно!</p>
                                <p className="text-sm">Объявление создано. Загружаются изображения...</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Images */}
                        <div>
                            <Label className={`${textColor} block mb-2 font-medium`}>Фотографии *</Label>
                            <p className={`${textMuted} mb-3 text-sm`}>
                                Добавьте до 10 фотографий. Первое фото будет главным.
                            </p>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {images.map((img, index) => (
                                    <div
                                        key={index}
                                        className={`relative aspect-square rounded-lg border ${borderColor} overflow-hidden ${isDarkTheme ? 'bg-neutral-800' : 'bg-stone-100'}`}
                                    >
                                        {img instanceof File ? (
                                            <img
                                                src={URL.createObjectURL(img)}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ImageIcon className={`h-8 w-8 ${textMuted}`} />
                                            </div>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveImage(index)}
                                            className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${isDarkTheme ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white flex items-center justify-center shadow-md`}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}

                                {images.length < 10 && (
                                    <label className={`aspect-square rounded-lg border-2 border-dashed ${borderColor} ${isDarkTheme ? 'hover:border-orange-500 hover:bg-neutral-800' : 'hover:border-teal-500 hover:bg-stone-50'} flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer`}>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageSelect}
                                            className="hidden"
                                            disabled={loading}
                                        />
                                        <Upload className={`h-6 w-6 ${textMuted}`} />
                                        <span className={`${textMuted} text-xs`}>Загрузить</span>
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <Label htmlFor="title" className={`${textColor} block mb-2 font-medium`}>Название *</Label>
                            <Input
                                id="title"
                                placeholder="Например: iPhone 15 Pro Max 256GB"
                                className={inputBg}
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                minLength={5}
                                maxLength={200}
                                disabled={loading}
                            />
                            <p className={`${textMuted} text-xs mt-1`}>Минимум 5 символов</p>
                        </div>

                        {/* Category */}
                        <div>
                            <Label htmlFor="category" className={`${textColor} block mb-2 font-medium`}>Категория *</Label>
                            <Select
                                value={formData.categoryId}
                                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                                disabled={loading || loadingCategories}
                            >
                                <SelectTrigger className={inputBg}>
                                    <SelectValue placeholder={loadingCategories ? "Загрузка категорий..." : "Выберите категорию"} />
                                </SelectTrigger>
                                <SelectContent className={isDarkTheme ? 'bg-neutral-800 border-neutral-700' : ''}>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id.toString()}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Description */}
                        <div>
                            <Label htmlFor="description" className={`${textColor} block mb-2 font-medium`}>Описание *</Label>
                            <Textarea
                                id="description"
                                placeholder="Расскажите о товаре подробнее: состояние, характеристики, причина продажи..."
                                rows={6}
                                className={inputBg}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                required
                                minLength={10}
                                maxLength={5000}
                                disabled={loading}
                            />
                            <p className={`${textMuted} text-xs mt-1`}>Минимум 10 символов</p>
                        </div>

                        {/* Price and Currency */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="price" className={`${textColor} block mb-2 font-medium`}>Цена *</Label>
                                <div className="relative">
                                    <Input
                                        id="price"
                                        type="number"
                                        placeholder="0"
                                        className={`${inputBg} pr-16`}
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        required
                                        min="0"
                                        step="0.01"
                                        disabled={loading}
                                    />
                                    <Select
                                        value={formData.currency}
                                        onValueChange={(value) => setFormData({ ...formData, currency: value })}
                                        disabled={loading}
                                    >
                                        <SelectTrigger className={`absolute right-1 top-1/2 -translate-y-1/2 w-12 h-8 ${isDarkTheme ? 'bg-neutral-700 border-neutral-600' : 'bg-stone-100 border-stone-300'}`}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className={isDarkTheme ? 'bg-neutral-800 border-neutral-700' : ''}>
                                            <SelectItem value="BYN">BYN</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                            <SelectItem value="RUB">RUB</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="location" className={`${textColor} block mb-2 font-medium`}>Город *</Label>
                                <Input
                                    id="location"
                                    placeholder="Минск"
                                    className={inputBg}
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    required
                                    maxLength={200}
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <Label htmlFor="address" className={`${textColor} block mb-2 font-medium`}>Адрес (опционально)</Label>
                                <Input
                                    id="address"
                                    placeholder="Район или улица"
                                    className={inputBg}
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    maxLength={200}
                                    disabled={loading}
                                />
                            </div>
                        </div>


                        {/* Submit Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button
                                type="submit"
                                className={`${buttonBg} text-white flex-1`}
                                disabled={loading || success}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Создание...
                                    </>
                                ) : success ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Создано!
                                    </>
                                ) : (
                                    'Опубликовать объявление'
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className={borderColor}
                                onClick={onBack}
                                disabled={loading}
                            >
                                Отмена
                            </Button>
                        </div>

                        <p className={`${textMuted} text-center text-sm`}>
                            Нажимая "Опубликовать", вы соглашаетесь с{' '}
                            <a href="#" className={isDarkTheme ? 'text-orange-500 hover:text-orange-400' : 'text-teal-600 hover:text-teal-700'}>
                                правилами размещения
                            </a>
                        </p>
                    </form>
                </div>
            </div>

            <Footer isDarkTheme={isDarkTheme} />
        </div>
    );
}