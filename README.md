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
