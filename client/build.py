import os
import sys
import shutil
from cx_Freeze import setup, Executable

# Dependencies are automatically detected, but it might need fine tuning.
build_exe_options = {
    "packages": [
        "os", "sys", "json", "winreg", "requests", "threading", 
        "datetime", "pynput", "pystray", "PIL", "tkinter", "idna"
    ],
    "excludes": [],
    "include_files": [],
    "include_msvcr": True  # Include Microsoft Visual C++ runtime
}

# GUI applications require a different base on Windows (the default is for a console application).
base = None
if sys.platform == "win32":
    base = "Win32GUI"

# Get the directory of the script
script_dir = os.path.dirname(os.path.abspath(__file__))

setup(
    name="Team Monitor",
    version="1.0",
    description="Team Monitor Client Application",
    options={"build_exe": build_exe_options},
    executables=[
        Executable(
            os.path.join(script_dir, "team_monitor.py"),
            base=base,
            target_name="TeamMonitor.exe",
            icon=None  # You can add an icon file here
        )
    ]
) 