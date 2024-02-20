@echo off
setlocal

:: Check if running as administrator
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"

:: If not running as administrator, restart with admin privileges
if "%errorlevel%" NEQ "0" (
    echo Running as administrator...
    echo.
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

:: Run the JavaScript file
echo Launching WindowsBotnetIpBlocker.js...
echo.
node "%~dp0WindowsBotnetIpBlocker.js"
pause