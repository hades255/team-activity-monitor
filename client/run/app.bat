@echo off
REM Set the path to the TeamMonitor.exe
set EXE_FILE=%USERPROFILE%\teammonitor\TeamMonitor.exe

REM Check if the executable exists
if not exist "%EXE_FILE%" (
    echo TeamMonitor.exe not found in %USERPROFILE%\teammonitor.
    pause
    exit /b
)

REM Run the TeamMonitor.exe
echo Running TeamMonitor.exe...
start "" "%EXE_FILE%"

REM End of script
echo TeamMonitor.exe has been started.
@REM pause
exit /b
