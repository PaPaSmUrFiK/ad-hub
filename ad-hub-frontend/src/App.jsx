import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Categories } from './components/Categories';
import { FeaturedListings } from './components/FeaturedListings';
import { Footer } from './components/Footer';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ListingDetailPage } from './components/ListingDetailPage';
import { FavoritesPage } from './components/FavoritesPage';
import { CreateListingPage } from './components/CreateListingPage';
import { NotificationsPage } from './components/NotificationsPage';
import { ProfilePage } from './components/ProfilePage';
import { AllListingsPage } from './components/AllListingsPage';
import { CategoriesPage } from './components/CategoriesPage';
import { AdminPanel } from './components/AdminPanel';
import { ModerationPage } from './components/ModerationPage';
import { ModerationListingDetailPage } from './components/ModerationListingDetailPage';
import { FatalErrorPage } from './components/FatalErrorPage';
import { tokenStorage, authAPI } from './api/auth';
import { userAPI } from './api/user';
import { notificationsAPI } from './api/notifications';

export default function App() {
    // Восстанавливаем состояние из localStorage при загрузке
    const [currentPage, setCurrentPage] = useState(() => {
        const saved = localStorage.getItem('currentPage');
        return saved || 'home';
    });
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isDarkTheme, setIsDarkTheme] = useState(() => {
        const saved = localStorage.getItem('isDarkTheme');
        return saved === 'true';
    });
    const [selectedListingId, setSelectedListingId] = useState(() => {
        const saved = localStorage.getItem('selectedListingId');
        return saved ? parseInt(saved) : null;
    });
    const [editAdData, setEditAdData] = useState(null); // Данные черновика для редактирования
    const [searchParams, setSearchParams] = useState(() => {
        const saved = localStorage.getItem('searchParams');
        return saved ? JSON.parse(saved) : {
            query: null,
            categoryId: null,
            minPrice: null,
            maxPrice: null,
            location: null,
            sortBy: null,
        };
    });
    const [isAdmin, setIsAdmin] = useState(false);
    const [isModerator, setIsModerator] = useState(false);
    const [fatalError, setFatalError] = useState(null); // { message }
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasNotifications, setHasNotifications] = useState(false);
    
    // Сохраняем состояние в localStorage при изменении
    useEffect(() => {
        localStorage.setItem('currentPage', currentPage);
    }, [currentPage]);
    
    useEffect(() => {
        localStorage.setItem('isDarkTheme', isDarkTheme.toString());
    }, [isDarkTheme]);
    
    useEffect(() => {
        if (selectedListingId) {
            localStorage.setItem('selectedListingId', selectedListingId.toString());
        } else {
            localStorage.removeItem('selectedListingId');
        }
    }, [selectedListingId]);
    
    useEffect(() => {
        localStorage.setItem('searchParams', JSON.stringify(searchParams));
    }, [searchParams]);

    // Обработчик истечения сессии
    useEffect(() => {
        const handleAuthExpired = () => {
            setIsAuthenticated(false);
            setIsAdmin(false);
            setIsModerator(false);
            setCurrentPage('home');
            // Можно показать уведомление пользователю
            alert('Ваша сессия истекла. Пожалуйста, войдите снова.');
        };

        window.addEventListener('auth:expired', handleAuthExpired);
        
        return () => {
            window.removeEventListener('auth:expired', handleAuthExpired);
        };
    }, []);

    // Глобальный обработчик критических ошибок (недоступен сервер, 5xx и т.п.)
    useEffect(() => {
        const handleFatalError = (event) => {
            const message = event?.detail || 'Произошла критическая ошибка. Работа приложения невозможна.';
            console.error('Получена критическая ошибка:', message);
            setFatalError({ message });
            setCurrentPage('fatal-error');
        };

        window.addEventListener('fatal:error', handleFatalError);
        return () => window.removeEventListener('fatal:error', handleFatalError);
    }, []);

    // Проверяем авторизацию и роль при загрузке
    useEffect(() => {
        const checkAuth = async () => {
            const authenticated = tokenStorage.isAuthenticated();
            
            if (authenticated) {
                try {
                    // Используем userAPI.getMe(), который использует fetchWithAuth
                    // и автоматически обновит токен при необходимости
                    const me = await userAPI.getMe();
                    // Если запрос успешен, значит токены валидны
                    setIsAuthenticated(true);
                    
                    // Извлекаем роль из ответа (UserMeResponse возвращает role как строку)
                    const role = me.role || '';
                    
                    // Проверка ролей
                    const isUserAdmin = role === 'ADMIN';
                    const isUserModerator = role === 'MODERATOR' || role === 'ADMIN';
                    
                    setIsAdmin(isUserAdmin);
                    setIsModerator(isUserModerator);
                    
                    // Загружаем количество непрочитанных уведомлений
                    try {
                        const count = await notificationsAPI.getUnreadCount();
                        setUnreadCount(count || 0);
                        setHasNotifications((count || 0) > 0);
                    } catch (e) {
                        console.error('Ошибка при загрузке количества уведомлений:', e);
                        setUnreadCount(0);
                        // hasNotifications проверим отдельным запросом
                    }
                    
                    // Если роль не ADMIN/MODERATOR, просто продолжаем без доп. логов
                } catch (error) {
                    console.error('Ошибка при получении данных пользователя:', error);
                    // Если ошибка связана с истечением сессии или авторизацией
                    if (error.message && (
                        error.message.includes('Сессия истекла') || 
                        error.message.includes('Необходима авторизация') ||
                        error.message.includes('Unauthorized')
                    )) {
                        // Очищаем токены и состояние
                        tokenStorage.clearTokens();
                        setIsAuthenticated(false);
                        setIsAdmin(false);
                        setIsModerator(false);
                        setCurrentPage('home');
                        // Очищаем сохраненное состояние
                        localStorage.removeItem('currentPage');
                        localStorage.removeItem('selectedListingId');
                    } else {
                        // Для других ошибок просто сбрасываем авторизацию
                        setIsAuthenticated(false);
                        setIsAdmin(false);
                        setIsModerator(false);
                    }
                }
            } else {
                setIsAuthenticated(false);
                setIsAdmin(false);
                setIsModerator(false);
            }
        };
        checkAuth();
    }, []); // Убираем зависимость от isAuthenticated, чтобы не было бесконечного цикла

    // Обновляем счетчик непрочитанных при изменении статуса авторизации
    useEffect(() => {
        const loadUnread = async () => {
            if (!isAuthenticated) {
                setUnreadCount(0);
                return;
            }
            try {
                const count = await notificationsAPI.getUnreadCount();
                setUnreadCount(count || 0);
            } catch (e) {
                console.error('Ошибка при загрузке количества уведомлений:', e);
            }
        };
        loadUnread();
    }, [isAuthenticated]);

    // Обновляем счетчик непрочитанных при изменении статуса авторизации
    useEffect(() => {
        const loadUnread = async () => {
            if (!isAuthenticated) {
                setUnreadCount(0);
                return;
            }
            try {
                const count = await notificationsAPI.getUnreadCount();
                setUnreadCount(count || 0);
            } catch (e) {
                console.error('Ошибка при загрузке количества уведомлений:', e);
            }
        };
        loadUnread();
    }, [isAuthenticated]);

    // Дополнительно обновляем счетчик уведомлений при смене аутентификации
    useEffect(() => {
        const loadUnread = async () => {
            if (!isAuthenticated) {
                setUnreadCount(0);
                setHasNotifications(false);
                return;
            }
            try {
                const count = await notificationsAPI.getUnreadCount();
                setUnreadCount(count || 0);
                setHasNotifications((count || 0) > 0);
            } catch (e) {
                console.error('Ошибка при загрузке количества уведомлений:', e);
            }
        };
        loadUnread();
    }, [isAuthenticated]);

    // Проверяем наличие любых уведомлений (даже прочитанных), чтобы подсветить иконку
    useEffect(() => {
        const checkAnyNotifications = async () => {
            if (!isAuthenticated) {
                setHasNotifications(false);
                return;
            }
            try {
                const data = await notificationsAPI.getNotifications({ page: 1, size: 1 });
                const hasAny = Array.isArray(data) ? data.length > 0 : (data?.content?.length || 0) > 0;
                setHasNotifications(hasAny);
            } catch (e) {
                console.error('Ошибка при проверке наличия уведомлений:', e);
            }
        };
        checkAnyNotifications();
    }, [isAuthenticated]);

    // Убрана автоматическая перенаправление администратора на панель администратора
    // Администратор может свободно переходить на главную страницу и другие разделы

    const handleLogin = async () => {
        // Проверяем, что токены действительно сохранены
        const accessToken = tokenStorage.getAccessToken();
        const refreshToken = tokenStorage.getRefreshToken();
        
        if (!accessToken || !refreshToken) {
            console.error('Токены не найдены в localStorage при handleLogin');
            throw new Error('Токены авторизации не найдены');
        }
        
        setIsAuthenticated(true);
        
        // Проверяем роль после входа
        try {
            const me = await userAPI.getMe();
            
            // Извлекаем роль из ответа (UserMeResponse возвращает role как строку)
            const role = me.role || '';
            
            // Проверка ролей
            const isUserAdmin = role === 'ADMIN';
            const isUserModerator = role === 'MODERATOR' || role === 'ADMIN';
            
            setIsAdmin(isUserAdmin);
            setIsModerator(isUserModerator);
            
            // Перенаправляем на главную страницу после успешного входа
            setCurrentPage('home');
            
            // Убрано автоматическое перенаправление администратора
            // Администратор может свободно выбирать страницу через навигацию
            // Вкладка "Панель администратора" доступна в навигации для администратора
        } catch (error) {
            console.error('Ошибка при получении данных пользователя:', error);
            // Если не удалось получить данные пользователя, очищаем токены и состояние
            tokenStorage.clearTokens();
            setIsAuthenticated(false);
            setIsAdmin(false);
            setIsModerator(false);
            setCurrentPage('home');
            throw error; // Пробрасываем ошибку дальше
        }
    };

    const handleLogout = async () => {
        // Подтверждение выхода
        const confirmed = window.confirm('Вы уверены, что хотите выйти из аккаунта?');
        if (!confirmed) {
            return;
        }

        try {
            // Пытаемся выполнить выход на сервере
            await authAPI.logout();
        } catch (error) {
            // Даже если сервер вернул ошибку, очищаем локальные данные
            console.error('Ошибка при выходе на сервере:', error);
        } finally {
            // Всегда очищаем локальные данные и состояние
            setIsAuthenticated(false);
            setCurrentPage('home');
            setSelectedListingId(null);
            
            // Очищаем сохраненное состояние из localStorage
            localStorage.removeItem('currentPage');
            localStorage.removeItem('selectedListingId');
            localStorage.removeItem('searchParams');
            
            // Очищаем все данные из localStorage (на случай, если есть другие данные)
            // tokenStorage.clearTokens() уже вызывается в authAPI.logout()
        }
    };

    const handleViewListing = (id) => {
        setSelectedListingId(id);
        setCurrentPage('listing');
    };

    // Обработка поиска
    const handleSearch = (query, categoryId) => {
        // Сохраняем параметры поиска для передачи на страницу всех объявлений
        setSearchParams({
            query: query || null,
            categoryId: categoryId || null,
            minPrice: null,
            maxPrice: null,
            location: null,
            sortBy: null,
        });
        setCurrentPage('all-listings');
    };

    // Общие пропсы для страниц
    const commonProps = {
        isDarkTheme,
        onToggleTheme: () => setIsDarkTheme(!isDarkTheme),
        isAuthenticated,
        onLoginClick: () => setCurrentPage('login'),
        onLogout: handleLogout,
        onNavigate: setCurrentPage,
        isAdmin,
        isModerator,
        unreadCount,
        onUnreadCountChange: (count) => {
            setUnreadCount(count || 0);
            setHasNotifications((count || 0) > 0);
        },
        hasNotifications,
        onHasNotificationsChange: (flag) => setHasNotifications(!!flag)
    };
    
    // Логируем commonProps при изменении isAdmin
    useEffect(() => {
        console.log('[App] commonProps обновлены - isAdmin:', commonProps.isAdmin, 'isAuthenticated:', commonProps.isAuthenticated);
    }, [isAdmin, isAuthenticated]);

    // Рендер страниц
    const renderPage = () => {
        switch (currentPage) {
            case 'login':
                return (
                    <LoginPage
                        onBack={() => setCurrentPage('home')}
                        onRegisterClick={() => setCurrentPage('register')}
                        onLogin={handleLogin}
                    />
                );

            case 'register':
                return (
                    <RegisterPage
                        onBack={() => setCurrentPage('home')}
                        onLoginClick={() => setCurrentPage('login')}
                        onRegister={handleLogin}
                    />
                );

            case 'listing':
                return selectedListingId ? (
                    <ListingDetailPage
                        listingId={selectedListingId}
                        onBack={() => setCurrentPage('home')}
                        {...commonProps}
                    />
                ) : null;

            case 'favorites':
                return (
                    <FavoritesPage
                        onBack={() => setCurrentPage('home')}
                        onViewListing={handleViewListing}
                        {...commonProps}
                    />
                );

            case 'create-listing':
                return (
                    <CreateListingPage
                        onBack={() => {
                            setEditAdData(null);
                            setCurrentPage('profile');
                        }}
                        editAdData={editAdData}
                        onEditComplete={() => setEditAdData(null)}
                        {...commonProps}
                    />
                );

            case 'notifications':
                return <NotificationsPage {...commonProps} />;

            case 'profile':
                return (
                    <ProfilePage
                        {...commonProps}
                        onViewListing={handleViewListing}
                        onCreateListing={() => {
                            setEditAdData(null);
                            setCurrentPage('create-listing');
                        }}
                        onEditDraft={(adData) => {
                            setEditAdData(adData);
                            setCurrentPage('create-listing');
                        }}
                    />
                );

            case 'all-listings':
                return (
                    <AllListingsPage
                        {...commonProps}
                        onViewListing={handleViewListing}
                        initialSearchParams={searchParams}
                        onSearchParamsChange={setSearchParams}
                    />
                );

            case 'categories':
                return <CategoriesPage {...commonProps} />;

            case 'admin':
                return <AdminPanel {...commonProps} initialTab={searchParams.adminTab || 'users'} />;

            case 'moderation':
                return (
                    <ModerationPage
                        {...commonProps}
                        onViewListing={(id) => {
                            setSelectedListingId(id);
                            setCurrentPage('moderation-listing');
                        }}
                    />
                );

            case 'moderation-listing':
                return selectedListingId ? (
                    <ModerationListingDetailPage
                        listingId={selectedListingId}
                        onBack={() => setCurrentPage('moderation')}
                        {...commonProps}
                    />
                ) : null;

            case 'fatal-error':
                return (
                    <FatalErrorPage
                        {...commonProps}
                        message={fatalError?.message}
                    />
                );

            default:
                // Убрана автоматическая замена главной страницы на панель администратора
                // Администратор может свободно переходить на главную страницу
                // Панель администратора доступна через отдельную вкладку в навигации
                return (
                    <div className={isDarkTheme ? 'min-h-screen bg-neutral-950 flex flex-col' : 'min-h-screen bg-stone-100 flex flex-col'}>
                        <Header
                            onLoginClick={() => setCurrentPage('login')}
                            onRegisterClick={() => setCurrentPage('register')}
                            onFavoritesClick={() => setCurrentPage('favorites')}
                            onLogout={handleLogout}
                            isAuthenticated={isAuthenticated}
                            isDarkTheme={isDarkTheme}
                            onToggleTheme={() => setIsDarkTheme(!isDarkTheme)}
                            currentPage={currentPage}
                            onNavigate={setCurrentPage}
                            isAdmin={isAdmin}
                            isModerator={isModerator}
                            unreadCount={unreadCount}
                        />
                        <main className="flex-1">
                            <Hero
                                isDarkTheme={isDarkTheme}
                                onSearch={handleSearch}
                            />
                            <Categories 
                                isDarkTheme={isDarkTheme}
                                onNavigate={(page, params) => {
                                    if (params && params.categoryId) {
                                        setSearchParams({
                                            query: null,
                                            categoryId: params.categoryId,
                                            minPrice: null,
                                            maxPrice: null,
                                            location: null,
                                            sortBy: null,
                                        });
                                    }
                                    setCurrentPage(page);
                                }}
                            />
                            <FeaturedListings
                                isDarkTheme={isDarkTheme}
                                onViewListing={handleViewListing}
                                onNavigate={setCurrentPage}
                                isAuthenticated={isAuthenticated}
                                onLoginClick={() => setCurrentPage('login')}
                            />
                        </main>
                        <Footer isDarkTheme={isDarkTheme} />
                    </div>
                );
        }
    };

    return renderPage();
}