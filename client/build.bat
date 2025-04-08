@echo off
echo Cleaning previous builds...
if exist "build" rmdir /s /q "build"
if exist "dist" rmdir /s /q "dist"

echo Installing required packages...
pip install -r requirements.txt
pip install pyinstaller pywin32 pystray pillow pynput requests psutil cx_Freeze

echo Building with cx_Freeze...
python build.py build

echo Creating PyInstaller executables...
pyinstaller --clean team_monitor.spec
pyinstaller --clean team_monitor_service.spec

echo Copying icon to dist folders...
copy icon.ico dist\TeamActivityMonitor
copy icon.ico dist\TeamActivityMonitorService

echo Build complete!
echo The executables are in the dist folders:
echo - dist\TeamActivityMonitor\TeamActivityMonitor.exe (main application)
echo - dist\TeamActivityMonitorService\TeamActivityMonitorService.exe (Windows service)
echo - build\exe.win-amd64-3.x\TeamActivityMonitor.exe (cx_Freeze build)
echo - build\exe.win-amd64-3.x\TeamActivityMonitorService.exe (cx_Freeze service)

pause 