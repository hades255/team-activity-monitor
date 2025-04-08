from setuptools import setup

# Platform-specific dependencies
install_requires = [
    "pynput==1.7.6",
    "requests==2.31.0",
    "pystray==0.19.5",
    "cx_Freeze==6.15.12"
]

# Add Pillow with platform-specific version
import sys
if sys.platform == "win32":
    install_requires.append("Pillow==10.2.0; platform_system=='Windows'")
else:
    install_requires.append("Pillow==10.2.0")

setup(
    name="team-monitor",
    version="1.0",
    description="Team Monitor Client Application",
    python_requires=">=3.8",
    install_requires=install_requires,
    setup_requires=[
        "wheel",
        "setuptools>=58.0.0"
    ]
)
 