@echo off
echo Installing required packages...
pip install pyinstaller pywin32 pystray pillow pynput requests psutil

echo Creating executable...
pyinstaller --clean team_monitor.spec

echo Creating service executable...
pyinstaller --clean team_monitor_service.spec

echo Build complete!
echo The executables are in the dist folder:
echo - TeamActivityMonitor.exe (main application)
echo - TeamActivityMonitorService.exe (Windows service)
pause 