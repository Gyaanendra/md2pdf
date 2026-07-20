#!/usr/bin/env bash

# Exit immediately if a command fails
set -e

REPO_URL="https://github.com/Gyaanendra/md2pdf.git"
APP_DIR="${DEPLOY_DIR:-/opt/md2pdf}"

echo "================================================="
echo "🚀 Starting Deployment of md2pdf v2.0 on VPS"
echo "================================================="

# Create directory if it doesn't exist
if [ ! -d "$APP_DIR" ]; then
    echo "📁 Cloning repository from $REPO_URL to $APP_DIR..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
else
    echo "🔄 Pulling latest changes from main branch..."
    cd "$APP_DIR"
    git fetch origin main
    git reset --hard origin/main
fi

echo "🐳 Building Docker image & starting container..."
docker compose down || true
docker compose build --no-cache
docker compose up -d

echo "🧹 Cleaning unused Docker build artifacts..."
docker image prune -f

echo "================================================="
echo "✅ Deployment Complete! md2pdf is running on port 3000"
echo "🌐 Healthcheck: http://localhost:3000"
echo "================================================="
