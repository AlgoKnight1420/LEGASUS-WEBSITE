@echo off
setlocal
cd /d "%~dp0.."
echo Closing stale dev servers on ports 4000 and 5173...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports=@(4000,5173); foreach($port in $ports){ try { Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } } catch {} }"
timeout /t 1 /nobreak >nul
echo Starting Legasus frontend and backend...
echo Frontend: http://localhost:5173/
echo Backend:  http://localhost:4000/api/health
echo.
start "Legasus Backend" /b cmd /c "cd /d ""%~dp0.."" && npm run server:dev"
npm run dev
