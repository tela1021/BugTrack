@echo off
echo ^>^>^> 1. Pulling latest changes...
git pull

echo ^>^>^> 2. Installing dependencies...
call npm install

echo ^>^>^> 3. Generating Prisma Client...
call npx prisma generate

echo ^>^>^> 4. Deploying DB migrations (safe)...
call npx prisma migrate deploy

echo ^>^>^> 5. Building the application...
call npm run build

echo ^>^>^> 6. Restarting PM2 process...
call pm2 restart mdbugtracker || call pm2 start npm --name "mdbugtracker" -- start

echo ^>^>^> Upgrade Complete!
pause
