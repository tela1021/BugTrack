#!/usr/bin/env bash

# Deploy the current branch to a prepared Linux server.
# Prerequisites: Node.js, npm, PM2, and a configured .env file.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-master}"
APP_PORT="${APP_PORT:-3008}"
PM2_APP_NAME="${PM2_APP_NAME:-bugtrack}"

cd "$SCRIPT_DIR"

for command in git npm npx pm2; do
  if ! command -v "$command" >/dev/null 2>&1; then
    echo "Missing required command: $command" >&2
    exit 1
  fi
done

if [[ ! -f .env ]]; then
  echo "Missing .env. Create it with DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, and AUTH_TRUST_HOST." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Deployment stopped: the working tree has uncommitted changes." >&2
  exit 1
fi

echo "Updating $DEPLOY_BRANCH..."
git fetch origin "$DEPLOY_BRANCH"
git pull --ff-only origin "$DEPLOY_BRANCH"

echo "Installing dependencies..."
npm ci

echo "Preparing database client and schema..."
npx prisma generate
npx prisma migrate deploy

echo "Building application..."
npm run build

echo "Starting $PM2_APP_NAME on port $APP_PORT..."
if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
  PORT="$APP_PORT" pm2 reload "$PM2_APP_NAME" --update-env
else
  PORT="$APP_PORT" pm2 start npm --name "$PM2_APP_NAME" -- start
fi

pm2 save
echo "Deployment complete."
