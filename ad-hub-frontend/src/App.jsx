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
import { tokenStorage, authAPI } from './api/auth';
import { userAPI } from './api/user';

export default function App() {
    const [currentPage, setCurrentPage] = useState('home');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isDarkTheme, setIsDarkTheme] = useState(false);
    const [selectedListingId, setSelectedListingId] = useState(null);
    const [searchParams, setSearchParams] = useState({
        query: null,
        categoryId: null,
        minPrice: null,
        maxPrice: null,
        location: null,
        sortBy: null,
    });
    const [isAdmin, setIsAdmin] = useState(false);

    // Проверяем авторизацию и роль при загрузке
    useEffect(() => {
        const checkAuth = async () => {
            const authenticated = tokenStorage.isAuthenticated();
            setIsAuthenticated(authenticated);
            
            if (authenticated) {
                try {
                    const me = await userAPI.getMe();
                    console.log('Данные пользователя при загрузке:', me);
                    
                    // Извлекаем роль из ответа (может быть в разных форматах)
                    const role = me.role?.name || me.roleName || '';
                    console.log('Извлеченная роль:', role);
                    
                    // Строгая проверка: только 'ADMIN', не 'MODERATOR' и не другие роли
                    const isUserAdmin = role === 'ADMIN';
                    console.log('Проверка роли ADMIN:', isUserAdmin, '(роль:', role, ')');
                    
                    setIsAdmin(isUserAdmin);
                    
                    // Если роль не ADMIN, явно логируем это
                    if (role && role !== 'ADMIN') {
                        console.log('Пользователь не администратор. Роль:', role);
                    }
                } catch (error) {
                    console.error('Ошибка при получении данных пользователя:', error);
                    setIsAdmin(false);
                }
            } else {
                setIsAdmin(false);
            }
        };
        checkAuth();
    }, [isAuthenticated]);

    // Перенаправляем администратора на панель администратора при загрузке или изменении роли
    useEffect(() => {
        if (isAuthenticated && isAdmin && currentPage === 'home') {
            console.log('✓ Перенаправление АДМИНИСТРАТОРА на панель администратора (isAdmin:', isAdmin, ')');
            setCurrentPage('admin');
        } else if (isAuthenticated && !isAdmin && currentPage === 'home') {
            console.log('Пользователь не администратор, остается на главной странице (isAdmin:', isAdmin, ')');
        }
    }, [isAuthenticated, isAdmin, currentPage]);

    const handleLogin = async () => {
        console.log('handleLogin вызван');
        
        // Проверяем, что токены действительно сохранены
        const accessToken = tokenStorage.getAccessToken();
        const refreshToken = tokenStorage.getRefreshToken();
        
        if (!accessToken || !refreshToken) {
            console.error('Токены не найдены в localStorage при handleLogin');
            return;
        }
        
        console.log('Токены найдены, обновляем состояние');
        setIsAuthenticated(true);
        
        // Проверяем роль после входа
        try {
            console.log('Получаем данные пользователя...');
            const me = await userAPI.getMe();
            console.log('Данные пользователя получены:', me);
            
            // Извлекаем роль из ответа (может быть в разных форматах)
            const role = me.role?.name || me.roleName || '';
            console.log('Извлеченная роль при входе:', role);
            
            // Строгая проверка: только 'ADMIN', не 'MODERATOR' и не другие роли
            const isUserAdmin = role === 'ADMIN';
            console.log('Проверка роли ADMIN при входе:', isUserAdmin, '(роль:', role, ')');
            
            setIsAdmin(isUserAdmin);
            
            // Если пользователь администратор, открываем панель администратора
            if (isUserAdmin) {
                console.log('✓ Пользователь является АДМИНИСТРАТОРОМ (ADMIN), открываем панель администратора');
                setCurrentPage('admin');
            } else {
                // Явно логируем, если это не администратор
                if (role) {
                    console.log('Пользователь НЕ администратор. Роль:', role, '- открываем главную страницу');
                } else {
                    console.log('Роль не определена - открываем главную страницу');
                }
                setCurrentPage('home');
            }
        } catch (error) {
            console.error('Ошибка при получении данных пользователя:', error);
            setIsAdmin(false);
            setCurrentPage('home');
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
        isAdmin
    };

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
                        onBack={() => setCurrentPage('profile')}
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
                        onCreateListing={() => setCurrentPage('create-listing')}
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

            default:
                // Если пользователь администратор и находится на главной странице, показываем панель администратора
                // Строгая проверка: только для роли ADMIN, не для MODERATOR
                if (isAuthenticated && isAdmin && currentPage === 'home') {
                    console.log('Рендеринг панели администратора вместо главной страницы (isAdmin:', isAdmin, ')');
                    return <AdminPanel {...commonProps} />;
                }
                
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
                        />
                        <Footer isDarkTheme={isDarkTheme} />
                    </div>
                );
        }
    };

    return renderPage();
}