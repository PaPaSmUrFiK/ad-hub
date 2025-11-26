import { useState, useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { UsersManagement } from './UsersManagement';
import { CategoriesManagement } from './CategoriesManagement';
import { StatisticsPanel } from './StatisticsPanel';
import { userAPI } from '../api/user';
import { Users, FolderTree, BarChart3, Shield, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';

export function AdminPanel({
    isDarkTheme,
    onToggleTheme,
    isAuthenticated,
    onLoginClick,
    onLogout,
    onNavigate,
    initialTab = 'users',
    isAdmin = true, // По умолчанию true, так как это панель администратора
}) {
    const [activeTab, setActiveTab] = useState(initialTab);
    
    // Обновляем активную вкладку при изменении initialTab
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);
    
    // Экспортируем функцию для переключения вкладок через window (для Header)
    useEffect(() => {
        window.setAdminTab = (tab) => {
            setActiveTab(tab);
        };
        return () => {
            delete window.setAdminTab;
        };
    }, []);
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        try {
            setLoading(true);
            setError('');
            const me = await userAPI.getMe();
            const role = me.role?.name || me.roleName || '';
            setUserRole(role);
            
            if (role !== 'ADMIN') {
                setError('У вас нет доступа к панели администратора');
            }
        } catch (err) {
            console.error('Ошибка при проверке доступа:', err);
            setError(err.message || 'Не удалось проверить доступ');
        } finally {
            setLoading(false);
        }
    };

    const bgColor = isDarkTheme ? 'bg-neutral-950' : 'bg-stone-100';
    const cardBg = isDarkTheme ? 'bg-neutral-900' : 'bg-white';
    const borderColor = isDarkTheme ? 'border-neutral-800' : 'border-stone-200';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
    const textMuted = isDarkTheme ? 'text-neutral-400' : 'text-stone-600';
    const activeTabBg = isDarkTheme ? 'bg-neutral-800 border-orange-500' : 'bg-stone-50 border-teal-600';
    const tabBg = isDarkTheme ? 'bg-neutral-900 border-neutral-700' : 'bg-white border-stone-200';

    if (loading) {
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
                    currentPage="admin"
                    onNavigate={onNavigate}
                    isAdmin={isAdmin}
                />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <p className={textMuted}>Загрузка...</p>
                </div>
                <Footer isDarkTheme={isDarkTheme} />
            </div>
        );
    }

    if (error || userRole !== 'ADMIN') {
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
                    currentPage="admin"
                    onNavigate={onNavigate}
                    isAdmin={isAdmin}
                />
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className={`${cardBg} rounded-xl border ${borderColor} p-8 max-w-md text-center`}>
                        <AlertCircle className={`h-12 w-12 ${isDarkTheme ? 'text-red-400' : 'text-red-600'} mx-auto mb-4`} />
                        <h2 className={`${textColor} text-xl font-bold mb-2`}>Доступ запрещен</h2>
                        <p className={textMuted}>{error || 'У вас нет доступа к панели администратора'}</p>
                        <Button
                            onClick={() => onNavigate('home')}
                            className={`mt-4 ${isDarkTheme ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700'} text-white`}
                        >
                            Вернуться на главную
                        </Button>
                    </div>
                </div>
                <Footer isDarkTheme={isDarkTheme} />
            </div>
        );
    }

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
                currentPage="admin"
                onNavigate={onNavigate}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Shield className={`h-8 w-8 ${isDarkTheme ? 'text-orange-500' : 'text-teal-600'}`} />
                        <h1 className={`${textColor} text-3xl font-bold`}>Панель администратора</h1>
                    </div>
                    <p className={textMuted}>Управление пользователями, категориями и статистикой</p>
                </div>

                {/* Tabs */}
                <div className={`${cardBg} rounded-xl border ${borderColor} mb-6 overflow-hidden`}>
                    <div className={`flex flex-wrap border-b ${borderColor}`}>
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-6 py-4 flex items-center gap-2 font-medium transition-colors ${
                                activeTab === 'users'
                                    ? `${activeTabBg} ${isDarkTheme ? 'text-orange-400 border-b-2' : 'text-teal-600 border-b-2'}`
                                    : `${tabBg} ${textMuted} hover:${isDarkTheme ? 'bg-neutral-800' : 'bg-stone-50'}`
                            }`}
                        >
                            <Users className="h-5 w-5" />
                            Пользователи
                        </button>
                        <button
                            onClick={() => setActiveTab('categories')}
                            className={`px-6 py-4 flex items-center gap-2 font-medium transition-colors ${
                                activeTab === 'categories'
                                    ? `${activeTabBg} ${isDarkTheme ? 'text-orange-400 border-b-2' : 'text-teal-600 border-b-2'}`
                                    : `${tabBg} ${textMuted} hover:${isDarkTheme ? 'bg-neutral-800' : 'bg-stone-50'}`
                            }`}
                        >
                            <FolderTree className="h-5 w-5" />
                            Категории
                        </button>
                        <button
                            onClick={() => setActiveTab('statistics')}
                            className={`px-6 py-4 flex items-center gap-2 font-medium transition-colors ${
                                activeTab === 'statistics'
                                    ? `${activeTabBg} ${isDarkTheme ? 'text-orange-400 border-b-2' : 'text-teal-600 border-b-2'}`
                                    : `${tabBg} ${textMuted} hover:${isDarkTheme ? 'bg-neutral-800' : 'bg-stone-50'}`
                            }`}
                        >
                            <BarChart3 className="h-5 w-5" />
                            Статистика
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'users' && (
                            <UsersManagement isDarkTheme={isDarkTheme} />
                        )}
                        {activeTab === 'categories' && (
                            <CategoriesManagement isDarkTheme={isDarkTheme} />
                        )}
                        {activeTab === 'statistics' && (
                            <StatisticsPanel isDarkTheme={isDarkTheme} />
                        )}
                    </div>
                </div>
            </div>

            <Footer isDarkTheme={isDarkTheme} />
        </div>
    );
}

