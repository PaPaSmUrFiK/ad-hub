import { useState, useEffect } from 'react';
import { adminAPI } from '../api/admin';
import { Plus, Edit, Trash2, Loader2, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';

export function CategoriesManagement({ isDarkTheme }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [actionLoading, setActionLoading] = useState(false);

    const bgColor = isDarkTheme ? 'bg-neutral-950' : 'bg-stone-100';
    const cardBg = isDarkTheme ? 'bg-neutral-900' : 'bg-white';
    const borderColor = isDarkTheme ? 'border-neutral-800' : 'border-stone-200';
    const textColor = isDarkTheme ? 'text-neutral-100' : 'text-stone-900';
    const textMuted = isDarkTheme ? 'text-neutral-400' : 'text-stone-600';
    const inputBg = isDarkTheme ? 'bg-neutral-800 border-neutral-700 text-neutral-100' : 'bg-white border-stone-300';
    const buttonBg = isDarkTheme ? 'bg-orange-600 hover:bg-orange-700' : 'bg-teal-600 hover:bg-teal-700';

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await adminAPI.getCategories();
            setCategories(data || []);
        } catch (err) {
            console.error('Ошибка при загрузке категорий:', err);
            setError(err.message || 'Не удалось загрузить категории');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!formData.name.trim()) {
            setError('Название категории обязательно');
            return;
        }

        try {
            setActionLoading(true);
            setError('');
            await adminAPI.createCategory(formData.name.trim(), formData.description?.trim() || null);
            setShowCreateDialog(false);
            setFormData({ name: '', description: '' });
            await loadCategories();
        } catch (err) {
            const errorMessage = err.message || 'Ошибка при создании категории';
            setError(errorMessage);
            alert(errorMessage);
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = async () => {
        if (!formData.name.trim()) {
            alert('Название категории обязательно');
            return;
        }

        try {
            setActionLoading(true);
            await adminAPI.updateCategory(selectedCategory.id, formData.name.trim(), formData.description?.trim() || null);
            setShowEditDialog(false);
            setSelectedCategory(null);
            setFormData({ name: '', description: '' });
            await loadCategories();
        } catch (err) {
            alert(err.message || 'Ошибка при обновлении категории');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (categoryId, categoryName) => {
        if (!window.confirm(`Вы уверены, что хотите удалить категорию "${categoryName}"? Это действие нельзя отменить!`)) {
            return;
        }

        try {
            setActionLoading(true);
            await adminAPI.deleteCategory(categoryId);
            await loadCategories();
        } catch (err) {
            alert(err.message || 'Ошибка при удалении категории');
        } finally {
            setActionLoading(false);
        }
    };

    const openEditDialog = (category) => {
        setSelectedCategory(category);
        setFormData({
            name: category.name || '',
            description: category.description || '',
        });
        setShowEditDialog(true);
    };

    const openCreateDialog = () => {
        setFormData({ name: '', description: '' });
        setShowCreateDialog(true);
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className={`${textColor} text-xl font-bold`}>Управление категориями</h2>
                    <p className={textMuted}>Создавайте, редактируйте и удаляйте категории объявлений</p>
                </div>
                <Button onClick={openCreateDialog} className={buttonBg}>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать категорию
                </Button>
            </div>

            {error && (
                <div className={`mb-4 p-3 rounded ${isDarkTheme ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-700'}`}>
                    {error}
                </div>
            )}

            {/* Categories Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <Loader2 className={`h-8 w-8 ${textMuted} mx-auto animate-spin`} />
                    <p className={`${textMuted} mt-2`}>Загрузка категорий...</p>
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-12">
                    <p className={textMuted}>Категории не найдены</p>
                    <Button onClick={openCreateDialog} className={`mt-4 ${buttonBg}`}>
                        <Plus className="h-4 w-4 mr-2" />
                        Создать первую категорию
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                        <div
                            key={category.id}
                            className={`${cardBg} rounded-lg border ${borderColor} p-4 hover:shadow-lg transition-shadow`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className={`${textColor} font-semibold text-lg mb-1`}>{category.name}</h3>
                                    {category.description && (
                                        <p className={`${textMuted} text-sm line-clamp-2`}>{category.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-3 border-t borderColor">
                                <button
                                    onClick={() => openEditDialog(category)}
                                    disabled={actionLoading}
                                    className={`flex-1 px-3 py-2 rounded ${isDarkTheme ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'} transition-colors flex items-center justify-center gap-2`}
                                >
                                    <Edit className="h-4 w-4" />
                                    Редактировать
                                </button>
                                <button
                                    onClick={() => handleDelete(category.id, category.name)}
                                    disabled={actionLoading}
                                    className={`px-3 py-2 rounded ${isDarkTheme ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-600'} transition-colors`}
                                >
                                    {actionLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className={isDarkTheme ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                    <DialogHeader>
                        <DialogTitle className={textColor}>Создать категорию</DialogTitle>
                        <DialogDescription className={textMuted}>
                            Введите название и описание новой категории
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <Label className={textColor}>Название *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Название категории"
                                className={`mt-1 ${inputBg}`}
                            />
                        </div>
                        <div>
                            <Label className={textColor}>Описание</Label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Описание категории (необязательно)"
                                rows={3}
                                className={`mt-1 w-full px-3 py-2 rounded-md border ${inputBg} resize-none`}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowCreateDialog(false)}
                            className={borderColor}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Отмена
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={actionLoading || !formData.name.trim()}
                            className={buttonBg}
                        >
                            {actionLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Создание...
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Создать
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className={isDarkTheme ? 'bg-neutral-900 border-neutral-800' : 'bg-white'}>
                    <DialogHeader>
                        <DialogTitle className={textColor}>Редактировать категорию</DialogTitle>
                        <DialogDescription className={textMuted}>
                            Измените название или описание категории
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <Label className={textColor}>Название *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Название категории"
                                className={`mt-1 ${inputBg}`}
                            />
                        </div>
                        <div>
                            <Label className={textColor}>Описание</Label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Описание категории (необязательно)"
                                rows={3}
                                className={`mt-1 w-full px-3 py-2 rounded-md border ${inputBg} resize-none`}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowEditDialog(false)}
                            className={borderColor}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Отмена
                        </Button>
                        <Button
                            onClick={handleEdit}
                            disabled={actionLoading || !formData.name.trim()}
                            className={buttonBg}
                        >
                            {actionLoading ? (
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

