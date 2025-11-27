-- Скрипт для проверки и создания администратора
-- Использование: psql -U postgres -d ad_hub -f check_and_create_admin.sql

-- 1. Проверяем существование ролей
SELECT 'Проверка ролей:' as info;
SELECT id, name FROM user_roles ORDER BY id;

-- 2. Проверяем пользователей с ролью ADMIN
SELECT 'Пользователи с ролью ADMIN:' as info;
SELECT u.id, u.email, u.username, ur.name as role_name
FROM users u
JOIN user_roles ur ON u.role_id = ur.id
WHERE ur.name = 'ADMIN';

-- 3. Если нужно создать администратора вручную:
-- Сначала создайте пользователя (замените значения на свои):
-- INSERT INTO users (username, email, password_hash, role_id, status, created_at, updated_at)
-- VALUES (
--     'admin',
--     'admin@example.com',
--     '$2a$10$...', -- Хэш пароля (используйте PasswordEncoder для генерации)
--     (SELECT id FROM user_roles WHERE name = 'ADMIN'),
--     'ACTIVE',
--     NOW(),
--     NOW()
-- );

-- 4. Или обновите существующего пользователя на роль ADMIN:
-- UPDATE users 
-- SET role_id = (SELECT id FROM user_roles WHERE name = 'ADMIN')
-- WHERE email = 'your-admin-email@example.com';

