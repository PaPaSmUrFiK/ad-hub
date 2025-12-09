import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Header } from './Header';
import { Footer } from './Footer';

export function FatalErrorPage({
    message = 'Произошла критическая ошибка. Работа приложения невозможна.',
    isDarkTheme,
    onToggleTheme,
    isAuthenticated,
    onLoginClick,
    onLogout,
    onNavigate,
    isAdmin = false,
    isModerator = false
}) {
    const bgColor = isDarkTheme ? 'bg-neutral-950' : 'bg-stone-100';
    const cardBg = isDarkTheme ? 'bg-neutral-900' : 'bg-white';
    const borderColor = isDarkTheme ? 'border-neutral-800' : 'border-stone-200';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
    const textMuted = isDarkTheme ? 'text-neutral-400' : 'text-stone-600';
    const buttonBg = isDarkTheme ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700';

    return (
        <div className={`min-h-screen flex flex-col ${bgColor}`}>
            <Header
                onLoginClick={onLoginClick}
                onRegisterClick={onLoginClick}
                onFavoritesClick={() => onNavigate?.('favorites')}
                onLogout={onLogout}
                isAuthenticated={isAuthenticated}
                isDarkTheme={isDarkTheme}
                onToggleTheme={onToggleTheme}
                currentPage="fatal-error"
                onNavigate={onNavigate}
                hideCreateButton
                isAdmin={isAdmin}
                isModerator={isModerator}
            />

            <main className="flex-1">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className={`${cardBg} border ${borderColor} rounded-2xl shadow-lg p-8 text-center`}>
                    <div className="flex justify-center mb-6">
                        <AlertTriangle className={`h-14 w-14 ${isDarkTheme ? 'text-orange-400' : 'text-teal-600'}`} />
                    </div>
                    <h1 className={`${textColor} text-2xl font-bold mb-3`}>Критическая ошибка</h1>
                    <p className={`${textMuted} mb-8 whitespace-pre-wrap`}>{message}</p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                            className={`${buttonBg} text-white`}
                            onClick={() => window.location.reload()}
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Обновить страницу
                        </Button>
                        <Button
                            variant="outline"
                            className={`${borderColor}`}
                            onClick={() => onNavigate?.('home')}
                        >
                            <Home className="h-4 w-4 mr-2" />
                            На главную
                        </Button>
                    </div>
                </div>
            </div>
            </main>

            <Footer isDarkTheme={isDarkTheme} />
        </div>
    );
}

