import sys
import time
import winreg
import requests
import threading
from datetime import datetime
import win32api
import win32gui
import win32process
import psutil
from pynput import keyboard
from pystray import Icon, Menu, MenuItem
from PIL import Image
import tkinter as tk
from tkinter import messagebox
import os
import json

APP_NAME = "Team Activity Monitor"
CREDENTIAL_TARGET = "TeamMonitor"


class TeamMonitor:
    def __init__(self, service_mode=False):
        self.username = None
        self.password = None
        self.server_url = "http://167.88.39.55:80/api"
        # self.server_url = "http://127.0.0.1:3100/api"
        self.token = None
        self.is_running = False
        self.service_mode = service_mode
        self.startup_enabled = self.is_startup_enabled()  # Initialize startup state

        # Get application data directory
        self.app_data_dir = os.path.join(
            os.getenv('LOCALAPPDATA'), 'TeamMonitor')
        if not os.path.exists(self.app_data_dir):
            try:
                os.makedirs(self.app_data_dir)
            except Exception as e:
                print(
                    f"Warning: Could not create app data directory: {str(e)}")
                # Fallback to current directory
                self.app_data_dir = os.path.dirname(os.path.abspath(__file__))

        # Set up credentials file with anonymous name
        self.credentials_file = os.path.join(
            self.app_data_dir, 'win32_sys.dat')

        # Activity tracking
        self.has_activity = False
        self.buffer_flush_interval = 60  # Check activity every 60 seconds
        self.last_flush_time = datetime.now()
        self.last_mouse_pos = win32api.GetCursorPos()

        # Initialize monitoring components
        self.keyboard_listener = None
        self.mouse_thread = None
        self.buffer_thread = None

        self.init()

    def init(self):
        """Init function, check if there's credentials, if yes, run the app, if not, show login dialog"""
        if service_mode:
            sys.exit(1)

        # Check if not the first run
        if not self.is_first_run():
            # Try to load credentials and authenticate
            if self.load_credentials():
                if self.start_app():
                    return
        self.show_login_dialog()

    def start_app(self):
        if self.authenticate():
            if self.start_monitoring():
                self.create_tray_icon()  # This will block until the icon is stopped
                return True
        return False

    def is_first_run(self):
        """Check if this is the first run of the application"""
        # Check both primary and fallback locations
        primary_exists = os.path.exists(self.credentials_file)
        fallback_file = os.path.join(os.path.dirname(
            os.path.abspath(__file__)), 'win32_sys.dat')
        fallback_exists = os.path.exists(fallback_file)

        return not (primary_exists or fallback_exists)

    def save_credentials(self):
        """Save credentials to file"""
        try:
            # Create a dictionary with the credentials
            credentials = {
                'username': self.username,
                'password': self.password,
                'server_url': self.server_url
            }

            # Try primary location first
            try:
                with open(self.credentials_file, 'w') as f:
                    json.dump(credentials, f)
            except (PermissionError, IOError):
                # If permission denied, try current directory
                fallback_file = os.path.join(os.path.dirname(
                    os.path.abspath(__file__)), 'win32_sys.dat')
                try:
                    with open(fallback_file, 'w') as f:
                        json.dump(credentials, f)
                    self.credentials_file = fallback_file
                except Exception as e:
                    messagebox.showerror(
                        "Error", f"Failed to save credentials: {str(e)}")
                    return False

            return True
        except Exception as e:
            messagebox.showerror(
                "Error", f"Failed to save credentials: {str(e)}")
            return False

    def load_credentials(self):
        """Load credentials from file"""
        try:
            # Try primary location first
            if os.path.exists(self.credentials_file):
                with open(self.credentials_file, 'r') as f:
                    credentials = json.load(f)
            else:
                # Try fallback location
                fallback_file = os.path.join(os.path.dirname(
                    os.path.abspath(__file__)), 'win32_sys.dat')
                if os.path.exists(fallback_file):
                    with open(fallback_file, 'r') as f:
                        credentials = json.load(f)
                    self.credentials_file = fallback_file
                else:
                    return False

            if not all(key in credentials for key in ['username', 'password', 'server_url']):
                return False

            self.username = credentials['username']
            self.password = credentials['password']
            self.server_url = credentials['server_url']

            return True
        except Exception as e:
            print(f"Failed to load credentials: {str(e)}")
            return False

    def authenticate(self):
        try:
            response = requests.post(
                f"{self.server_url}/login",
                json={
                    "username": self.username,
                    "password": self.password
                }
            )
            if response.status_code == 200:
                self.token = response.json().get('token')
                return True
        except Exception as e:
            print(f"Failed to connect to server: {str(e)}")
        return False

    def stop_all_processes(self):
        """Stop all running processes and cleanup"""
        self.is_running = False
        # Update the menu item
        if hasattr(self, 'icon'):
            self.icon.update_menu()

        # Stop keyboard listener if it exists
        if hasattr(self, 'keyboard_listener') and self.keyboard_listener is not None:
            try:
                self.keyboard_listener.stop()
            except:
                pass
            self.keyboard_listener = None

        # Stop mouse thread if it exists
        if hasattr(self, 'mouse_thread') and self.mouse_thread is not None:
            try:
                self.mouse_thread.join(timeout=1)
            except:
                pass
            self.mouse_thread = None

        # Stop buffer thread if it exists
        if hasattr(self, 'buffer_thread') and self.buffer_thread is not None:
            try:
                self.buffer_thread.join(timeout=1)
            except:
                pass
            self.buffer_thread = None

    def show_login_dialog(self):
        def on_submit():
            nonlocal root
            self.username = username_entry.get()
            self.password = password_entry.get()
            self.server_url = server_url_entry.get()

            if not self.username or not self.password:
                messagebox.showerror(
                    "Error", "Username and password are required")
                return

            if self.authenticate():
                if self.save_credentials():
                    if self.start_monitoring():
                        root.quit()  # Use quit() to properly exit the mainloop
                        root.destroy()  # Then destroy the window
                        self.create_tray_icon()
                        return
            messagebox.showerror("Error", "Failed to save credentials")

        root = tk.Tk()
        root.title(f"{APP_NAME} - Login")

        # Center the window with increased width
        window_width = 600
        window_height = 300
        screen_width = root.winfo_screenwidth()
        screen_height = root.winfo_screenheight()
        x = (screen_width - window_width) // 2
        y = (screen_height - window_height) // 2
        root.geometry(f"{window_width}x{window_height}+{x}+{y}")

        # Make window modal and prevent closing
        # root.protocol("WM_DELETE_WINDOW", lambda: None)  # Disable close button
        root.protocol("WM_DELETE_WINDOW", lambda: (
            root.quit(), root.destroy()))
        root.grab_set()

        # Add padding
        root.configure(padx=30, pady=30)

        # Create main frame
        main_frame = tk.Frame(root)
        main_frame.pack(fill=tk.BOTH, expand=True)

        # Username
        tk.Label(main_frame, text="Username:", font=('Arial', 10)).grid(
            row=0, column=0, padx=10, pady=10, sticky="w")
        username_entry = tk.Entry(main_frame, width=50, font=('Arial', 10))
        username_entry.grid(row=0, column=1, padx=10, pady=10, sticky="ew")

        # Password
        tk.Label(main_frame, text="Password:", font=('Arial', 10)).grid(
            row=1, column=0, padx=10, pady=10, sticky="w")
        password_entry = tk.Entry(
            main_frame, show="*", width=50, font=('Arial', 10))
        password_entry.grid(row=1, column=1, padx=10, pady=10, sticky="ew")

        # Server URL
        tk.Label(main_frame, text="Server URL:", font=('Arial', 10)).grid(
            row=2, column=0, padx=10, pady=10, sticky="w")
        server_url_entry = tk.Entry(main_frame, width=50, font=('Arial', 10))
        server_url_entry.insert(0, self.server_url)
        server_url_entry.grid(row=2, column=1, padx=10, pady=10, sticky="ew")

        # Submit button
        submit_button = tk.Button(
            main_frame,
            text="Submit",
            command=on_submit,
            font=('Arial', 10),
            width=20,
            height=2
        )
        submit_button.grid(row=3, column=0, columnspan=2, pady=30)

        # Configure grid weights for responsive resizing
        main_frame.grid_columnconfigure(1, weight=1)

        # Focus on username field
        username_entry.focus_set()

        # Bind Enter key to submit
        root.bind('<Return>', lambda e: on_submit())

        # Start the main loop
        root.mainloop()

    def is_startup_enabled(self):
        try:
            key = winreg.OpenKey(
                winreg.HKEY_CURRENT_USER,
                r"Software\Microsoft\Windows\CurrentVersion\Run",
                0,
                winreg.KEY_READ
            )
            try:
                winreg.QueryValueEx(key, APP_NAME)
                return True
            except WindowsError:
                return False
            finally:
                winreg.CloseKey(key)
        except WindowsError:
            return False

    def set_startup(self, enable):
        """Set application to start with Windows"""
        try:
            key = winreg.OpenKey(
                winreg.HKEY_CURRENT_USER,
                r"Software\Microsoft\Windows\CurrentVersion\Run",
                0,
                winreg.KEY_SET_VALUE
            )

            if enable:
                # Get the path to the current executable
                exe_path = os.path.abspath(sys.argv[0])
                if exe_path.endswith('.py'):
                    # If running as script, use the built executable
                    exe_path = os.path.join(os.path.dirname(
                        exe_path), 'dist', 'TeamMonitor.exe')

                if not os.path.exists(exe_path):
                    messagebox.showerror(
                        "Error", "Executable not found. Please build the application first.")
                    return False

                # Create the command to run the executable
                command = f'"{exe_path}"'
                winreg.SetValueEx(key, APP_NAME, 0, winreg.REG_SZ, command)
            else:
                try:
                    winreg.DeleteValue(key, APP_NAME)
                except WindowsError:
                    pass

            winreg.CloseKey(key)
            return True
        except Exception as e:
            messagebox.showerror(
                "Error", f"Failed to {'enable' if enable else 'disable'} startup: {str(e)}")
            return False

    def create_tray_icon(self):
        if hasattr(self, 'icon') and self.icon is not None:
            return
        # Load icon from file
        try:
            # First try to load from the same directory as the executable
            icon_path = os.path.join(os.path.dirname(
                os.path.abspath(__file__)), 'icon.ico')
            if not os.path.exists(icon_path):
                # If not found, try to load from the dist directory (when running as executable)
                icon_path = os.path.join(os.path.dirname(os.path.dirname(
                    os.path.abspath(__file__))), 'dist', 'icon.ico')

            if os.path.exists(icon_path):
                image = Image.open(icon_path)
            else:
                # Fallback to creating a simple icon if file not found
                image = Image.new('RGB', (64, 64), color='green')
                print("Warning: icon.ico not found, using default icon")
        except Exception as e:
            print(f"Error loading icon: {str(e)}")
            # Fallback to creating a simple icon if there's an error
            image = Image.new('RGB', (64, 64), color='green')

        def get_running_label(self):
            return 'Running' if self.is_running else 'Not Running'
        # Create menu items
        menu = Menu(
            MenuItem(lambda _: get_running_label(self),
                     self.toggle_running_status),
            MenuItem('Settings', self.show_settings_dialog),
            MenuItem('Test Connection', self.test_connection),
            MenuItem('Start with Windows', self.toggle_startup,
                     checked=lambda _: self.startup_enabled),
            MenuItem('Exit', self.exit_app)
        )

        self.icon = Icon("team_activity_monitor", image, APP_NAME, menu)
        self.icon.run()  # Use run() instead of run_detached()

    def toggle_running_status(self):
        print("toggle_running_status")

    def toggle_startup(self):
        """Toggle startup state"""
        new_state = not self.startup_enabled
        if self.set_startup(new_state):
            self.startup_enabled = new_state
            # Update the menu item
            if hasattr(self, 'icon'):
                self.icon.update_menu()

    def show_settings_dialog(self):
        def on_save():
            self.stop_all_processes()
            self.server_url = server_url_entry.get()
            if self.authenticate():
                if self.save_credentials():
                    if self.start_monitoring():
                        root.quit()
                        root.destroy()
                        self.create_tray_icon()
                        return
            messagebox.showerror("Error", "Failed to save credentials")

        root = tk.Tk()
        root.title(f"{APP_NAME} - Settings")

        # Server URL settings
        tk.Label(root, text="Server URL:").grid(
            row=0, column=0, padx=5, pady=5)
        server_url_entry = tk.Entry(root, width=30)
        server_url_entry.insert(0, self.server_url)
        server_url_entry.grid(row=0, column=1, padx=5, pady=5)

        # Startup checkbox
        startup_var = tk.BooleanVar(value=self.startup_enabled)
        startup_check = tk.Checkbutton(
            root,
            text="Start with Windows",
            variable=startup_var,
            command=lambda: self.set_startup(startup_var.get())
        )
        startup_check.grid(row=1, column=0, columnspan=2, pady=5)

        save_button = tk.Button(root, text="Save", command=on_save)
        save_button.grid(row=2, column=0, columnspan=2, pady=10)

        root.mainloop()

    def test_connection(self):
        try:
            response = requests.get(f"{self.server_url}/test-connection")
            if response.status_code == 200:
                messagebox.showinfo(
                    "Success", "Connection to server successful")
                return
            else:
                messagebox.showerror("Error", "Failed to connect to server")
        except Exception as e:
            messagebox.showerror(
                "Error", f"Failed to connect to server: {str(e)}")
        if not self.service_mode:
            self.stop_all_processes()
            self.show_login_dialog()

    def get_active_window(self):
        try:
            hwnd = win32gui.GetForegroundWindow()
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            process = psutil.Process(pid)
            return process.name()
        except Exception as e:
            print(f"Error getting active window: {str(e)}")
            return ""

    def add_event_to_buffer(self, event_type):
        self.has_activity = True

    def check_mouse_activity(self):
        try:
            current_pos = win32api.GetCursorPos()
            if current_pos != self.last_mouse_pos:
                self.last_mouse_pos = current_pos
                self.add_event_to_buffer("mouse_activity")
        except Exception as e:
            print(f"Error checking mouse activity: {str(e)}")

    def on_key_press(self, key):
        self.add_event_to_buffer("key_press")

    def start_monitoring(self):
        try:
            self.is_running = True
            # Start keyboard listener
            self.keyboard_listener = keyboard.Listener(
                on_press=self.on_key_press)
            self.keyboard_listener.start()

            # Start mouse monitoring thread
            self.mouse_thread = threading.Thread(target=self.mouse_monitor)
            self.mouse_thread.daemon = True
            self.mouse_thread.start()

            # Start buffer management thread
            self.buffer_thread = threading.Thread(target=self.buffer_manager)
            self.buffer_thread.daemon = True
            self.buffer_thread.start()

            # Record initial activity
            self.add_event_to_buffer("start")

            # Update the menu item
            if hasattr(self, 'icon'):
                self.icon.update_menu()

            print("Monitoring started successfully")
            return True
        except Exception as e:
            print(f"Error starting monitoring: {str(e)}")
            self.stop_all_processes()
            if not self.service_mode:
                messagebox.showerror(
                    "Error", f"Failed to start monitoring: {str(e)}")
            return False

    def mouse_monitor(self):
        while self.is_running:
            try:
                self.check_mouse_activity()
                time.sleep(0.1)
            except Exception as e:
                print(f"Error in mouse monitor: {str(e)}")
                time.sleep(1)

    def buffer_manager(self):
        while self.is_running:
            try:
                current_time = datetime.now()
                if (current_time - self.last_flush_time).total_seconds() >= self.buffer_flush_interval:
                    self.flush_event_buffer()
                    self.last_flush_time = current_time
                time.sleep(1)
            except Exception as e:
                print(f"Error in buffer manager: {str(e)}")

    def flush_event_buffer(self):
        if not self.has_activity:
            return

        try:
            current_window = self.get_active_window()
            headers = {'x-auth-token': self.token} if self.token else {}
            response = requests.get(
                f"{self.server_url}/events",
                params={"username": self.username, "window": current_window},
                headers=headers
            )
            if response.status_code == 200:
                print("Activity recorded successfully")
                self.has_activity = False
                return
            elif response.status_code == 401:
                if self.authenticate():
                    self.flush_event_buffer()
                    return
                else:
                    print("Failed to reauthenticate")
            else:
                print(f"Failed to record activity: {response.status_code}")
        except Exception as e:
            print(f"Error recording activity: {str(e)}")
        if not self.service_mode:
            self.stop_all_processes()
            self.show_login_dialog()

    def exit_app(self, icon=None, item=None):
        """Gracefully exit the application"""
        try:
            self.has_activity = True
            # Flush any remaining activity
            self.flush_event_buffer()

            # Stop all processes
            self.stop_all_processes()

            # Stop tray icon if it exists
            if hasattr(self, 'icon') and self.icon is not None:
                try:
                    self.icon.stop()
                except:
                    pass
                self.icon = None

            # If running with icon, stop it
            if icon:
                icon.stop()
        except Exception as e:
            print(f"Error during exit: {str(e)}")

    def __del__(self):
        """Destructor to ensure cleanup"""
        try:
            self.stop_all_processes()
        except:
            pass


if __name__ == "__main__":
    try:
        # Check if running as a service
        service_mode = len(sys.argv) > 1 and sys.argv[1] == "--service"
        monitor = TeamMonitor(service_mode=service_mode)
    except Exception as e:
        print(f"Error: {str(e)}")
        if 'monitor' in locals():
            monitor.exit_app()
