# Team Monitor

A team management system that tracks user activity and provides detailed statistics about working hours and patterns.

## Components

1. Client Application (Python)
   - Monitors keyboard and mouse activity
   - Sends activity data to the server
   - Runs in system tray
   - Lightweight and optimized

2. Server Application (Node.js + React)
   - Web interface for viewing statistics
   - User management
   - Activity tracking and reporting
   - MongoDB database

## Setup Instructions

### Client Setup

1. Install Python 3.8 or higher
   - Download and install Python from [python.org](https://www.python.org/downloads/)
   - Make sure to check "Add Python to PATH" during installation

2. For Windows users, install required build tools:
   - Install Microsoft Visual C++ Build Tools from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - During installation, select "Desktop development with C++"
   - Make sure to include the Windows 10 SDK

3. Install required packages (Windows-specific steps):
   ```bash
   cd client
   
   # First, upgrade pip and install wheel
   python -m pip install --upgrade pip setuptools wheel
   
   # Install Pillow using pre-built wheel
   pip install --only-binary :all: Pillow==10.2.0
   
   # Install the rest of the package
   pip install -e .
   ```

   If you encounter any issues, try these steps in order:

   1. First, make sure pip is up to date:
      ```bash
      python -m pip install --upgrade pip
      ```

   2. Install setuptools and wheel:
      ```bash
      python -m pip install --upgrade setuptools wheel
      ```

   3. Install Pillow using pre-built wheel:
      ```bash
      pip install --only-binary :all: Pillow==10.2.0
      ```

   4. Install the rest of the package:
      ```bash
      pip install -e .
      ```

4. Run the client:
   ```bash
   python team_monitor.py
   ```

5. To build the executable:
   ```bash
   python build.py build
   ```
   The executable will be created in the `build` directory.

### Server Setup

1. Install Node.js and MongoDB
   - Download and install Node.js from [nodejs.org](https://nodejs.org/)
   - Download and install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)

2. Install server dependencies:
   ```bash
   cd server
   npm install
   ```

3. Create the admin user:
   ```bash
   node createAdmin.js
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Usage

1. Admin creates a new user through the web interface
2. User downloads and installs the client application
3. User enters credentials on first run
4. Client runs in system tray and monitors activity
5. Users can view their activity statistics through the web interface

## Features

- Real-time activity monitoring
- System tray integration
- Configurable server settings
- Detailed activity statistics
- Calendar view of working hours
- User management for admins
- Connection testing
- Automatic startup
- Secure credential storage

## Troubleshooting

### Python Package Installation Issues

If you encounter issues installing Python packages:

1. Make sure you have the latest version of pip and setuptools:
   ```bash
   python -m pip install --upgrade pip setuptools wheel
   ```

2. For Windows users, make sure you have Visual C++ Build Tools installed:
   - Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Select "Desktop development with C++"
   - Include Windows 10 SDK

3. If Pillow installation fails, try these steps in order:
   ```bash
   # First, uninstall any existing Pillow
   pip uninstall Pillow
   
   # Then install using pre-built wheel
   pip install --only-binary :all: Pillow==10.2.0
   
   # If that fails, try with specific Python version
   pip install --only-binary :all: --python-version 3.13 --platform win_amd64 Pillow==10.2.0
   ```

4. If you get SSL errors, try:
   ```bash
   pip install --trusted-host pypi.org --trusted-host files.pythonhosted.org -e .
   ```

5. If you get permission errors, try:
   ```bash
   pip install --user -e .
   ```

### Building the Executable

If you encounter issues building the executable:

1. Make sure you have all dependencies installed
2. Make sure you have Microsoft Visual C++ Build Tools installed
3. Try running the build command with administrator privileges 