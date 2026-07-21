@echo off
echo --- Applying tracked database migrations ---
npx prisma migrate deploy
npx prisma generate

echo --- Done! Please restart your dev server (npm run dev) ---
pause
