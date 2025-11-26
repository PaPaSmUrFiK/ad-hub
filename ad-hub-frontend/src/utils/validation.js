/**
 * Утилиты для валидации форм
 */

/**
 * Валидация email
 */
export function validateEmail(email) {
    if (!email || !email.trim()) {
        return 'Email обязателен';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return 'Некорректный формат email';
    }
    
    return null;
}

/**
 * Валидация пароля
 */
export function validatePassword(password, minLength = 6) {
    if (!password) {
        return 'Пароль обязателен';
    }
    
    if (password.length < minLength) {
        return `Пароль должен содержать минимум ${minLength} символов`;
    }
    
    // Проверка на наличие хотя бы одной буквы и цифры
    const hasLetter = /[a-zA-Zа-яА-Я]/.test(password);
    const hasDigit = /\d/.test(password);
    
    if (!hasLetter && !hasDigit) {
        return 'Пароль должен содержать буквы или цифры';
    }
    
    return null;
}

/**
 * Валидация телефона (формат +375 (XX) XXX-XX-XX)
 */
export function validatePhone(phone, required = false) {
    if (!phone || phone.trim() === '') {
        if (required) {
            return 'Телефон обязателен';
        }
        return null; // Телефон необязателен
    }
    
    const phoneRegex = /^\+375 \(\d{2}\) \d{3}-\d{2}-\d{2}$/;
    if (!phoneRegex.test(phone.trim())) {
        return 'Неверный формат телефона. Используйте формат: +375 (XX) XXX-XX-XX';
    }
    
    return null;
}

/**
 * Валидация имени пользователя
 */
export function validateUsername(username, minLength = 3, maxLength = 30) {
    if (!username || !username.trim()) {
        return 'Имя пользователя обязательно';
    }
    
    const trimmed = username.trim();
    
    if (trimmed.length < minLength) {
        return `Имя пользователя должно быть не менее ${minLength} символов`;
    }
    
    if (trimmed.length > maxLength) {
        return `Имя пользователя должно быть не более ${maxLength} символов`;
    }
    
    // Только буквы, цифры, подчеркивания и дефисы
    const usernameRegex = /^[a-zA-Zа-яА-Я0-9_-]+$/;
    if (!usernameRegex.test(trimmed)) {
        return 'Имя пользователя может содержать только буквы, цифры, подчеркивания и дефисы';
    }
    
    return null;
}

/**
 * Валидация имени (firstName/lastName)
 */
export function validateName(name, fieldName = 'Имя', minLength = 2, maxLength = 50) {
    if (!name || !name.trim()) {
        return `${fieldName} обязательно`;
    }
    
    const trimmed = name.trim();
    
    if (trimmed.length < minLength) {
        return `${fieldName} должно быть не менее ${minLength} символов`;
    }
    
    if (trimmed.length > maxLength) {
        return `${fieldName} должно быть не более ${maxLength} символов`;
    }
    
    // Только буквы, пробелы, дефисы и апострофы
    const nameRegex = /^[a-zA-Zа-яА-Я\s'-]+$/;
    if (!nameRegex.test(trimmed)) {
        return `${fieldName} может содержать только буквы, пробелы, дефисы и апострофы`;
    }
    
    return null;
}

/**
 * Валидация названия объявления
 */
export function validateAdTitle(title, minLength = 5, maxLength = 200) {
    if (!title || !title.trim()) {
        return 'Название объявления обязательно';
    }
    
    const trimmed = title.trim();
    
    if (trimmed.length < minLength) {
        return `Название должно быть не менее ${minLength} символов`;
    }
    
    if (trimmed.length > maxLength) {
        return `Название должно быть не более ${maxLength} символов`;
    }
    
    return null;
}

/**
 * Валидация описания объявления
 */
export function validateAdDescription(description, minLength = 10, maxLength = 5000) {
    if (!description || !description.trim()) {
        return 'Описание объявления обязательно';
    }
    
    const trimmed = description.trim();
    
    if (trimmed.length < minLength) {
        return `Описание должно быть не менее ${minLength} символов`;
    }
    
    if (trimmed.length > maxLength) {
        return `Описание должно быть не более ${maxLength} символов`;
    }
    
    return null;
}

/**
 * Валидация цены
 */
export function validatePrice(price, min = 0, max = 999999999) {
    if (!price || price.toString().trim() === '') {
        return 'Цена обязательна';
    }
    
    const numPrice = parseFloat(price);
    
    if (isNaN(numPrice)) {
        return 'Цена должна быть числом';
    }
    
    if (numPrice < min) {
        return `Цена должна быть не менее ${min}`;
    }
    
    if (numPrice > max) {
        return `Цена должна быть не более ${max}`;
    }
    
    return null;
}

/**
 * Валидация местоположения
 */
export function validateLocation(location, minLength = 2, maxLength = 100) {
    if (!location || !location.trim()) {
        return 'Местоположение обязательно';
    }
    
    const trimmed = location.trim();
    
    if (trimmed.length < minLength) {
        return `Местоположение должно быть не менее ${minLength} символов`;
    }
    
    if (trimmed.length > maxLength) {
        return `Местоположение должно быть не более ${maxLength} символов`;
    }
    
    return null;
}

/**
 * Проверка совпадения паролей
 */
export function validatePasswordMatch(password, confirmPassword) {
    if (!confirmPassword) {
        return 'Подтверждение пароля обязательно';
    }
    
    if (password !== confirmPassword) {
        return 'Пароли не совпадают';
    }
    
    return null;
}

