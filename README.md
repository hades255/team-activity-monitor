# Team Activity Monitor

A comprehensive team activity monitoring system that tracks application usage, working hours, and provides detailed analytics.

## Features

- Real-time application usage tracking
- Working hours monitoring
- Team activity analytics
- User-friendly dashboard
- System tray integration
- Windows startup integration
- Admin and user roles
- Secure authentication

## Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher
- MongoDB
- Windows operating system (for client application)

## Project Structure

```
.
├── client/                 # Client application (Python)
├── server/                 # Server application (Node.js)
│   ├── client/            # Frontend website (React)
│   └── src/               # Backend server code
```

## Installation

### Server Setup

1. Navigate to the server directory:

   ```bash
   cd server
   ```

2. Install server dependencies:

   ```bash
   npm install
   ```

3. Install frontend dependencies:

   ```bash
   cd client
   npm install
   ```

4. Create a `.env` file in the server directory with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/team_activity
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

### Client Setup

1. Navigate to the client directory:

   ```bash
   cd client
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

### Starting the Server

1. Start MongoDB:

   ```bash
   mongod
   ```

2. In a new terminal, start the backend server:

   ```bash
   cd server
   npm start
   ```

3. In another terminal, start the frontend development server:
   ```bash
   cd server/client
   npm start
   ```

The frontend will be available at `http://localhost:3000`

### Running the Client Application

1. Build the client application:

   ```bash
   cd client
   python build.py
   ```

2. Run the built executable:
   ```bash
   ./dist/TeamActivityMonitor.exe
   ```

## Usage

1. Open your web browser and navigate to `http://localhost:3000`
2. Log in with your credentials
3. The dashboard will display team activity data
4. The client application will run in the system tray, monitoring activity

## Development

### Server Development

- Backend API: `http://localhost:5000`
- API documentation available at `http://localhost:5000/api-docs`

### Frontend Development

- Development server: `http://localhost:3000`
- Hot reloading enabled
- ESLint for code quality

### Client Development

- Python application with system tray integration
- Uses PyInstaller for building executables
- Configuration in `team_monitor.spec`

## Troubleshooting

1. If MongoDB connection fails:

   - Ensure MongoDB is running
   - Check the connection string in `.env`

2. If the frontend fails to start:

   - Check Node.js version
   - Clear node_modules and reinstall dependencies

3. If the client application fails to start:
   - Check Python version
   - Ensure all dependencies are installed
   - Verify icon.ico exists in the client directory

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Building the Python Client

### Prerequisites for Building

1. Install PyInstaller:

   ```bash
   pip install pyinstaller
   ```

2. Install all required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Building Steps

1. Navigate to the client directory:

   ```bash
   cd client
   ```

2. Run the build script:

   ```bash
   python build.py
   ```

   This will:

   - Clean any previous builds
   - Create a new build using PyInstaller
   - Generate the executable in the `dist` directory

3. The built executable will be available at:
   ```
   client/dist/TeamActivityMonitor.exe
   ```

### Build Configuration

The build process uses `team_monitor.spec` which includes:

- Required Python packages
- Data files (including icon.ico)
- Windows-specific settings
- UAC elevation requirements

### Customizing the Build

To modify the build configuration:

1. Edit `team_monitor.spec` for:
   - Additional dependencies
   - Data files
   - Build options
2. Edit `build.py` for:
   - Build process customization
   - Additional build steps

### Troubleshooting Build Issues

1. If build fails:

   - Ensure all dependencies are installed
   - Check Python version compatibility
   - Verify icon.ico exists in client directory
   - Run with administrator privileges if needed

2. If executable doesn't run:
   - Check for missing DLLs
   - Verify all required files are included
   - Test on a clean Windows installation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Client Installation Guide

### Quick Installation (For Team Members)

1. **Download the Installer**
   - Download the `TeamMonitor.zip` file
   - Extract the contents to a folder of your choice

2. **Run the Application**
   - Double-click `TeamMonitor.exe`
   - The application will start and show the login dialog

3. **First-Time Setup**
   - Enter your username and password (provided by your administrator)
   - The server URL is pre-configured
   - Click "Submit" to start monitoring

4. **System Tray Icon**
   - The application runs in the system tray (bottom-right corner)
   - Right-click the icon to access:
     - Settings
     - Test Connection
     - Start with Windows option
     - Exit

### Manual Installation (For Administrators)

1. **Prerequisites**
   ```bash
   pip install pyinstaller pywin32 pystray pillow psutil pynput requests
   ```

2. **Build the Executable**
   ```bash
   cd client
   build.bat
   ```

3. **Distribute the Installer**
   - Share the generated `TeamMonitor.zip` file with team members
   - The zip file contains a single executable that's ready to run

### Features

- **Automatic Startup**: Option to start with Windows
- **Background Operation**: Runs in system tray
- **Activity Tracking**: Monitors application usage and working hours
- **Secure Connection**: Encrypted communication with server
- **Easy Configuration**: Simple setup process

### Troubleshooting

1. **Application Won't Start**
   - Ensure you have administrator privileges
   - Check if the server is accessible
   - Verify your credentials

2. **Connection Issues**
   - Check your internet connection
   - Verify the server URL is correct
   - Contact your administrator if problems persist

3. **System Tray Icon Missing**
   - The application might be minimized
   - Check Windows notification area settings
   - Restart the application if needed


---

Here are the commands to build and install the client app:

1. **Install Required Packages**:
```bash
pip install pyinstaller pywin32 pystray pillow psutil pynput requests
```

2. **Build the Executable**:
```bash
cd client
pyinstaller --clean team_monitor.spec
```

3. **Install as Windows Service**:
```bash
# Run as administrator
install.bat
```

4. **Uninstall the Service**:
```bash
# Run as administrator
uninstall.bat
```


### Support

For additional support, contact your administrator or refer to the help section in the web dashboard.
