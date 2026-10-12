@echo off
title NEXO E-Commerce Platform Server
color 0E

echo ==============================================================================
echo                      NEXO E-COMMERCE PLATFORM
echo                     Full Stack Live Development
echo ==============================================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from https://nodejs.org/ (version 18 or higher)
    pause
    exit /b 1
)

:: Install dependencies if node_modules is missing
if not exist "node_modules\" (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm install --legacy-peer-deps
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
)

echo.
echo [INFO] Starting NEXO Dev Server on http://localhost:3000 ...
echo [INFO] Customer Portal: http://localhost:3000
echo [INFO] Admin Portal: http://localhost:3000/?admin=true (or right-click bottom-right avatar)
echo.

start http://localhost:3000

call npm run dev
pause
