import os
import sys
import shutil
from cx_Freeze import setup, Executable

# Get the absolute path to the icon file
icon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'icon.ico')

# Dependencies are automatically detected, but it might need fine tuning.
build_exe_options = {
    "packages": [
        "os", "sys", "json", "winreg", "requests", "threading", 
        "datetime", "pynput", "pystray", "PIL", "tkinter", "idna",
        "win32api", "win32gui", "win32process", "psutil"
    ],
    "excludes": [],
    "include_files": [
        (icon_path, "icon.ico"),
    ],
    "include_msvcr": True  # Include Microsoft Visual C++ runtime
}

# GUI applications require a different base on Windows (the default is for a console application).
base = None
if sys.platform == "win32":
    base = "Win32GUI"

# Get the directory of the script
script_dir = os.path.dirname(os.path.abspath(__file__))

setup(
    name="Team Activity Monitor",
    version="1.0",
    description="Team Activity Monitor Client Application",
    options={"build_exe": build_exe_options},
    executables=[
        Executable(
            os.path.join(script_dir, "team_monitor.py"),
            base=base,
            target_name="TeamActivityMonitor.exe",
            icon=icon_path,
            uac_admin=True
        ),
        Executable(
            os.path.join(script_dir, "team_monitor_service.py"),
            base=base,
            target_name="TeamActivityMonitorService.exe",
            icon=icon_path,
            uac_admin=True
        )
    ]
) 