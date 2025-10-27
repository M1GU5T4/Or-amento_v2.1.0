@echo off
title Sistema de Gestao - Inicializador

echo ========================================
echo    SISTEMA DE GESTAO EMPRESARIAL
echo ========================================
echo.
echo Escolha uma opcao:
echo.
echo [1] Iniciar Backend (API)
echo [2] Iniciar Frontend (Interface)
echo [3] Iniciar Ambos (Recomendado)
echo [4] Parar Docker
echo [5] Ver Status
echo [0] Sair
echo.
set /p choice="Digite sua opcao: "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto frontend
if "%choice%"=="3" goto both
if "%choice%"=="4" goto stop
if "%choice%"=="5" goto status
if "%choice%"=="0" goto exit
goto start

:backend
echo Iniciando Backend...
cd backend
start "Backend API" cmd /k "npm run dev"
goto menu

:frontend
echo Iniciando Frontend...
start "Frontend React" cmd /k "npm run dev"
goto menu

:both
echo Iniciando Backend...
cd backend
start "Backend API" cmd /k "npm run dev"
cd ..
timeout /t 3 /nobreak >nul
echo Iniciando Frontend...
start "Frontend React" cmd /k "npm run dev"
goto menu

:stop
echo Parando Docker...
cd backend
docker-compose down
echo Docker parado!
goto menu

:status
echo Verificando status...
echo.
echo Backend (porta 3001):
curl -s http://localhost:3001/health 2>nul || echo ❌ Offline
echo.
echo Frontend (porta 5173):
curl -s http://localhost:5173 2>nul || echo ❌ Offline
echo.
goto menu

:menu
echo.
echo Pressione qualquer tecla para voltar ao menu...
pause >nul
cls
goto start

:exit
echo Saindo...
exit