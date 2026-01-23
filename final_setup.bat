@echo off
echo --- Uninstalling old NextAuth ---
npm uninstall next-auth @next-auth/prisma-adapter

echo --- Installing Auth.js v5 (Beta) ---
npm install next-auth@beta @auth/prisma-adapter bcryptjs @types/bcryptjs --no-interactive --no-fund --no-audit

echo --- Syncing Database ---
npx prisma db push
npx prisma generate

echo --- Done! Please restart your dev server (npm run dev) ---
pause
