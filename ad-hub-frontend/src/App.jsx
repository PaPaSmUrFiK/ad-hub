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
import { tokenStorage, authAPI } from './api/auth';
import { userAPI } from './api/user';

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
            console.log('Сессия истекла, перенаправляем на страницу входа');
            setIsAuthenticated(false);
            setIsAdmin(false);
            setCurrentPage('home');
            // Можно показать уведомление пользователю
            alert('Ваша сессия истекла. Пожалуйста, войдите снова.');
        };

        window.addEventListener('auth:expired', handleAuthExpired);
        
        return () => {
            window.removeEventListener('auth:expired', handleAuthExpired);
        };
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
                    console.log('Данные пользователя при загрузке:', me);
                    
                    // Если запрос успешен, значит токены валидны
                    setIsAuthenticated(true);
                    
                    // Извлекаем роль из ответа (UserMeResponse возвращает role как строку)
                    const role = me.role || '';
                    console.log('Извлеченная роль:', role, '(полный объект me:', me, ')');
                    
                    // Проверка ролей
                    const isUserAdmin = role === 'ADMIN';
                    const isUserModerator = role === 'MODERATOR' || role === 'ADMIN';
                    console.log('Проверка роли ADMIN:', isUserAdmin, 'MODERATOR:', isUserModerator, '(роль:', role, ')');
                    
                    setIsAdmin(isUserAdmin);
                    setIsModerator(isUserModerator);
                    
                    // Если роль не ADMIN, явно логируем это
                    if (role && role !== 'ADMIN' && role !== 'MODERATOR') {
                        console.log('Пользователь не администратор и не модератор. Роль:', role);
                    }
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
                setIsAuthenticated(false);
                setIsAdmin(false);
                setIsModerator(false);
            }
                }
            } else {
                setIsAuthenticated(false);
                setIsAdmin(false);
            }
        };
        checkAuth();
    }, []); // Убираем зависимость от isAuthenticated, чтобы не было бесконечного цикла

    // Убрана автоматическая перенаправление администратора на панель администратора
    // Администратор может свободно переходить на главную страницу и другие разделы

    const handleLogin = async () => {
        console.log('handleLogin вызван');
        
        // Проверяем, что токены действительно сохранены
        const accessToken = tokenStorage.getAccessToken();
        const refreshToken = tokenStorage.getRefreshToken();
        
        if (!accessToken || !refreshToken) {
            console.error('Токены не найдены в localStorage при handleLogin');
            throw new Error('Токены авторизации не найдены');
        }
        
        console.log('Токены найдены, обновляем состояние');
        setIsAuthenticated(true);
        
        // Проверяем роль после входа
        try {
            console.log('Получаем данные пользователя...');
            const me = await userAPI.getMe();
            console.log('Данные пользователя получены:', me);
            
            // Извлекаем роль из ответа (UserMeResponse возвращает role как строку)
            const role = me.role || '';
            console.log('Извлеченная роль при входе:', role, '(полный объект me:', me, ')');
            
            // Проверка ролей
            const isUserAdmin = role === 'ADMIN';
            const isUserModerator = role === 'MODERATOR' || role === 'ADMIN';
            console.log('Проверка роли ADMIN при входе:', isUserAdmin, 'MODERATOR:', isUserModerator, '(роль:', role, ')');
            
            setIsAdmin(isUserAdmin);
            setIsModerator(isUserModerator);
            
            // Перенаправляем на главную страницу после успешного входа
            setCurrentPage('home');
            console.log('Перенаправление на главную страницу после входа');
            
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
        isModerator
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
                console.log('[App] Рендеринг AdminPanel - isAdmin из commonProps:', commonProps.isAdmin);
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

            default:
                // Убрана автоматическая замена главной страницы на панель администратора
                // Администратор может свободно переходить на главную страницу
                // Панель администратора доступна через отдельную вкладку в навигации
                return (
                    <div className={isDarkTheme ? 'min-h-screen bg-neutral-950' : 'min-h-screen bg-stone-100'}>
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
                        />
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
                        <Footer isDarkTheme={isDarkTheme} />
                    </div>
                );
        }
    };

    return renderPage();
}