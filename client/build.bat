@echo off
setlocal enabledelayedexpansion

echo Building Team Monitor Installer
echo =============================

REM Install required packages
echo Installing required packages...
pip install pyinstaller pywin32 pystray pillow psutil pynput requests

REM Clean previous builds
echo Cleaning previous builds...
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist
del /f /q *.spec 2>nul

REM Build the executable
echo Building executable...
pyinstaller --clean ^
    --onefile ^
    --noconsole ^
    --icon=icon.ico ^
    --add-data "icon.ico;." ^
    --hidden-import win32api ^
    --hidden-import win32gui ^
    --hidden-import win32process ^
    --hidden-import psutil ^
    --hidden-import pystray ^
    --hidden-import PIL ^
    --hidden-import pynput ^
    --hidden-import requests ^
    --hidden-import tkinter ^
    --hidden-import json ^
    --hidden-import threading ^
    --hidden-import datetime ^
    --hidden-import os ^
    --hidden-import sys ^
    --hidden-import time ^
    --hidden-import winreg ^
    --uac-admin ^
    --name TeamMonitor ^
    team_monitor.py

if %errorLevel% neq 0 (
    echo Build failed
    pause
    exit /b 1
)

REM Create installer package
echo Creating installer package...
if exist dist\TeamActivityMonitor.zip del /f /q dist\TeamActivityMonitor.zip
powershell -Command "Compress-Archive -Path 'dist\TeamMonitor.exe', 'icon.ico' -DestinationPath 'dist\TeamActivityMonitor.zip' -Force"

if %errorLevel% neq 0 (
    echo Failed to create installer package
    pause
    exit /b 1
)

echo.
echo Build completed successfully!
echo The installer package is available at: dist\TeamActivityMonitor.zip
echo.
pause 