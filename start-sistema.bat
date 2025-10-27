@echo off
echo ========================================
echo INICIANDO SISTEMA ERP/CRM
echo ========================================

echo.
echo Verificando se o MySQL esta rodando...
netstat -an | findstr :3306 >nul
if %errorlevel% neq 0 (
    echo ERRO: MySQL nao esta rodando!
    echo Por favor, inicie o MySQL no XAMPP Control Panel
    pause
    exit /b 1
)
echo ✓ MySQL rodando

echo.
echo Iniciando Backend...
start "Backend API" cmd /k "cd backend && npm run dev"

echo.
echo Aguardando backend inicializar...
timeout /t 3 /nobreak >nul

echo.
echo Iniciando Frontend...
start "Frontend React" cmd /k "npm run dev"

echo.
echo ========================================
echo SISTEMA INICIADO!
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo phpMyAdmin: http://localhost/phpmyadmin
echo.
echo Pressione qualquer tecla para fechar este terminal...
pause >nul