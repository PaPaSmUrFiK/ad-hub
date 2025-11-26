import {
    Smartphone,
    Shirt,
    Home,
    Car,
    Sofa,
    Briefcase,
    Baby,
    Dumbbell,
    Book,
    Wrench,
    Palette,
    Music,
    Package
} from 'lucide-react';

// Маппинг названий категорий к иконкам и цветам
const categoryConfig = {
    'Электроника': {
        icon: Smartphone,
        color: 'bg-cyan-100 text-cyan-700',
        darkColor: 'dark:bg-cyan-900/30 dark:text-cyan-400'
    },
    'Одежда и обувь': {
        icon: Shirt,
        color: 'bg-violet-100 text-violet-700',
        darkColor: 'dark:bg-violet-900/30 dark:text-violet-400'
    },
    'Одежда': {
        icon: Shirt,
        color: 'bg-violet-100 text-violet-700',
        darkColor: 'dark:bg-violet-900/30 dark:text-violet-400'
    },
    'Недвижимость': {
        icon: Home,
        color: 'bg-emerald-100 text-emerald-700',
        darkColor: 'dark:bg-emerald-900/30 dark:text-emerald-400'
    },
    'Авто и транспорт': {
        icon: Car,
        color: 'bg-rose-100 text-rose-700',
        darkColor: 'dark:bg-rose-900/30 dark:text-rose-400'
    },
    'Авто': {
        icon: Car,
        color: 'bg-rose-100 text-rose-700',
        darkColor: 'dark:bg-rose-900/30 dark:text-rose-400'
    },
    'Мебель и интерьер': {
        icon: Sofa,
        color: 'bg-amber-100 text-amber-700',
        darkColor: 'dark:bg-amber-900/30 dark:text-amber-400'
    },
    'Мебель': {
        icon: Sofa,
        color: 'bg-amber-100 text-amber-700',
        darkColor: 'dark:bg-amber-900/30 dark:text-amber-400'
    },
    'Работа и бизнес': {
        icon: Briefcase,
        color: 'bg-sky-100 text-sky-700',
        darkColor: 'dark:bg-sky-900/30 dark:text-sky-400'
    },
    'Работа': {
        icon: Briefcase,
        color: 'bg-sky-100 text-sky-700',
        darkColor: 'dark:bg-sky-900/30 dark:text-sky-400'
    },
    'Детские товары': {
        icon: Baby,
        color: 'bg-pink-100 text-pink-700',
        darkColor: 'dark:bg-pink-900/30 dark:text-pink-400'
    },
    'Спорт и отдых': {
        icon: Dumbbell,
        color: 'bg-orange-100 text-orange-700',
        darkColor: 'dark:bg-orange-900/30 dark:text-orange-400'
    },
    'Спорт': {
        icon: Dumbbell,
        color: 'bg-orange-100 text-orange-700',
        darkColor: 'dark:bg-orange-900/30 dark:text-orange-400'
    },
    'Книги и журналы': {
        icon: Book,
        color: 'bg-indigo-100 text-indigo-700',
        darkColor: 'dark:bg-indigo-900/30 dark:text-indigo-400'
    },
    'Книги': {
        icon: Book,
        color: 'bg-indigo-100 text-indigo-700',
        darkColor: 'dark:bg-indigo-900/30 dark:text-indigo-400'
    },
    'Инструменты': {
        icon: Wrench,
        color: 'bg-stone-200 text-stone-700',
        darkColor: 'dark:bg-stone-800/30 dark:text-stone-400'
    },
    'Хобби и творчество': {
        icon: Palette,
        color: 'bg-teal-100 text-teal-700',
        darkColor: 'dark:bg-teal-900/30 dark:text-teal-400'
    },
    'Хобби': {
        icon: Palette,
        color: 'bg-teal-100 text-teal-700',
        darkColor: 'dark:bg-teal-900/30 dark:text-teal-400'
    },
    'Музыкальные инструменты': {
        icon: Music,
        color: 'bg-purple-100 text-purple-700',
        darkColor: 'dark:bg-purple-900/30 dark:text-purple-400'
    },
    'Музыка': {
        icon: Music,
        color: 'bg-purple-100 text-purple-700',
        darkColor: 'dark:bg-purple-900/30 dark:text-purple-400'
    },
};

// Получить конфигурацию для категории
export function getCategoryConfig(categoryName) {
    return categoryConfig[categoryName] || {
        icon: Package,
        color: 'bg-gray-100 text-gray-700',
        darkColor: 'dark:bg-gray-900/30 dark:text-gray-400'
    };
}

// Форматирование цены
export function formatPrice(price, currency = 'BYN') {
    if (!price) return 'Цена не указана';
    const formattedPrice = new Intl.NumberFormat('ru-RU', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(price);
    return `${formattedPrice} ${currency}`;
}

// Получить первое изображение из медиа
export function getPrimaryImage(mediaFiles) {
    if (!mediaFiles || mediaFiles.length === 0) {
        return null;
    }
    
    // Ищем основное изображение
    const primary = mediaFiles.find(m => m.isPrimary);
    if (primary) {
        return primary.fileUrl;
    }
    
    // Или первое изображение
    const firstImage = mediaFiles.find(m => m.fileType === 'IMAGE');
    if (firstImage) {
        return firstImage.fileUrl;
    }
    
    return mediaFiles[0].fileUrl;
}

