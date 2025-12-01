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
                                      onNavigate,
                                      isAdmin = false,
                                      isModerator = false,
                                      editAdData = null,
                                      onEditComplete = null
                                  }) {
    const [images, setImages] = useState([]); // Array of File objects
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [editAdId, setEditAdId] = useState(null);
    const [existingImages, setExistingImages] = useState([]); // URLs существующих изображений
    
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

    // Загружаем данные черновика для редактирования
    // Важно: загружаем только после того, как категории загружены
    useEffect(() => {
        if (editAdData && !loadingCategories && categories.length > 0) {
            const loadDraftData = async () => {
                try {
                    setLoading(true);
                    // Загружаем полные данные объявления
                    const adDetails = await adsAPI.getAdById(editAdData.id);
                    
                    setEditAdId(adDetails.id);
                    
                    // Парсим location (может быть "Город, Адрес")
                    const locationParts = adDetails.location ? adDetails.location.split(', ') : ['', ''];
                    const location = locationParts[0] || '';
                    const address = locationParts.slice(1).join(', ') || '';

                    // Преобразуем categoryId в строку для Select компонента
                    // Убеждаемся, что категория существует в списке категорий
                    const categoryIdStr = adDetails.categoryId ? adDetails.categoryId.toString() : '';
                    const categoryExists = categories.some(cat => cat.id.toString() === categoryIdStr);
                    
                    console.log('[CreateListingPage] Загрузка черновика:', {
                        categoryId: adDetails.categoryId,
                        categoryIdStr,
                        categoryExists,
                        categoriesCount: categories.length
                    });

                    // Заполняем форму данными из черновика
                    setFormData({
                        title: adDetails.title || '',
                        categoryId: categoryExists ? categoryIdStr : '', // Устанавливаем только если категория существует
                        description: adDetails.description || '',
                        price: adDetails.price ? adDetails.price.toString() : '',
                        currency: adDetails.currency || 'BYN',
                        location: location,
                        address: address,
                        phone: adDetails.userPhone || '',
                        email: adDetails.userEmail || '',
                    });

                    // Загружаем существующие изображения
                    if (adDetails.mediaFiles && adDetails.mediaFiles.length > 0) {
                        const imageUrls = adDetails.mediaFiles
                            .filter(media => media.fileType === 'IMAGE')
                            .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                            .map(media => media.fileUrl);
                        setExistingImages(imageUrls);
                    }
                } catch (err) {
                    console.error('Ошибка при загрузке данных черновика:', err);
                    setError('Не удалось загрузить данные черновика. Попробуйте еще раз.');
                } finally {
                    setLoading(false);
                }
            };
            loadDraftData();
        }
    }, [editAdData, loadingCategories, categories]);

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        const remainingSlots = 10 - images.length;
        
        // Разрешенные форматы файлов
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const maxFileSize = 10 * 1024 * 1024; // 10MB
        
        const validFiles = [];
        const errors = [];
        
        files.slice(0, remainingSlots).forEach((file, index) => {
            // Проверка типа файла
            const isValidType = allowedTypes.includes(file.type) || 
                               allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
            
            if (!isValidType) {
                errors.push(`Файл "${file.name}" имеет неподдерживаемый формат. Разрешены: JPG, PNG, GIF, WebP`);
                return;
            }
            
            // Проверка размера файла
            if (file.size > maxFileSize) {
                errors.push(`Файл "${file.name}" слишком большой (максимум 10MB)`);
                return;
            }
            
            validFiles.push(file);
        });
        
        if (errors.length > 0) {
            setError(errors.join('\n'));
            // Очищаем input, чтобы можно было выбрать файлы снова
            e.target.value = '';
            return;
        }
        
        if (validFiles.length > 0) {
            setImages([...images, ...validFiles]);
            setError(''); // Очищаем предыдущие ошибки
        }
        
        // Очищаем input для возможности повторного выбора
        e.target.value = '';
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

    const handleSubmit = async (e, isDraft = false) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setFieldErrors({});

        // Для черновика валидация необязательна, но минимальные проверки
        if (!isDraft) {
            // Валидация формы для публикации
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
            if (images.length === 0 && existingImages.length === 0) {
                setError('Добавьте хотя бы одно фото');
                return;
            }
        } else {
            // Для черновика минимальные проверки
            if (!formData.title.trim()) {
                setError('Введите название объявления');
                return;
            }
            // Для черновика категория тоже обязательна
            if (!formData.categoryId) {
                setError('Выберите категорию');
                return;
            }
        }

        try {
            setLoading(true);

            // Подготовка данных для создания объявления
            const locationStr = formData.address 
                ? `${formData.location}, ${formData.address}`.trim()
                : formData.location;

            const adData = {
                title: formData.title.trim(),
                description: formData.description.trim() || (isDraft ? 'Черновик' : ''),
                price: formData.price ? parseFloat(formData.price) : 0,
                currency: formData.currency || 'BYN',
                location: locationStr || null,
                categoryId: parseInt(formData.categoryId),
                status: isDraft ? 'DRAFT' : 'ON_MODERATION',
            };

            console.log('[CreateListingPage] Отправка данных:', {
                editAdId,
                isDraft,
                status: adData.status,
                adData
            });

            let createdAd;
            if (editAdId) {
                // Обновляем существующее объявление
                createdAd = await adsAPI.updateAd(editAdId, adData);
                console.log('[CreateListingPage] Объявление обновлено:', createdAd);
            } else {
                // Создаем новое объявление
                createdAd = await adsAPI.createAd(adData);
                console.log('Объявление создано:', createdAd);
            }
            
            // Загружаем изображения (если есть)
            const uploadErrors = [];
            if (images.length > 0) {
                for (let i = 0; i < images.length; i++) {
                    try {
                        console.log(`Загрузка изображения ${i + 1}/${images.length}...`);
                        const mediaResult = await adsAPI.uploadMedia(createdAd.id, images[i]);
                        console.log(`Изображение ${i + 1} успешно загружено:`, mediaResult);
                    } catch (mediaError) {
                        console.error(`Ошибка при загрузке изображения ${i + 1}:`, mediaError);
                        const fileName = images[i].name || `Изображение ${i + 1}`;
                        const errorMessage = mediaError.message || 'Неизвестная ошибка загрузки';
                        uploadErrors.push(`${fileName}: ${errorMessage}`);
                    }
                }
                
                if (uploadErrors.length > 0) {
                    console.warn('Некоторые изображения не загрузились:', uploadErrors);
                    // Показываем предупреждение, но не блокируем успешное создание объявления
                    setError(`Объявление ${isDraft ? 'сохранено как черновик' : 'создано'}, но некоторые изображения не загрузились:\n${uploadErrors.join('\n')}`);
                }
            }

            if (uploadErrors.length === 0) {
                setSuccess(true);
            }
            
            // Переходим на страницу профиля через 2 секунды
            setTimeout(() => {
                if (onEditComplete) {
                    onEditComplete();
                }
                if (onNavigate) {
                    onNavigate('profile');
                }
            }, 2000);

        } catch (err) {
            console.error('Ошибка при создании объявления:', err);
            setError(err.message || `Не удалось ${isDraft ? 'сохранить черновик' : 'создать объявление'}. Попробуйте еще раз.`);
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
                isAdmin={isAdmin}
                isModerator={isModerator}
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
                    <h1 className={`${textColor} text-2xl font-bold mb-6`}>
                        {editAdId ? 'Редактировать объявление' : 'Разместить объявление'}
                    </h1>

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
                            <p className={`${textMuted} mb-3 text-xs`}>
                                Разрешенные форматы: JPG, PNG, GIF, WebP (максимум 10MB каждый)
                            </p>

                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                {/* Существующие изображения */}
                                {existingImages.map((imgUrl, index) => (
                                    <div
                                        key={`existing-${index}`}
                                        className={`relative aspect-square rounded-lg border ${borderColor} overflow-hidden ${isDarkTheme ? 'bg-neutral-800' : 'bg-stone-100'}`}
                                    >
                                        <img
                                            src={imgUrl}
                                            alt={`Existing ${index + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setExistingImages(existingImages.filter((_, i) => i !== index))}
                                            className={`absolute -top-2 -right-2 w-6 h-6 rounded-full ${isDarkTheme ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white flex items-center justify-center shadow-md`}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ))}
                                {/* Новые изображения */}
                                {images.map((img, index) => (
                                    <div
                                        key={`new-${index}`}
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

                                {(existingImages.length + images.length) < 10 && (
                                    <label className={`aspect-square rounded-lg border-2 border-dashed ${borderColor} ${isDarkTheme ? 'hover:border-orange-500 hover:bg-neutral-800' : 'hover:border-teal-500 hover:bg-stone-50'} flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer`}>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
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
                                <Input
                                    id="price"
                                    type="number"
                                    placeholder="0"
                                    className={inputBg}
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                    min="0"
                                    step="0.01"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <Label htmlFor="currency" className={`${textColor} block mb-2 font-medium`}>Валюта *</Label>
                                <Select
                                    value={formData.currency}
                                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                                    disabled={loading}
                                >
                                    <SelectTrigger className={inputBg}>
                                        <SelectValue placeholder="Выберите валюту" />
                                    </SelectTrigger>
                                    <SelectContent className={isDarkTheme ? 'bg-neutral-800 border-neutral-700' : ''}>
                                        <SelectItem value="BYN">BYN - Белорусский рубль</SelectItem>
                                        <SelectItem value="USD">USD - Доллар США</SelectItem>
                                        <SelectItem value="EUR">EUR - Евро</SelectItem>
                                        <SelectItem value="RUB">RUB - Российский рубль</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                onClick={(e) => handleSubmit(e, true)}
                                className={`${isDarkTheme ? 'border-neutral-600 text-neutral-300 hover:bg-neutral-800' : 'border-stone-300 text-stone-700 hover:bg-stone-100'}`}
                                disabled={loading || success}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Сохранение...
                                    </>
                                ) : (
                                    'Сохранить черновик'
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