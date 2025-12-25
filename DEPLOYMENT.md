# Инструкция по деплою Hostel Admin

## 📋 Требования

- Docker и Docker Compose установлены на сервере
- GitHub репозиторий с настроенным CI/CD
- Docker Hub аккаунт
- SSH доступ к серверу

## 🔐 Настройка GitHub Secrets

Перейдите в Settings → Secrets and variables → Actions вашего GitHub репозитория и добавьте следующие secrets:

### Docker Hub
- `DOCKERHUB_USERNAME` - ваш username в Docker Hub
- `DOCKERHUB_TOKEN` - токен доступа (создайте в Docker Hub → Account Settings → Security)

### Server SSH
- `SSH_HOST` - IP адрес или домен вашего сервера
- `SSH_USERNAME` - имя пользователя для SSH (например, `root` или `ubuntu`)
- `SSH_PRIVATE_KEY` - приватный SSH ключ для доступа к серверу
- `SSH_PORT` - порт SSH (по умолчанию 22, можно не указывать)
- `DEPLOY_PATH` - путь к директории приложения на сервере (по умолчанию `/opt/hostel-admin`)

### Environment Variables
- `NEXT_PUBLIC_API_BASE_URL` - URL вашего backend API (например, `https://hostel53bishkekkg.com/api/v1`)

## 🚀 Первоначальная настройка сервера

### 1. Подключитесь к серверу

```bash
ssh your-user@your-server-ip
```

### 2. Установите Docker и Docker Compose (если не установлены)

```bash
# Обновить пакеты
sudo apt update

# Установить Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавить текущего пользователя в группу docker
sudo usermod -aG docker $USER

# Установить Docker Compose
sudo apt install docker-compose-plugin -y

# Проверить установку
docker --version
docker compose version
```

### 3. Создайте директорию для приложения

```bash
sudo mkdir -p /opt/hostel-admin
sudo chown $USER:$USER /opt/hostel-admin
cd /opt/hostel-admin
```

### 4. Создайте .env.production файл

```bash
nano .env.production
```

Добавьте следующее содержимое:

```env
NEXT_PUBLIC_API_BASE_URL=https://hostel53bishkekkg.com/api/v1
```

Сохраните (Ctrl+O, Enter, Ctrl+X).

### 5. (Опционально) Настройте Nginx reverse proxy

Если вы хотите использовать домен с SSL:

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

Создайте конфигурацию Nginx:

```bash
sudo nano /etc/nginx/sites-available/hostel-admin
```

```nginx
server {
    listen 80;
    server_name admin.hostel53bishkekkg.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Активируйте конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/hostel-admin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Установите SSL сертификат:

```bash
sudo certbot --nginx -d admin.hostel53bishkekkg.com
```

## 🔄 Процесс деплоя

### Автоматический деплой (через GitHub Actions)

1. Сделайте коммит в ветку `main`:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. GitHub Actions автоматически:
   - Запустит линтер
   - Соберет Docker образ
   - Загрузит образ в Docker Hub
   - Подключится к серверу по SSH
   - Обновит контейнер на сервере

3. Следите за процессом в разделе Actions на GitHub

### Ручной деплой (на сервере)

Если нужно обновить вручную:

```bash
cd /opt/hostel-admin

# Подтянуть последний образ
docker pull your-dockerhub-username/hostel-admin:latest

# Пересоздать контейнер
docker-compose down
docker-compose up -d

# Проверить логи
docker-compose logs -f
```

## 🔍 Проверка работы

```bash
# Проверить статус контейнера
docker-compose ps

# Посмотреть логи
docker-compose logs --tail=100 -f

# Проверить, что приложение отвечает
curl http://localhost:3001
```

## 🛠️ Полезные команды

```bash
# Перезапустить контейнер
docker-compose restart

# Остановить контейнер
docker-compose down

# Посмотреть использование ресурсов
docker stats

# Очистить неиспользуемые образы и контейнеры
docker system prune -a

# Войти в контейнер для отладки
docker exec -it hostel-admin sh
```

## 📝 Обновление переменных окружения

Если нужно изменить переменные окружения:

```bash
cd /opt/hostel-admin
nano .env.production
# Внесите изменения
docker-compose down
docker-compose up -d
```

## 🐛 Troubleshooting

### Контейнер не запускается
```bash
docker-compose logs hostel-admin
```

### Проблемы с портами
```bash
# Проверить, какой процесс использует порт 3001
sudo lsof -i :3001
# или
sudo netstat -tulpn | grep 3001
```

### Проблемы с памятью
```bash
# Увеличить swap если нужно
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

## 📊 Мониторинг

Для production окружения рекомендуется настроить:
- Автоматический рестарт контейнеров (уже настроено через `restart: unless-stopped`)
- Логирование в внешнюю систему
- Мониторинг доступности (uptime monitoring)
- Бэкапы данных

## 🔒 Безопасность

- Регулярно обновляйте Docker образы
- Используйте только HTTPS в production
- Настройте firewall (ufw):
  ```bash
  sudo ufw allow 22/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw enable
  ```
- Регулярно обновляйте сервер:
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```
