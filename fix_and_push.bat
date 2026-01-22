@echo off
echo --- Fixing Console Hangs ---
reg add "HKCU\Console" /v QuickEdit /t REG_DWORD /d 0 /f
echo --- Initializing Git ---
git init
git remote add origin https://github.com/tela1021/BugTrack.git
echo --- Committing Changes ---
git add .
git commit -m "Complete UI overhaul and feature implementation"
echo --- Pushing to GitHub ---
git push -u origin main
echo --- Done ---
pause
