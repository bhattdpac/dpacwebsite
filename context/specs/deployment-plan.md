# Deployment Spec: VPS Setup for deepakbhatt.dev

## Goal
Deploy the full framework (Frontend & Backend) to the VPS at `92.249.46.152` and serve it under `deepakbhatt.dev` with Nginx and SSL.

## Prerequisites
- VPS IP: `92.249.46.152`
- OS: Assuming Ubuntu/Debian (Standard for VPS).
- SSH access to the VPS.

## Implementation Steps

### 1. Initial VPS Preparation
Connect via SSH: `ssh root@92.249.46.152`
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y nginx git python3-pip python3-venv nodejs npm
```

### 2. Backend Deployment (Django)
```bash
mkdir -p /var/www/deepakbhatt.dev/backend
# Upload/Git clone code here
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt gunicorn
# Run migrations and collect static files
python manage.py migrate
python manage.py collectstatic
```

### 3. Frontend Deployment (React)
```bash
mkdir -p /var/www/deepakbhatt.dev/frontend
# On local machine:
cd frontend
npm run build
# Upload the 'dist' folder to the VPS
```

### 4. Nginx Configuration
Create `/etc/nginx/sites-available/deepakbhatt.dev`:
```nginx
server {
    listen 80;
    server_name deepakbhatt.dev www.deepakbhatt.dev;

    location / {
        root /var/www/deepakbhatt.dev/frontend/dist;
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /media/ {
        alias /var/www/deepakbhatt.dev/backend/media/;
    }
}
```

### 5. SSL with Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d deepakbhatt.dev -d www.deepakbhatt.dev
```

### 6. Process Management (PM2/Systemd)
Use Gunicorn with Systemd for the backend and Nginx for the frontend.

## Verification Checklist
- [ ] `https://deepakbhatt.dev` loads the frontend.
- [ ] `https://deepakbhatt.dev/api/health/` returns a healthy status.
- [ ] Media files are accessible.
- [ ] SSL certificate is valid.
