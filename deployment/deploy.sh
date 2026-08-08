#!/bin/bash

# Deployment script for dpacwebsite
set -e

PROJECT_ROOT="/root/dpacwebsite"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
VENV_PATH="$BACKEND_DIR/venv"

echo "--- Starting Deployment ---"

# 1. Update from Git
echo "Pulling latest changes from git..."
cd $PROJECT_ROOT
git pull origin main

# 2. Update Backend
echo "Updating backend dependencies..."
source $VENV_PATH/bin/activate
pip install -r $BACKEND_DIR/requirements.txt

echo "Running migrations..."
python $BACKEND_DIR/manage.py migrate --noinput

echo "Collecting static files..."
python $BACKEND_DIR/manage.py collectstatic --noinput

# 3. Update Frontend
echo "Building frontend..."
cd $FRONTEND_DIR
npm install
npm run build

# 4. Permissions
echo "Setting permissions..."
chown -R root:www-data $BACKEND_DIR/media
chown -R root:www-data $BACKEND_DIR/static
chmod -R 775 $BACKEND_DIR/media
chmod -R 775 $BACKEND_DIR/static

# 5. Restart Services
echo "Restarting services..."
systemctl restart gunicorn
systemctl restart nginx

echo "--- Deployment Complete ---"
