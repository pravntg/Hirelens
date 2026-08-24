@echo off
echo ===================================================
echo   Starting Smart Resume Screener & ATS Dashboard
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching Backend API Server (Port 5000)...
start "SmartResume Backend API" cmd /k "npm run dev:backend"

timeout /t 3 /nobreak >nul

echo [2/2] Launching Frontend Dashboard (Port 3000)...
start "SmartResume Frontend UI" cmd /k "npm run dev:frontend"

timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:3000 ...
start http://localhost:3000

echo.
echo Application is running! Keep the backend and frontend terminal windows open.
echo Press any key to exit this launcher window.
pause >nul
