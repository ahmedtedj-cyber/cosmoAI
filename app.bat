@echo off

cd /d %~dp0

echo ===================================
echo     Lancement CosmoAI
echo ===================================

echo.
echo [1/2] Lancement backend...
start "" cmd /c "cd /d %~dp0backend && venv\Scripts\python.exe -m uvicorn api:app --host 127.0.0.1 --port 8000 & pause"

timeout /t 3 > nul

echo [2/2] Lancement frontend...
start "" cmd /c "cd /d %~dp0frontend && npm run dev & pause"

timeout /t 5 > nul

echo.
echo Ouverture du navigateur...
start http://localhost:5173

echo.
echo ===================================
echo  CosmoAI est en cours d'execution
echo  Backend  : http://127.0.0.1:8000
echo  Frontend : http://localhost:5173
echo ===================================
echo.
echo  Appuyez sur une touche pour
echo  ARRETER toute l'application...
echo ===================================
pause > nul

echo.
echo Arret en cours...

taskkill /F /IM python.exe > nul 2>&1
taskkill /F /IM node.exe > nul 2>&1
taskkill /F /IM uvicorn.exe > nul 2>&1

echo ✅ Backend arrete.
echo ✅ Frontend arrete.
echo.
echo CosmoAI est completement arrete.
timeout /t 2 > nul