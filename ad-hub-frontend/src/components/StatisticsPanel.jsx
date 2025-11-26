import { useState, useEffect } from 'react';
import { adminAPI } from '../api/admin';
import { BarChart3, Search, TrendingUp, Calendar, Loader2 } from 'lucide-react';

export function StatisticsPanel({ isDarkTheme }) {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const bgColor = isDarkTheme ? 'bg-neutral-950' : 'bg-stone-100';
    const cardBg = isDarkTheme ? 'bg-neutral-900' : 'bg-white';
    const borderColor = isDarkTheme ? 'border-neutral-800' : 'border-stone-200';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
    const textMuted = isDarkTheme ? 'text-neutral-400' : 'text-stone-600';
    const accentColor = isDarkTheme ? 'text-orange-400' : 'text-teal-600';

    useEffect(() => {
        loadStatistics();
    }, []);

    const loadStatistics = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await adminAPI.getSearchStatistics();
            setStats(data);
        } catch (err) {
            console.error('Ошибка при загрузке статистики:', err);
            setError(err.message || 'Не удалось загрузить статистику');
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ icon: Icon, title, value, subtitle, iconColor = accentColor }) => (
        <div className={`${cardBg} rounded-lg border ${borderColor} p-6`}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className={`${textMuted} text-sm mb-1`}>{title}</p>
                    <p className={`${textColor} text-3xl font-bold`}>{value?.toLocaleString('ru-RU') || '0'}</p>
                    {subtitle && <p className={`${textMuted} text-xs mt-1`}>{subtitle}</p>}
                </div>
                <div className={`${iconColor} bg-opacity-10 p-3 rounded-full`}>
                    <Icon className="h-6 w-6" />
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="text-center py-12">
                <Loader2 className={`h-8 w-8 ${textMuted} mx-auto animate-spin`} />
                <p className={`${textMuted} mt-2`}>Загрузка статистики...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`p-4 rounded ${isDarkTheme ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'}`}>
                {error}
            </div>
        );
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className={`${textColor} text-xl font-bold mb-2`}>Статистика поиска</h2>
                <p className={textMuted}>Аналитика по поисковым запросам на платформе</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={Search}
                    title="Всего поисков"
                    value={stats?.totalSearches || 0}
                    subtitle="За все время"
                />
                <StatCard
                    icon={Calendar}
                    title="Сегодня"
                    value={stats?.searchesToday || 0}
                    subtitle="Поисков за сегодня"
                />
                <StatCard
                    icon={TrendingUp}
                    title="На этой неделе"
                    value={stats?.searchesThisWeek || 0}
                    subtitle="Поисков за неделю"
                />
                <StatCard
                    icon={BarChart3}
                    title="В этом месяце"
                    value={stats?.searchesThisMonth || 0}
                    subtitle="Поисков за месяц"
                />
            </div>

            {/* Top Queries */}
            <div className={`${cardBg} rounded-lg border ${borderColor} p-6`}>
                <h3 className={`${textColor} text-lg font-semibold mb-4 flex items-center gap-2`}>
                    <TrendingUp className="h-5 w-5" />
                    Популярные запросы
                </h3>
                {stats?.topQueries && stats.topQueries.length > 0 ? (
                    <div className="space-y-3">
                        {stats.topQueries.map((query, index) => (
                            <div
                                key={index}
                                className={`flex items-center justify-between p-3 rounded ${isDarkTheme ? 'bg-neutral-800' : 'bg-stone-50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`${accentColor} font-bold text-lg w-8`}>
                                        {index + 1}
                                    </span>
                                    <span className={textColor}>{query.query || 'Неизвестный запрос'}</span>
                                </div>
                                <span className={`${textMuted} text-sm`}>
                                    {query.count?.toLocaleString('ru-RU') || 0} раз
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Search className={`h-12 w-12 ${textMuted} mx-auto mb-2`} />
                        <p className={textMuted}>Нет данных о популярных запросах</p>
                        <p className={`${textMuted} text-sm mt-1`}>
                            Статистика будет доступна после накопления данных о поисковых запросах
                        </p>
                    </div>
                )}
            </div>

            <div className={`mt-4 p-4 rounded ${isDarkTheme ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-700'} text-sm`}>
                <p>
                    <strong>Примечание:</strong> Статистика поиска находится в разработке. 
                    Полная функциональность будет доступна после внедрения системы логирования поисковых запросов.
                </p>
            </div>
        </div>
    );
}

