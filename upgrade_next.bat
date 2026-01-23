@echo off
echo --- Upgrading Next.js and React to Latest ---
npm install next@latest react@latest react-dom@latest --no-interactive --no-fund --no-audit

echo --- Done! Please restart your dev server. ---
pause
