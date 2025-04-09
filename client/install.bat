@echo off
setlocal enabledelayedexpansion

echo Team Monitor Installation
echo =======================

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running as administrator
) else (
    echo Please run this script as administrator
    pause
    exit /b 1
)

REM Build the executable
echo Building executable...
pyinstaller --clean team_monitor.spec
if %errorLevel% neq 0 (
    echo Failed to build executable
    pause
    exit /b 1
)

REM Install the service
echo Installing service...
python install_service.py install
if %errorLevel% neq 0 (
    echo Failed to install service
    pause
    exit /b 1
)

REM Start the service
echo Starting service...
python install_service.py start
if %errorLevel% neq 0 (
    echo Failed to start service
    pause
    exit /b 1
)

echo Installation completed successfully!
pause 