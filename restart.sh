#!/bin/bash

# restart.sh
# Script to update and restart the MDBugTracker application

echo ">>> 1. Pulling latest changes..."
git pull

echo ">>> 2. Installing dependencies..."
npm install

echo ">>> 3. Generating Prisma Client..."
npx prisma generate

echo ">>> 4. Deploying DB migrations (safe)..."
npx prisma migrate deploy

echo ">>> 5. Building the application..."
npm run build

echo ">>> 6. Restarting PM2 process..."
# Assumes the process is named 'mdbugtracker' as per setup_server.sh
pm2 restart mdbugtracker || pm2 start npm --name "mdbugtracker" -- start

echo ">>> Upgrade Complete!"
