@echo off
title MDBugTracker Dev Server
echo ==========================================
echo   Starting MDBugTracker (Dev Mode)
echo ==========================================

REM Check for node_modules and install if missing
if not exist node_modules (
    echo [!] node_modules not found. Installing dependencies...
    call npm install
)

REM Always regenerate Prisma client to ensure it matches the schema
echo [!] Ensuring Database Client is ready...
call npx prisma generate

REM Start the server
echo.
echo [!] Starting Next.js Development Server...
echo [!] Press Ctrl+C to stop.
echo.
call npm run dev

pause
