import { Bell, Heart, User, Plus, LogIn, Moon, Sun, LogOut, Store, Shield, CheckSquare } from 'lucide-react';
import { Button } from './ui/button.jsx';

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
                           isAdmin = false,
                           isModerator = false,
                           unreadCount = 0,
                           hasNotifications = false
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
                            {/* Все вкладки доступны для всех пользователей, включая администратора */}
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
                            {/* Вкладка "Модерация" показывается только для модераторов (не для администраторов) */}
                            {isAuthenticated && isModerator && !isAdmin && (
                                <button
                                    onClick={() => onNavigate?.('moderation')}
                                    className={`px-4 py-2 flex items-center gap-2 ${currentPage === 'moderation' ? activeLinkColor : linkColor} ${hoverLinkColor} transition-colors border-b-2 ${currentPage === 'moderation' ? '' : 'border-transparent'}`}
                                >
                                    <CheckSquare className="h-4 w-4" />
                                    Модерация
                                </button>
                            )}
                            {/* Вкладка "Панель администратора" показывается только для администратора */}
                            {isAuthenticated && isAdmin && (
                                <button
                                    onClick={() => onNavigate?.('admin')}
                                    className={`px-4 py-2 flex items-center gap-2 ${currentPage === 'admin' ? activeLinkColor : linkColor} ${hoverLinkColor} transition-colors border-b-2 ${currentPage === 'admin' ? '' : 'border-transparent'}`}
                                >
                                    <Shield className="h-4 w-4" />
                                    Панель администратора
                                </button>
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
                                {/* Уведомления */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`hidden sm:flex ${isDarkTheme ? 'text-neutral-300 hover:text-orange-400 hover:bg-neutral-800' : 'text-stone-600 hover:text-teal-600 hover:bg-stone-100'} relative`}
                                    onClick={() => onNavigate?.('notifications')}
                                >
                                    <Bell className="h-5 w-5" />
                                    {(unreadCount > 0 || hasNotifications) && (
                                        <span className={`absolute top-1 right-1 w-2 h-2 ${isDarkTheme ? 'bg-orange-500' : 'bg-teal-500'} rounded-full`}></span>
                                    )}
                                </Button>
                                {/* Избранное */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`hidden sm:flex ${isDarkTheme ? 'text-neutral-300 hover:text-orange-400 hover:bg-neutral-800' : 'text-stone-600 hover:text-teal-600 hover:bg-stone-100'}`}
                                    onClick={onFavoritesClick}
                                >
                                    <Heart className="h-5 w-5" />
                                </Button>
                                {/* Профиль */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`${isDarkTheme ? 'text-neutral-300 hover:text-orange-400 hover:bg-neutral-800' : 'text-stone-600 hover:text-teal-600 hover:bg-stone-100'}`}
                                    onClick={() => onNavigate?.('profile')}
                                >
                                    <User className="h-5 w-5" />
                                </Button>
                                {/* Выход */}
                                <Button
                                    variant="outline"
                                    className={isDarkTheme
                                        ? 'text-neutral-200 border-neutral-700 hover:bg-neutral-800'
                                        : 'text-stone-700 border-stone-300 hover:bg-stone-100'}
                                    onClick={onLogout}
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Выйти
                                </Button>
                                {/* Разместить */}
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