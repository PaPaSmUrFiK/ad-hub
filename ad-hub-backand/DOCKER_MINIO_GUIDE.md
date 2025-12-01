# Руководство по работе с Docker контейнером MinIO

## 📋 Содержание
1. [Запуск MinIO](#запуск-minio)
2. [Остановка MinIO](#остановка-minio)
3. [Проверка состояния](#проверка-состояния)
4. [Перезапуск](#перезапуск)
5. [Управление данными](#управление-данными)
6. [Решение проблем](#решение-проблем)

---

## 🚀 Запуск MinIO

### Первый запуск (создание контейнера)

```bash
# Перейдите в директорию с docker-compose.yml
cd ad-hub-backand

# Запустите контейнер в фоновом режиме
docker-compose up -d
```

**Что происходит:**
- Создается volume `minio_data` для сохранения данных
- Запускается контейнер `adhub-minio`
- MinIO доступен на `http://localhost:9000` (API)
- MinIO Console доступна на `http://localhost:9001` (Web UI)

### Запуск с выводом логов (для отладки)

```bash
# Запуск с выводом логов в консоль
docker-compose up
```

**Для остановки:** нажмите `Ctrl+C`

---

## 🛑 Остановка MinIO

### Корректная остановка (рекомендуется)

```bash
# Остановка контейнера с сохранением данных
docker-compose stop
```

**Что происходит:**
- Контейнер останавливается корректно
- Все данные сохраняются в volume `minio_data`
- При следующем запуске данные будут доступны

### Остановка и удаление контейнера (данные сохраняются)

```bash
# Остановка и удаление контейнера, но volume остается
docker-compose down
```

**Важно:** Данные в volume `minio_data` сохраняются!

### Полное удаление (включая данные)

```bash
# ⚠️ ВНИМАНИЕ: Это удалит все данные!
docker-compose down -v
```

**Используйте только если нужно полностью очистить данные!**

---

## 📊 Проверка состояния

### Проверка статуса контейнера

```bash
# Проверка статуса
docker-compose ps

# Или через docker
docker ps -a | grep minio
```

**Ожидаемый вывод:**
```
NAME          IMAGE             STATUS
adhub-minio   minio/minio:latest Up X minutes
```

### Проверка логов

```bash
# Просмотр логов
docker-compose logs minio

# Просмотр логов в реальном времени
docker-compose logs -f minio

# Последние 50 строк логов
docker-compose logs --tail=50 minio
```

### Проверка health check

```bash
# Проверка здоровья контейнера
docker inspect adhub-minio | grep -A 10 Health
```

### Проверка доступности MinIO

```bash
# Проверка API (должен вернуть 200 OK)
curl http://localhost:9000/minio/health/live

# Или откройте в браузере
# http://localhost:9001 - MinIO Console
```

---

## 🔄 Перезапуск

### Мягкий перезапуск (рекомендуется)

```bash
# Остановка и запуск
docker-compose restart
```

### Полный перезапуск

```bash
# Остановка, удаление и создание заново
docker-compose down
docker-compose up -d
```

**Данные сохраняются в volume!**

---

## 💾 Управление данными

### Просмотр volumes

```bash
# Список всех volumes
docker volume ls

# Информация о volume minio_data
docker volume inspect minio_data
```

### Резервное копирование данных

```bash
# Создание резервной копии volume
docker run --rm -v minio_data:/data -v $(pwd):/backup alpine tar czf /backup/minio_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
```

### Восстановление из резервной копии

```bash
# Остановите контейнер
docker-compose down

# Восстановите данные
docker run --rm -v minio_data:/data -v $(pwd):/backup alpine tar xzf /backup/minio_backup_YYYYMMDD_HHMMSS.tar.gz -C /data

# Запустите контейнер
docker-compose up -d
```

### Очистка данных (без удаления volume)

```bash
# Остановите контейнер
docker-compose down

# Удалите все файлы из volume (Windows PowerShell)
docker run --rm -v minio_data:/data alpine sh -c "rm -rf /data/*"

# Или через docker volume
docker volume rm minio_data
docker volume create minio_data
```

---

## 🔧 Решение проблем

### Контейнер не запускается

```bash
# Проверьте логи
docker-compose logs minio

# Проверьте, не заняты ли порты
netstat -ano | findstr :9000
netstat -ano | findstr :9001

# Если порты заняты, измените их в docker-compose.yml
```

### Контейнер постоянно перезапускается

```bash
# Проверьте логи
docker-compose logs minio

# Проверьте health check
docker inspect adhub-minio | grep -A 10 Health

# Попробуйте пересоздать контейнер
docker-compose down
docker-compose up -d
```

### Данные не сохраняются

```bash
# Проверьте, что volume создан
docker volume ls | grep minio_data

# Проверьте содержимое volume
docker run --rm -v minio_data:/data alpine ls -la /data

# Если volume пуст, проверьте права доступа
```

### MinIO недоступен после перезапуска

```bash
# Проверьте, что контейнер запущен
docker-compose ps

# Проверьте логи на ошибки
docker-compose logs minio

# Проверьте настройки в application.properties
# minio.url должен быть http://localhost:9000
```

### Ошибка подключения к MinIO из приложения

```bash
# Убедитесь, что контейнер запущен
docker-compose ps

# Проверьте доступность из контейнера (если приложение в Docker)
docker exec -it adhub-minio wget -O- http://localhost:9000/minio/health/live

# Проверьте настройки в application.properties:
# minio.url=http://localhost:9000
# minio.access-key=minioadmin
# minio.secret-key=minioadmin123
```

### Ошибка "The specified bucket does not exist"

Эта ошибка означает, что buckets не были созданы. Решение:

**1. Проверьте, что MinIO запущен:**
```bash
docker-compose ps
docker-compose logs minio
```

**2. Проверьте логи приложения при старте:**
Должны быть сообщения:
```
Инициализация MinIO bucket для аватаров: adhub-avatars
✓ Bucket 'adhub-avatars' успешно создан/проверен
Инициализация MinIO bucket для медиа объявлений: adhub-ads-media
✓ Bucket 'adhub-ads-media' успешно создан/проверен
```

**3. Создайте buckets вручную через MinIO Console:**
- Откройте `http://localhost:9001`
- Войдите (minioadmin / minioadmin123)
- Создайте два bucket:
  - `adhub-avatars`
  - `adhub-ads-media`

**4. Или перезапустите приложение:**
Приложение автоматически создаст buckets при старте (с 3 попытками):
```bash
# Остановите приложение
# Запустите снова
# Проверьте логи - должны быть сообщения об успешном создании buckets
```

**5. Проверьте настройки в application.properties:**
```properties
minio.bucket.avatars=adhub-avatars
minio.bucket.ads-media=adhub-ads-media
```

**6. Если проблема сохраняется:**
- Убедитесь, что MinIO доступен по адресу из `minio.url`
- Проверьте учетные данные (`minio.access-key` и `minio.secret-key`)
- Проверьте логи приложения на наличие ошибок подключения к MinIO

---

## 📝 Полезные команды

### Просмотр использования ресурсов

```bash
# Использование ресурсов контейнером
docker stats adhub-minio
```

### Вход в контейнер

```bash
# Вход в контейнер MinIO
docker exec -it adhub-minio sh
```

### Проверка конфигурации

```bash
# Просмотр конфигурации docker-compose
docker-compose config
```

### Обновление образа MinIO

```bash
# Остановите контейнер
docker-compose down

# Обновите образ
docker-compose pull

# Запустите с новым образом
docker-compose up -d
```

---

## ⚙️ Настройка переменных окружения

Вы можете настроить MinIO через переменные окружения или файл `.env`:

```bash
# Создайте файл .env в директории ad-hub-backand
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
```

Или установите переменные в системе перед запуском:

```bash
# Windows PowerShell
$env:MINIO_ROOT_USER="minioadmin"
$env:MINIO_ROOT_PASSWORD="minioadmin123"
docker-compose up -d

# Windows CMD
set MINIO_ROOT_USER=minioadmin
set MINIO_ROOT_PASSWORD=minioadmin123
docker-compose up -d
```

---

## 🔐 Доступ к MinIO Console

После запуска контейнера:

1. Откройте браузер: `http://localhost:9001`
2. Войдите с учетными данными:
   - **Username:** `minioadmin` (или значение из `MINIO_ROOT_USER`)
   - **Password:** `minioadmin123` (или значение из `MINIO_ROOT_PASSWORD`)

В консоли вы можете:
- Просматривать buckets (`adhub-avatars` и `adhub-ads-media`)
- Загружать/скачивать файлы
- Настраивать политики доступа
- Просматривать статистику

---

## ✅ Чек-лист для корректной работы

- [ ] Docker установлен и запущен
- [ ] Порты 9000 и 9001 свободны
- [ ] Контейнер запущен: `docker-compose ps`
- [ ] MinIO доступен: `http://localhost:9000/minio/health/live`
- [ ] MinIO Console доступна: `http://localhost:9001`
- [ ] В `application.properties` указаны правильные настройки MinIO
- [ ] Backend приложение может подключиться к MinIO
- [ ] Buckets создаются автоматически при первом запуске приложения

---

## 🎯 Рекомендуемый порядок запуска проекта

1. **Запустите MinIO:**
   ```bash
   cd ad-hub-backand
   docker-compose up -d
   ```

2. **Проверьте, что MinIO запущен:**
   ```bash
   docker-compose ps
   ```

3. **Запустите Backend приложение:**
   - MinIO должен быть запущен до старта приложения
   - Приложение автоматически создаст buckets при первом запуске

4. **Запустите Frontend приложение:**
   - Frontend работает независимо от MinIO

---

## 🚨 Важные замечания

1. **Всегда используйте `docker-compose stop` или `docker-compose down`** для корректной остановки
2. **Не используйте `docker kill`** - это может повредить данные
3. **Volume `minio_data` сохраняет все данные** - не удаляйте его без необходимости
4. **MinIO должен быть запущен до старта Backend** - иначе приложение не сможет подключиться
5. **При изменении портов в docker-compose.yml** обновите `application.properties`

---

## 📞 Дополнительная информация

- [Официальная документация MinIO](https://min.io/docs/)
- [Docker Compose документация](https://docs.docker.com/compose/)
- [MinIO Docker образ](https://hub.docker.com/r/minio/minio)

