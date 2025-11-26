import { Search } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useState, useEffect } from 'react';
import { ImageWithFallback } from './ui/ImageWithFallback';
import { categoriesAPI } from '../api/categories';

export function Hero({ isDarkTheme = false, onSearch }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Загружаем категории при монтировании компонента
    useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoading(true);
                const data = await categoriesAPI.getAllCategories();
                setCategories(data || []);
            } catch (error) {
                console.error('Ошибка при загрузке категорий:', error);
                setCategories([]);
            } finally {
                setLoading(false);
            }
        };

        loadCategories();
    }, []);

    const borderColor = isDarkTheme ? 'border-neutral-800' : 'border-stone-300';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
    const textSecondary = isDarkTheme ? 'text-neutral-300' : 'text-stone-700';
    const buttonBg = isDarkTheme ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700';
    const searchBg = isDarkTheme ? 'bg-neutral-800/90 border-neutral-700 backdrop-blur-md' : 'bg-white/90 border-stone-200 backdrop-blur-md';

    const handleSearch = () => {
        if (onSearch) {
            const categoryId = selectedCategory === 'all' ? null : parseInt(selectedCategory);
            onSearch(searchQuery, categoryId);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className={`relative border-b ${borderColor} overflow-hidden`}>
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <ImageWithFallback
                    src="https://images.unsplash.com/photo-1640963269654-3fe248c5fba6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdyYWRpZW50JTIwYmFja2dyb3VuZHxlbnwxfHx8fDE3NjMxNDEzNjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Background"
                    className="w-full h-full object-cover"
                />
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 ${
                    isDarkTheme
                        ? 'bg-gradient-to-b from-neutral-900/95 via-neutral-950/90 to-neutral-950'
                        : 'bg-gradient-to-b from-teal-50/95 via-stone-100/90 to-stone-100'
                }`}></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="text-center mb-10">
                    <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-bold ${textColor} mb-4 drop-shadow-sm`}>
                        Найдите всё, что вам нужно
                    </h1>
                    <p className={`text-lg sm:text-xl ${textSecondary} max-w-2xl mx-auto drop-shadow-sm`}>
                        Тысячи объявлений от продавцов со всей страны. Покупайте и продавайте легко и безопасно
                    </p>
                </div>

                {/* Search Bar */}
                <div className="max-w-4xl mx-auto">
                    <div className={`${searchBg} rounded-xl shadow-2xl p-2 flex flex-col sm:flex-row gap-2 border`}>
                        <div className="flex-1 flex items-center gap-2 px-3">
                            <Search className={`h-5 w-5 ${isDarkTheme ? 'text-neutral-400' : 'text-stone-500'}`} />
                            <Input
                                placeholder="Что вы ищете?"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className={`border-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${isDarkTheme ? 'bg-transparent text-neutral-100 placeholder:text-neutral-500' : 'bg-transparent'}`}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={loading}>
                                <SelectTrigger className={`w-[180px] ${isDarkTheme ? 'border-neutral-700 bg-neutral-900/80 text-neutral-100' : 'border-stone-300 bg-white/80'}`}>
                                    <SelectValue placeholder={loading ? "Загрузка..." : "Категория"} />
                                </SelectTrigger>
                                <SelectContent className={isDarkTheme ? 'bg-neutral-800 border-neutral-700' : ''}>
                                    <SelectItem value="all">Все категории</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id.toString()}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button
                                className={`${buttonBg} text-white shadow-lg`}
                                onClick={handleSearch}
                            >
                                Найти
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
                    <div className="text-center">
                        <div className={`text-2xl font-bold ${textColor} mb-1 drop-shadow-sm`}>50,000+</div>
                        <div className={`${isDarkTheme ? 'text-neutral-400' : 'text-stone-600'} drop-shadow-sm`}>Объявлений</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-2xl font-bold ${textColor} mb-1 drop-shadow-sm`}>12,000+</div>
                        <div className={`${isDarkTheme ? 'text-neutral-400' : 'text-stone-600'} drop-shadow-sm`}>Продавцов</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-2xl font-bold ${textColor} mb-1 drop-shadow-sm`}>25</div>
                        <div className={`${isDarkTheme ? 'text-neutral-400' : 'text-stone-600'} drop-shadow-sm`}>Категорий</div>
                    </div>
                    <div className="text-center">
                        <div className={`text-2xl font-bold ${textColor} mb-1 drop-shadow-sm`}>500+</div>
                        <div className={`${isDarkTheme ? 'text-neutral-400' : 'text-stone-600'} drop-shadow-sm`}>Новых в день</div>
                    </div>
                </div>
            </div>
        </div>
    );
}