import { useState } from 'react';
import { Mail, Lock, User, ArrowLeft, AlertCircle, Phone } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { authAPI } from '../api/auth';
import { 
    validateEmail, 
    validatePassword, 
    validatePhone, 
    validateUsername, 
    validateName,
    validatePasswordMatch 
} from '../utils/validation';

export function RegisterPage({ onBack, onLoginClick, onRegister }) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        username: '',
        firstName: '',
        lastName: '',
        phone: '',
    });
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
        setError('');
        // Очищаем ошибку конкретного поля при изменении
        if (fieldErrors[field]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const formatPhone = (value) => {
        // Если пусто, возвращаем пустую строку
        if (!value) return '';
        
        // Удаляем все нецифровые символы
        const digits = value.replace(/\D/g, '');
        
        // Если нет цифр, возвращаем пустую строку
        if (!digits) return '';
        
        // Если начинается с 375, убираем его (код страны)
        let phoneDigits = digits.startsWith('375') ? digits.slice(3) : digits;
        
        // Ограничиваем до 9 цифр (код оператора 2 цифры + номер 7 цифр)
        phoneDigits = phoneDigits.slice(0, 9);
        
        // Форматируем по мере ввода: +375 (XX) XXX-XX-XX
        if (phoneDigits.length === 0) {
            return '';
        } else if (phoneDigits.length <= 2) {
            return `+375 (${phoneDigits}`;
        } else if (phoneDigits.length <= 5) {
            return `+375 (${phoneDigits.slice(0, 2)}) ${phoneDigits.slice(2)}`;
        } else if (phoneDigits.length <= 7) {
            return `+375 (${phoneDigits.slice(0, 2)}) ${phoneDigits.slice(2, 5)}-${phoneDigits.slice(5)}`;
        } else {
            return `+375 (${phoneDigits.slice(0, 2)}) ${phoneDigits.slice(2, 5)}-${phoneDigits.slice(5, 7)}-${phoneDigits.slice(7)}`;
        }
    };

    const handlePhoneChange = (e) => {
        const inputValue = e.target.value;
        // Если пользователь удаляет все, разрешаем пустую строку
        if (inputValue === '') {
            setFormData(prev => ({ ...prev, phone: '' }));
            setError('');
            return;
        }
        
        const formatted = formatPhone(inputValue);
        setFormData(prev => ({ ...prev, phone: formatted }));
        setError('');
    };

    const [fieldErrors, setFieldErrors] = useState({});

    const validateForm = () => {
        const errors = {};
        
        // Валидация email
        const emailError = validateEmail(formData.email);
        if (emailError) errors.email = emailError;
        
        // Валидация пароля
        const passwordError = validatePassword(formData.password);
        if (passwordError) errors.password = passwordError;
        
        // Валидация подтверждения пароля
        const confirmPasswordError = validatePasswordMatch(formData.password, formData.confirmPassword);
        if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
        
        // Валидация имени пользователя
        const usernameError = validateUsername(formData.username);
        if (usernameError) errors.username = usernameError;
        
        // Валидация имени
        const firstNameError = validateName(formData.firstName, 'Имя');
        if (firstNameError) errors.firstName = firstNameError;
        
        // Валидация фамилии
        const lastNameError = validateName(formData.lastName, 'Фамилия');
        if (lastNameError) errors.lastName = lastNameError;
        
        // Валидация телефона (необязателен, но если указан - должен быть корректным)
        const phoneError = validatePhone(formData.phone, false);
        if (phoneError) errors.phone = phoneError;
        
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        // Валидация формы
        if (!validateForm()) {
            const firstError = Object.values(fieldErrors)[0];
            setError(firstError || 'Пожалуйста, исправьте ошибки в форме');
            return;
        }

        if (!acceptedTerms) {
            setError('Необходимо принять условия использования');
            return;
        }

        if (!formData.username || formData.username.length < 3) {
            setError('Имя пользователя должно содержать минимум 3 символа');
            return;
        }

        if (formData.username.length > 50) {
            setError('Имя пользователя не должно превышать 50 символов');
            return;
        }

        // Проверка формата username (только буквы, цифры и подчеркивания)
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(formData.username)) {
            setError('Имя пользователя может содержать только буквы, цифры и подчеркивания');
            return;
        }

        // Валидация формата телефона
        if (!validatePhoneFormat(formData.phone)) {
            setError('Формат телефона: +375 (XX) XXX-XX-XX');
            return;
        }

        // Валидация длины полей
        if (formData.firstName && formData.firstName.length > 50) {
            setError('Имя не должно превышать 50 символов');
            return;
        }

        if (formData.lastName && formData.lastName.length > 50) {
            setError('Фамилия не должна превышать 50 символов');
            return;
        }

        setLoading(true);

        try {
            const registerData = {
                email: formData.email.trim(),
                password: formData.password,
                username: formData.username.trim(),
                firstName: formData.firstName?.trim() || null,
                lastName: formData.lastName?.trim() || null,
                phone: formData.phone?.trim() || null,
            };

            await authAPI.register(registerData);
            if (onRegister) {
                onRegister();
            }
        } catch (err) {
            // Улучшенная обработка ошибок
            let errorMessage = 'Ошибка при регистрации. Попробуйте снова.';
            
            if (err.message) {
                errorMessage = err.message;
                // Обработка ошибок валидации от backend
                if (errorMessage.includes(':')) {
                    // Если ошибка содержит несколько полей, показываем все
                    errorMessage = errorMessage;
                }
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-stone-100 via-teal-50 to-stone-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Back button */}
                {onBack && (
                    <Button
                        variant="ghost"
                        className="mb-4 text-stone-700 hover:text-stone-900"
                        onClick={onBack}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        На главную
                    </Button>
                )}

                {/* Register Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-8 text-center">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                <div className="w-8 h-8 bg-white rounded-lg"></div>
                            </div>
                            <span className="text-white text-2xl font-bold tracking-tight">AdHub</span>
                        </div>
                        <p className="text-teal-50">
                            Создайте новый аккаунт
                        </p>
                    </div>

                    {/* Register Form */}
                    <div className="p-8">
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="register-username">Имя пользователя *</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                                    <Input
                                        id="register-username"
                                        type="text"
                                        placeholder="username"
                                        className={`pl-10 border-stone-300 ${fieldErrors.username ? 'border-red-300' : ''}`}
                                        value={formData.username}
                                        onChange={handleChange('username')}
                                        required
                                        disabled={loading}
                                    />
                                    {fieldErrors.username && (
                                        <p className="text-red-600 text-xs mt-1">{fieldErrors.username}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="register-firstname">Имя</Label>
                                    <Input
                                        id="register-firstname"
                                        type="text"
                                        placeholder="Имя"
                                        className="border-stone-300"
                                        value={formData.firstName}
                                        onChange={handleChange('firstName')}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="register-lastname">Фамилия</Label>
                                    <Input
                                        id="register-lastname"
                                        type="text"
                                        placeholder="Фамилия"
                                        className="border-stone-300"
                                        value={formData.lastName}
                                        onChange={handleChange('lastName')}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="register-email">Email *</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                                    <Input
                                        id="register-email"
                                        type="email"
                                        placeholder="your@email.com"
                                        className="pl-10 border-stone-300"
                                        value={formData.email}
                                        onChange={handleChange('email')}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="register-phone">Телефон</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                                    <Input
                                        id="register-phone"
                                        type="tel"
                                        placeholder="+375 (XX) XXX-XX-XX"
                                        className="pl-10 border-stone-300"
                                        value={formData.phone}
                                        onChange={handlePhoneChange}
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="register-password">Пароль *</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                                    <Input
                                        id="register-password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 border-stone-300"
                                        value={formData.password}
                                        onChange={handleChange('password')}
                                        required
                                        disabled={loading}
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="register-confirm-password">Подтвердите пароль *</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                                    <Input
                                        id="register-confirm-password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 border-stone-300"
                                        value={formData.confirmPassword}
                                        onChange={handleChange('confirmPassword')}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="flex items-start space-x-2">
                                <Checkbox 
                                    id="terms" 
                                    checked={acceptedTerms}
                                    onCheckedChange={(checked) => setAcceptedTerms(checked)}
                                />
                                <label htmlFor="terms" className="text-sm text-stone-700 cursor-pointer leading-tight">
                                    Я согласен с{' '}
                                    <a href="#" className="text-teal-600 hover:text-teal-700">
                                        условиями использования
                                    </a>{' '}
                                    и{' '}
                                    <a href="#" className="text-teal-600 hover:text-teal-700">
                                        политикой конфиденциальности
                                    </a>
                                </label>
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                                disabled={loading}
                            >
                                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
                            </Button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-stone-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-white px-4 text-stone-500">Или зарегистрируйтесь через</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" className="border-stone-300">
                                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                                        <path
                                            fill="currentColor"
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        />
                                        <path
                                            fill="currentColor"
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        />
                                    </svg>
                                    Google
                                </Button>
                                <Button variant="outline" className="border-stone-300">
                                    <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    GitHub
                                </Button>
                            </div>

                            {/* Login Link */}
                            <div className="text-center pt-4 border-t border-stone-200 mt-6">
                                <p className="text-stone-600">
                                    Уже есть аккаунт?{' '}
                                    <button
                                        onClick={onLoginClick}
                                        className="text-teal-600 hover:text-teal-700 font-medium"
                                    >
                                        Войти
                                    </button>
                                </p>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Footer Text */}
                <p className="text-center text-stone-600 mt-6">
                    © 2025 AdHub. Все права защищены.
                </p>
            </div>
        </div>
    );
}