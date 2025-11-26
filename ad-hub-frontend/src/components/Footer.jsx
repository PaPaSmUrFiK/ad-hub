import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export function Footer({ isDarkTheme = false }) {
    const bgColor = isDarkTheme ? 'bg-neutral-900' : 'bg-stone-800';
    const textColor = isDarkTheme ? 'text-neutral-200' : 'text-stone-200';
    const textSecondary = isDarkTheme ? 'text-neutral-400' : 'text-stone-400';
    const hoverColor = isDarkTheme ? 'hover:text-orange-400' : 'hover:text-teal-400';
    const iconBg = isDarkTheme ? 'bg-neutral-800 hover:bg-neutral-700' : 'bg-stone-700 hover:bg-stone-600';
    const borderColor = isDarkTheme ? 'border-neutral-800' : 'border-stone-700';

    return (
        <footer className={`${bgColor} ${textColor}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* About */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className={`w-8 h-8 ${isDarkTheme ? 'bg-gradient-to-br from-orange-500 to-orange-700' : 'bg-gradient-to-br from-teal-500 to-cyan-600'} rounded-lg`}></div>
                            <span className="text-white text-xl font-bold tracking-tight">AdHub</span>
                        </div>
                        <p className={`${textSecondary} mb-4`}>
                            Крупнейшая площадка объявлений в России. Покупайте и продавайте быстро и безопасно.
                        </p>
                        <div className="flex gap-3">
                            <a href="#" className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center text-stone-300 transition-colors`}>
                                <Facebook className="h-4 w-4" />
                            </a>
                            <a href="#" className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center text-stone-300 transition-colors`}>
                                <Instagram className="h-4 w-4" />
                            </a>
                            <a href="#" className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center text-stone-300 transition-colors`}>
                                <Twitter className="h-4 w-4" />
                            </a>
                            <a href="#" className={`w-9 h-9 rounded-full ${iconBg} flex items-center justify-center text-stone-300 transition-colors`}>
                                <Youtube className="h-4 w-4" />
                            </a>
                        </div>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-white mb-4 font-semibold">Категории</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className={`${textSecondary} ${hoverColor} transition-colors block`}>
                                    Электроника
                                </a>
                            </li>
                            <li>
                                <a href="#" className={`${textSecondary} ${hoverColor} transition-colors block`}>
                                    Одежда и обувь
                                </a>
                            </li>
                            <li>
                                <a href="#" className={`${textSecondary} ${hoverColor} transition-colors block`}>
                                    Недвижимость
                                </a>
                            </li>
                            <li>
                                <a href="#" className={`${textSecondary} ${hoverColor} transition-colors block`}>
                                    Авто и транспорт
                                </a>
                            </li>
                            <li>
                                <a href="#" className={`${textSecondary} ${hoverColor} transition-colors block`}>
                                    Работа
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Help */}
                    <div>
                        <h3 className="text-white mb-4 font-semibold">Помощь</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className={`${textSecondary} ${hoverColor} transition-colors block`}>
                                    Центр поддержки
                                </a>
                            </li>
                            <li>
                                <a href="#" className={`${textSecondary} ${hoverColor} transition-colors block`}>
                                    Правила размещения
                                </a>
                            </li>
                            <li>
                                <a href="#" className={`${textSecondary} ${hoverColor} transition-colors block`}>
                                    Безопасная сделка
                                </a>
                            </li>
                            <li>
                                <a href="#" className={`${textSecondary} ${hoverColor} transition-colors block`}>
                                    Защита покупателя
                                </a>
                            </li>
                            <li>
                                <a href="#" className={`${textSecondary} ${hoverColor} transition-colors block`}>
                                    Платная доставка
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h3 className="text-white mb-4 font-semibold">Компания</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className={`${textSecondary} ${hoverColor} transition-colors block`}>
                                    О нас
                                </a>
                            </li>
                            <li>
                                <a href="#" className={`${textSecondary} ${hoverColor} transition-colors block`}>
                                    Карьера
                                </a>
                            </li>
                            <li>
                                <a href="#" className={`${textSecondary} ${hoverColor} transition-colors block`}>
                                    Пресс-центр
                                </a>
                            </li>
                            <li>
                                <a href="#" className={`${textSecondary} ${hoverColor} transition-colors block`}>
                                    Контакты
                                </a>
                            </li>
                            <li>
                                <a href="#" className={`${textSecondary} ${hoverColor} transition-colors block`}>
                                    Реклама на сайте
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className={`pt-8 border-t ${borderColor} flex flex-col sm:flex-row justify-between items-center gap-4`}>
                    <p className={`${textSecondary} text-sm`}>
                        © 2025 AdHub. Все права защищены.
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className={`${textSecondary} ${hoverColor} transition-colors text-sm`}>
                            Политика конфиденциальности
                        </a>
                        <a href="#" className={`${textSecondary} ${hoverColor} transition-colors text-sm`}>
                            Условия использования
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}