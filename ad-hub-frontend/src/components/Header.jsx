import { Bell, Heart, User, Plus, LogIn, Moon, Sun, LogOut, Store, Shield, Users, BarChart3 } from 'lucide-react';
import { Button } from './ui/button.jsx';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function Header({
                           onLoginClick,
                           onRegisterClick,
                           onFavoritesClick,
                           onLogout,
                           isAuthenticated = false,
                           isDarkTheme = false,
                           onToggleTheme,
                           currentPage = 'home',
                           onNavigate,
                           hideCreateButton = false,
                           isAdmin = false
                       }) {
    const bgColor = isDarkTheme ? 'bg-neutral-900/95 backdrop-blur-sm' : 'bg-stone-50/95 backdrop-blur-sm';
    const borderColor = isDarkTheme ? 'border-neutral-800' : 'border-stone-200';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
    const linkColor = isDarkTheme ? 'text-neutral-300' : 'text-stone-600';
    const activeLinkColor = isDarkTheme ? 'text-orange-500 border-orange-500' : 'text-teal-600 border-teal-600';
    const hoverLinkColor = isDarkTheme ? 'hover:text-orange-400' : 'hover:text-teal-500';
    const buttonBg = isDarkTheme ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700';
    // const iconColor = isDarkTheme ? 'text-orange-500' : 'text-teal-600';

    return (
        <header className={`${bgColor} border-b ${borderColor} sticky top-0 z-50 shadow-sm`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-8">
                        <button onClick={() => onNavigate?.('home')} className="flex items-center gap-2 group">
                            <div className={`w-9 h-9 ${isDarkTheme ? 'bg-gradient-to-br from-orange-500 to-orange-700' : 'bg-gradient-to-br from-teal-500 to-cyan-600'} rounded-xl flex items-center justify-center shadow-md`}>
                                <Store className="h-5 w-5 text-white" />
                            </div>
                            <span className={`${textColor} text-xl font-bold tracking-tight group-hover:${isDarkTheme ? 'text-orange-400' : 'text-teal-600'} transition-colors`}>AdHub</span>
                        </button>

                        {/* Navigation Tabs */}
                        <nav className="hidden md:flex items-center gap-1">
                            {(() => {
                                // Логируем для отладки
                                console.log('[Header] Рендер навигации - isAuthenticated:', isAuthenticated, 'isAdmin:', isAdmin, 'currentPage:', currentPage);
                                const showAdminNav = isAuthenticated && isAdmin;
                                console.log('[Header] Показывать админ навигацию:', showAdminNav);
                                
                                return showAdminNav ? (
                                    // Навигация для администратора
                                    <>
                                        <button
                                            onClick={() => {
                                                console.log('[Header] Клик на Пользователи');
                                                onNavigate?.('admin');
                                                // Переключаем вкладку через глобальную функцию
                                                setTimeout(() => {
                                                    if (window.setAdminTab) {
                                                        window.setAdminTab('users');
                                                    }
                                                }, 0);
                                            }}
                                            className={`px-4 py-2 flex items-center gap-2 ${currentPage === 'admin' ? activeLinkColor : linkColor} ${hoverLinkColor} transition-colors border-b-2 ${currentPage === 'admin' ? '' : 'border-transparent'}`}
                                        >
                                            <Users className="h-4 w-4" />
                                            Пользователи
                                        </button>
                                        <button
                                            onClick={() => {
                                                console.log('[Header] Клик на Статистика');
                                                onNavigate?.('admin');
                                                // Переключаем вкладку через глобальную функцию
                                                setTimeout(() => {
                                                    if (window.setAdminTab) {
                                                        window.setAdminTab('statistics');
                                                    }
                                                }, 0);
                                            }}
                                            className={`px-4 py-2 flex items-center gap-2 ${currentPage === 'admin' ? activeLinkColor : linkColor} ${hoverLinkColor} transition-colors border-b-2 ${currentPage === 'admin' ? '' : 'border-transparent'}`}
                                        >
                                            <BarChart3 className="h-4 w-4" />
                                            Статистика
                                        </button>
                                    </>
                                ) : (
                                // Навигация для обычных пользователей
                                <>
                                    <button
                                        onClick={() => onNavigate?.('home')}
                                        className={`px-4 py-2 ${currentPage === 'home' ? activeLinkColor : linkColor} ${hoverLinkColor} transition-colors border-b-2 ${currentPage === 'home' ? '' : 'border-transparent'}`}
                                    >
                                        Главная
                                    </button>
                                    <button
                                        onClick={() => onNavigate?.('all-listings')}
                                        className={`px-4 py-2 ${currentPage === 'all-listings' ? activeLinkColor : linkColor} ${hoverLinkColor} transition-colors border-b-2 ${currentPage === 'all-listings' ? '' : 'border-transparent'}`}
                                    >
                                        Объявления
                                    </button>
                                    <button
                                        onClick={() => onNavigate?.('categories')}
                                        className={`px-4 py-2 ${currentPage === 'categories' ? activeLinkColor : linkColor} ${hoverLinkColor} transition-colors border-b-2 ${currentPage === 'categories' ? '' : 'border-transparent'}`}
                                    >
                                        Категории
                                    </button>
                                </>
                            )}
                        </nav>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Theme Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`${isDarkTheme ? 'text-neutral-300 hover:text-orange-400 hover:bg-neutral-800' : 'text-stone-600 hover:text-teal-600 hover:bg-stone-100'}`}
                            onClick={onToggleTheme}
                        >
                            {isDarkTheme ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                        </Button>

                        {isAuthenticated ? (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`hidden sm:flex ${isDarkTheme ? 'text-neutral-300 hover:text-orange-400 hover:bg-neutral-800' : 'text-stone-600 hover:text-teal-600 hover:bg-stone-100'} relative`}
                                    onClick={() => onNavigate?.('notifications')}
                                >
                                    <Bell className="h-5 w-5" />
                                    <span className={`absolute top-1 right-1 w-2 h-2 ${isDarkTheme ? 'bg-orange-500' : 'bg-teal-500'} rounded-full`}></span>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`hidden sm:flex ${isDarkTheme ? 'text-neutral-300 hover:text-orange-400 hover:bg-neutral-800' : 'text-stone-600 hover:text-teal-600 hover:bg-stone-100'}`}
                                    onClick={onFavoritesClick}
                                >
                                    <Heart className="h-5 w-5" />
                                </Button>

                                {/* User Dropdown Menu */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={`${isDarkTheme ? 'text-neutral-300 hover:text-orange-400 hover:bg-neutral-800' : 'text-stone-600 hover:text-teal-600 hover:bg-stone-100'}`}
                                        >
                                            <User className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent 
                                        align="end"
                                        className={isDarkTheme ? 'bg-neutral-800 border-neutral-700' : 'bg-white border-stone-200'}
                                    >
                                        <DropdownMenuItem
                                            onClick={() => onNavigate?.('profile')}
                                            className={isDarkTheme ? 'text-neutral-300 hover:bg-neutral-700' : 'text-stone-700 hover:bg-stone-100'}
                                        >
                                            <User className="h-4 w-4 mr-2" />
                                            Профиль
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={onFavoritesClick}
                                            className={isDarkTheme ? 'text-neutral-300 hover:bg-neutral-700' : 'text-stone-700 hover:bg-stone-100'}
                                        >
                                            <Heart className="h-4 w-4 mr-2" />
                                            Избранное
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => onNavigate?.('notifications')}
                                            className={isDarkTheme ? 'text-neutral-300 hover:bg-neutral-700' : 'text-stone-700 hover:bg-stone-100'}
                                        >
                                            <Bell className="h-4 w-4 mr-2" />
                                            Уведомления
                                        </DropdownMenuItem>
                                        {isAdmin && (
                                            <>
                                                <DropdownMenuSeparator className={isDarkTheme ? 'bg-neutral-700' : 'bg-stone-200'} />
                                                <DropdownMenuItem
                                                    onClick={() => onNavigate?.('admin')}
                                                    className={isDarkTheme ? 'text-purple-400 hover:bg-neutral-700 hover:text-purple-300' : 'text-purple-600 hover:bg-stone-100 hover:text-purple-700'}
                                                >
                                                    <Shield className="h-4 w-4 mr-2" />
                                                    Панель администратора
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        <DropdownMenuSeparator className={isDarkTheme ? 'bg-neutral-700' : 'bg-stone-200'} />
                                        <DropdownMenuItem
                                            onClick={onLogout}
                                            className={isDarkTheme ? 'text-red-400 hover:bg-neutral-700 hover:text-red-300' : 'text-red-600 hover:bg-stone-100 hover:text-red-700'}
                                        >
                                            <LogOut className="h-4 w-4 mr-2" />
                                            Выйти
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {!hideCreateButton && (
                                    <Button
                                        className={`${buttonBg} text-white shadow-md`}
                                        onClick={() => onNavigate?.('create-listing')}
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Разместить
                                    </Button>
                                )}
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    className={isDarkTheme
                                        ? 'text-neutral-300 border-neutral-700 hover:bg-neutral-800 hover:text-neutral-100'
                                        : 'text-stone-700 border-stone-300 hover:bg-stone-100 hover:text-stone-900'
                                    }
                                    onClick={onLoginClick}
                                >
                                    <LogIn className="h-4 w-4 mr-2" />
                                    Войти
                                </Button>
                                <Button
                                    className={`${buttonBg} text-white shadow-md`}
                                    onClick={onRegisterClick}
                                >
                                    Регистрация
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}