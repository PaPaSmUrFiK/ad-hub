# Проверка и создание MinIO buckets вручную

Если вы получаете ошибку "The specified bucket does not exist", выполните следующие шаги:

## 1. Проверьте, что MinIO запущен

```bash
# Проверьте статус контейнера
docker-compose ps

# Проверьте логи
docker-compose logs minio

# Проверьте доступность MinIO API
curl http://localhost:9000/minio/health/live
```

## 2. Проверьте существующие buckets через MinIO Console

1. Откройте браузер: `http://localhost:9001`
2. Войдите с учетными данными:
   - Username: `minioadmin`
   - Password: `minioadmin123`
3. Проверьте, какие buckets существуют

## 3. Создайте buckets вручную через MinIO Console

1. Войдите в MinIO Console: `http://localhost:9001`
2. Нажмите "Create Bucket"
3. Создайте два bucket:
   - `adhub-avatars` - для аватаров пользователей
   - `adhub-ads-media` - для медиафайлов объявлений

## 4. Или создайте через Docker команды

```bash
# Войдите в контейнер MinIO
docker exec -it adhub-minio sh

# Установите mc (MinIO Client) если его нет
# Или используйте API напрямую
```

## 5. Проверьте настройки в application.properties

Убедитесь, что в `application.properties` указаны правильные имена buckets:

```properties
minio.bucket.avatars=adhub-avatars
minio.bucket.ads-media=adhub-ads-media
```

## 6. Перезапустите приложение

После создания buckets перезапустите Backend приложение:

```bash
# Остановите приложение
# Запустите снова
```

## 7. Проверьте логи приложения

После перезапуска проверьте логи - должны быть сообщения:

```
Инициализация MinIO bucket для аватаров: adhub-avatars
✓ Bucket 'adhub-avatars' успешно создан/проверен
Инициализация MinIO bucket для медиа объявлений: adhub-ads-media
✓ Bucket 'adhub-ads-media' успешно создан/проверен
```

