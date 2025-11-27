import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../api/admin';
import { userAPI } from '../api/user';
import { Search, Shield, ShieldCheck, ShieldX, Trash2, Edit, X, Check, Loader2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';

export function UsersManagement({ isDarkTheme }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUserId, setCurrentUserId] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
    });
    const [selectedUser, setSelectedUser] = useState(null);
    const [showRoleDialog, setShowRoleDialog] = useState(false);
    const [newRole, setNewRole] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const isOpeningRef = useRef(false);

    // Отслеживание изменений состояния диалога
    useEffect(() => {
        console.log('[UsersManagement] showRoleDialog изменился:', showRoleDialog, 'selectedUser:', selectedUser);
        if (showRoleDialog) {
            // Сбрасываем флаг открытия после небольшой задержки
            setTimeout(() => {
                isOpeningRef.current = false;
            }, 100);
        }
    }, [showRoleDialog, selectedUser]);

    const bgColor = isDarkTheme ? 'bg-neutral-950' : 'bg-stone-100';
    const cardBg = isDarkTheme ? 'bg-neutral-900' : 'bg-white';
    const borderColor = isDarkTheme ? 'border-neutral-800' : 'border-stone-200';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
    const textMuted = isDarkTheme ? 'text-neutral-400' : 'text-stone-600';
    const inputBg = isDarkTheme ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-white border-stone-300';
    const buttonBg = isDarkTheme ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700';

    useEffect(() => {
        // Загружаем ID текущего пользователя
        const loadCurrentUser = async () => {
            try {
                const me = await userAPI.getMe();
                setCurrentUserId(me.id);
            } catch (err) {
                console.error('Ошибка при загрузке текущего пользователя:', err);
            }
        };
        loadCurrentUser();
    }, []);

    useEffect(() => {
        // Проверяем валидность номера страницы
        setPagination(prev => {
            if (prev.page < 1) {
                return { ...prev, page: 1 };
            }
            if (prev.totalPages > 0 && prev.page > prev.totalPages) {
                return { ...prev, page: prev.totalPages };
            }
            return prev;
        });
        loadUsers();
    }, [pagination.page, searchQuery]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await adminAPI.getUsers(pagination.page, pagination.size, searchQuery);
            setUsers(data.users || []);
            setPagination(prev => ({
                ...prev,
                totalElements: data.totalElements || 0,
                totalPages: data.totalPages || 0,
                hasNext: data.hasNext || false,
                hasPrevious: data.hasPrevious || false,
            }));
        } catch (err) {
            console.error('Ошибка при загрузке пользователей:', err);
            setError(err.message || 'Не удалось загрузить пользователей');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
        loadUsers();
    };

    const handleBlock = async (userId) => {
        if (userId === currentUserId) {
            alert('Вы не можете заблокировать себя');
            return;
        }
        
        if (!window.confirm('Вы уверены, что хотите заблокировать этого пользователя?')) {
            return;
        }
        try {
            setActionLoading(userId);
            await adminAPI.blockUser(userId);
            await loadUsers();
        } catch (err) {
            alert(err.message || 'Ошибка при блокировке пользователя');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnblock = async (userId) => {
        try {
            setActionLoading(userId);
            await adminAPI.unblockUser(userId);
            await loadUsers();
        } catch (err) {
            alert(err.message || 'Ошибка при разблокировке пользователя');
        } finally {
            setActionLoading(null);
        }
    };

    const handleChangeRole = async () => {
        if (!selectedUser || !newRole) return;
        
        // Проверяем, что не пытаемся изменить роль на ту же самую
        if (selectedUser.roleName === newRole) {
            alert('Пользователь уже имеет эту роль');
            return;
        }
        
        try {
            setActionLoading(selectedUser.id);
            await adminAPI.updateUserRole(selectedUser.id, newRole);
            setShowRoleDialog(false);
            setSelectedUser(null);
            setNewRole('');
            // Обновляем список пользователей
            await loadUsers();
        } catch (err) {
            alert(err.message || 'Ошибка при изменении роли');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этого пользователя? Это действие нельзя отменить!')) {
            return;
        }
        try {
            setActionLoading(userId);
            await adminAPI.deleteUser(userId);
            await loadUsers();
        } catch (err) {
            alert(err.message || 'Ошибка при удалении пользователя');
        } finally {
            setActionLoading(null);
        }
    };

    const openRoleDialog = (user, e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        console.log('[UsersManagement] Открытие диалога изменения роли для пользователя:', user);
        isOpeningRef.current = true;
        setSelectedUser(user);
        setNewRole(user.roleName || '');
        setShowRoleDialog(true);
        console.log('[UsersManagement] showRoleDialog установлен в true');
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Никогда';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status) => {
        if (status === 'BLOCKED') {
            return (
                <span className={`px-2 py-1 rounded text-xs font-medium ${isDarkTheme ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'}`}>
                    Заблокирован
                </span>
            );
        }
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${isDarkTheme ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                Активен
            </span>
        );
    };

    const getRoleBadge = (role) => {
        const colors = {
            ADMIN: isDarkTheme ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700',
            MODERATOR: isDarkTheme ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700',
            USER: isDarkTheme ? 'bg-neutral-700 text-neutral-300' : 'bg-stone-200 text-stone-700',
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${colors[role] || colors.USER}`}>
                {role}
            </span>
        );
    };

    return (
        <div>
            {/* Search */}
            <form onSubmit={handleSearch} className="mb-6">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${textMuted}`} />
                        <Input
                            placeholder="Поиск по имени, email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`${inputBg} pl-10`}
                        />
                    </div>
                    <Button type="submit" className={buttonBg}>
                        Найти
                    </Button>
                </div>
            </form>

            {error && (
                <div className={`mb-4 p-3 rounded ${isDarkTheme ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'}`}>
                    {error}
                </div>
            )}

            {/* Users Table */}
            {loading ? (
                <div className="text-center py-12">
                    <Loader2 className={`h-8 w-8 ${textMuted} mx-auto animate-spin`} />
                    <p className={`${textMuted} mt-2`}>Загрузка пользователей...</p>
                </div>
            ) : users.length === 0 ? (
                <div className="text-center py-12">
                    <p className={textMuted}>Пользователи не найдены</p>
                </div>
            ) : (
                <>
                    <div className={`${cardBg} rounded-lg border ${borderColor} overflow-hidden`}>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className={isDarkTheme ? 'bg-neutral-800' : 'bg-stone-50'}>
                                    <tr>
                                        <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>ID</th>
                                        <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>Пользователь</th>
                                        <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>Email</th>
                                        <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>Роль</th>
                                        <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>Статус</th>
                                        <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>Объявлений</th>
                                        <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>Регистрация</th>
                                        <th className={`px-4 py-3 text-left text-xs font-medium ${textMuted} uppercase tracking-wider`}>Действия</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDarkTheme ? 'divide-neutral-800' : 'divide-stone-200'}`}>
                                    {users.map((user) => (
                                        <tr key={user.id} className={isDarkTheme ? 'hover:bg-neutral-800' : 'hover:bg-stone-50'}>
                                            <td className={`px-4 py-3 text-sm ${textColor}`}>{user.id}</td>
                                            <td className={`px-4 py-3 text-sm ${textColor}`}>
                                                <div>
                                                    <div className="font-medium">{user.username}</div>
                                                    <div className={textMuted}>
                                                        {user.firstName} {user.lastName}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`px-4 py-3 text-sm ${textColor}`}>{user.email}</td>
                                            <td className={`px-4 py-3 text-sm`}>{getRoleBadge(user.roleName)}</td>
                                            <td className={`px-4 py-3 text-sm`}>{getStatusBadge(user.status)}</td>
                                            <td className={`px-4 py-3 text-sm ${textColor}`}>{user.adsCount}</td>
                                            <td className={`px-4 py-3 text-sm ${textMuted}`}>{formatDate(user.createdAt)}</td>
                                            <td className={`px-4 py-3 text-sm`}>
                                                <div className="flex items-center gap-2">
                                                    {user.id !== currentUserId && (
                                                        <button
                                                            onClick={(e) => openRoleDialog(user, e)}
                                                            disabled={actionLoading === user.id}
                                                            className={`p-1.5 rounded ${isDarkTheme ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-stone-100 text-stone-600'}`}
                                                            title="Изменить роль"
                                                            type="button"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {user.id !== currentUserId && (
                                                        <>
                                                            {user.status === 'BLOCKED' ? (
                                                                <button
                                                                    onClick={() => handleUnblock(user.id)}
                                                                    disabled={actionLoading === user.id}
                                                                    className={`p-1.5 rounded ${isDarkTheme ? 'hover:bg-neutral-800 text-green-400' : 'hover:bg-stone-100 text-green-600'}`}
                                                                    title="Разблокировать"
                                                                >
                                                                    {actionLoading === user.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <ShieldCheck className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleBlock(user.id)}
                                                                    disabled={actionLoading === user.id}
                                                                    className={`p-1.5 rounded ${isDarkTheme ? 'hover:bg-neutral-800 text-red-400' : 'hover:bg-stone-100 text-red-600'}`}
                                                                    title="Заблокировать"
                                                                >
                                                                    {actionLoading === user.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <ShieldX className="h-4 w-4" />
                                                                    )}
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                    {user.id !== currentUserId && (
                                                        <button
                                                            onClick={() => handleDelete(user.id)}
                                                            disabled={actionLoading === user.id}
                                                            className={`p-1.5 rounded ${isDarkTheme ? 'hover:bg-neutral-800 text-red-400' : 'hover:bg-stone-100 text-red-600'}`}
                                                            title="Удалить"
                                                        >
                                                            {actionLoading === user.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="h-4 w-4" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="mt-6 space-y-4">
                            {/* Информация о текущей странице */}
                            <div className={`text-center ${textMuted} text-sm`}>
                                Показано {((pagination.page - 1) * pagination.size) + 1} - {Math.min(pagination.page * pagination.size, pagination.totalElements)} из {pagination.totalElements} пользователей
                            </div>
                            
                            {/* Навигация */}
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (pagination.page > 1) {
                                            setPagination(prev => ({ ...prev, page: prev.page - 1 }));
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                    }}
                                    disabled={!pagination.hasPrevious || actionLoading || pagination.page <= 1}
                                    className={borderColor}
                                >
                                    Предыдущая
                                </Button>
                                
                                {/* Номера страниц */}
                                {(() => {
                                    const pages = [];
                                    const maxVisible = 5;
                                    const currentPage = pagination.page;
                                    const totalPages = pagination.totalPages;

                                    if (totalPages <= maxVisible) {
                                        for (let i = 1; i <= totalPages; i++) {
                                            pages.push(i);
                                        }
                                    } else {
                                        if (currentPage <= 3) {
                                            for (let i = 1; i <= maxVisible; i++) {
                                                pages.push(i);
                                            }
                                            if (totalPages > maxVisible + 1) {
                                                pages.push('ellipsis');
                                            }
                                            pages.push(totalPages);
                                        } else if (currentPage >= totalPages - 2) {
                                            pages.push(1);
                                            if (totalPages > maxVisible + 1) {
                                                pages.push('ellipsis');
                                            }
                                            for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
                                                pages.push(i);
                                            }
                                        } else {
                                            pages.push(1);
                                            pages.push('ellipsis');
                                            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                                                pages.push(i);
                                            }
                                            pages.push('ellipsis');
                                            pages.push(totalPages);
                                        }
                                    }

                                    return pages.map((page, index) => {
                                        if (page === 'ellipsis') {
                                            return (
                                                <span key={`ellipsis-${index}`} className={`px-2 ${textMuted}`}>
                                                    ...
                                                </span>
                                            );
                                        }
                                        
                                        return (
                                            <Button
                                                key={page}
                                                variant={currentPage === page ? "default" : "outline"}
                                                className={currentPage === page ? `${isDarkTheme ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700'} text-white` : borderColor}
                                                disabled={actionLoading}
                                                onClick={() => {
                                                    if (page >= 1 && page <= pagination.totalPages) {
                                                        setPagination(prev => ({ ...prev, page }));
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }
                                                }}
                                            >
                                                {page}
                                            </Button>
                                        );
                                    });
                                })()}
                                
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        if (pagination.page < pagination.totalPages) {
                                            setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                    }}
                                    disabled={!pagination.hasNext || actionLoading || pagination.page >= pagination.totalPages}
                                    className={borderColor}
                                >
                                    Следующая
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Role Dialog */}
            <Dialog 
                open={showRoleDialog}
                onOpenChange={(open) => {
                    console.log('[UsersManagement] Dialog onOpenChange вызван, open:', open, 'showRoleDialog:', showRoleDialog, 'isOpeningRef:', isOpeningRef.current);
                    // Предотвращаем закрытие, если диалог только что открылся
                    if (!open && isOpeningRef.current) {
                        console.log('[UsersManagement] Предотвращено закрытие диалога (только что открылся)');
                        return;
                    }
                    if (!open) {
                        console.log('[UsersManagement] Закрытие диалога');
                        setShowRoleDialog(false);
                        setSelectedUser(null);
                        setNewRole('');
                    }
                }}
            >
                <DialogContent 
                    className={`${isDarkTheme ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white text-stone-900'}`} 
                    style={{ zIndex: 100 }}
                >
                    <DialogHeader>
                        <DialogTitle className={textColor}>Изменить роль пользователя</DialogTitle>
                        <DialogDescription className={textMuted}>
                            Выберите новую роль для {selectedUser?.username}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Select value={newRole} onValueChange={setNewRole}>
                            <SelectTrigger className={inputBg}>
                                <SelectValue placeholder="Выберите роль" />
                            </SelectTrigger>
                            <SelectContent className={isDarkTheme ? 'bg-neutral-800 border-neutral-700' : ''}>
                                <SelectItem value="USER">USER</SelectItem>
                                <SelectItem value="MODERATOR">MODERATOR</SelectItem>
                                <SelectItem value="ADMIN">ADMIN</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowRoleDialog(false)}
                            className={borderColor}
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={handleChangeRole}
                            disabled={!newRole || actionLoading === selectedUser?.id}
                            className={buttonBg}
                        >
                            {actionLoading === selectedUser?.id ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Сохранение...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Сохранить
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

