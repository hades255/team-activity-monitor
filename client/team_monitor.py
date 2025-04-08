import sys
import time
import winreg
import requests
import threading
from datetime import datetime
from pynput import mouse, keyboard
from pystray import Icon, Menu, MenuItem
from PIL import Image
import tkinter as tk
from tkinter import messagebox
import os

APP_NAME = "Team Activity Monitor"  # Add application name constant

class TeamMonitor:
    def __init__(self, service_mode=False):
        self.username = None
        self.password = None
        self.server_url = "http://localhost:3000/api"  # Default server URL
        self.token = None  # Add token storage
        self.last_event_time = datetime.now()
        self.inactive_threshold = 600  # 10 minutes in seconds
        self.is_running = True
        self.startup_enabled = self.is_startup_enabled()  # Check startup status
        self.service_mode = service_mode
        
        # Activity tracking
        self.has_activity = False
        self.buffer_flush_interval = 60  # Check activity every 60 seconds
        self.last_flush_time = datetime.now()
        
        # Check if first run
        if self.is_first_run():
            if not service_mode:
                self.show_login_dialog()
            else:
                # In service mode, we need to load credentials from registry
                self.load_credentials()
                if not self.authenticate():
                    raise Exception("Failed to authenticate in service mode")
        else:
            self.load_credentials()
            # Try to authenticate with saved credentials
            if not self.authenticate():
                if not service_mode:
                    self.show_login_dialog()
                else:
                    raise Exception("Failed to authenticate in service mode")
            
        # Create system tray icon only if not in service mode
        if not service_mode:
            self.create_tray_icon()
        
        # Start monitoring
        self.start_monitoring()

    def is_first_run(self):
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\TeamActivityMonitor", 0, winreg.KEY_READ)
            winreg.CloseKey(key)
            return False
        except WindowsError:
            return True

    def save_credentials(self):
        try:
            key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, r"Software\TeamActivityMonitor")
            winreg.SetValueEx(key, "Username", 0, winreg.REG_SZ, self.username)
            winreg.SetValueEx(key, "Password", 0, winreg.REG_SZ, self.password)
            winreg.SetValueEx(key, "ServerURL", 0, winreg.REG_SZ, self.server_url)
            winreg.CloseKey(key)
        except WindowsError as e:
            messagebox.showerror("Error", f"Failed to save credentials: {str(e)}")

    def load_credentials(self):
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\TeamActivityMonitor", 0, winreg.KEY_READ)
            self.username = winreg.QueryValueEx(key, "Username")[0]
            self.password = winreg.QueryValueEx(key, "Password")[0]
            self.server_url = winreg.QueryValueEx(key, "ServerURL")[0]
            winreg.CloseKey(key)
        except WindowsError as e:
            messagebox.showerror("Error", f"Failed to load credentials: {str(e)}")

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
            else:
                messagebox.showerror("Error", "Invalid credentials. Please login again.")
                self.show_login_dialog()
                return False
        except Exception as e:
            messagebox.showerror("Error", f"Failed to connect to server: {str(e)}")
            return False

    def show_login_dialog(self):
        def on_submit():
            self.username = username_entry.get()
            self.password = password_entry.get()
            self.server_url = server_url_entry.get()
            
            if not self.username or not self.password:
                messagebox.showerror("Error", "Username and password are required")
                return
                
            if self.authenticate():
                self.save_credentials()
                root.destroy()

        root = tk.Tk()
        root.title(f"{APP_NAME} - Login")
        
        tk.Label(root, text="Username:").grid(row=0, column=0, padx=5, pady=5)
        username_entry = tk.Entry(root)
        username_entry.grid(row=0, column=1, padx=5, pady=5)
        
        tk.Label(root, text="Password:").grid(row=1, column=0, padx=5, pady=5)
        password_entry = tk.Entry(root, show="*")
        password_entry.grid(row=1, column=1, padx=5, pady=5)
        
        tk.Label(root, text="Server URL:").grid(row=2, column=0, padx=5, pady=5)
        server_url_entry = tk.Entry(root)
        server_url_entry.insert(0, self.server_url)
        server_url_entry.grid(row=2, column=1, padx=5, pady=5)
        
        submit_button = tk.Button(root, text="Submit", command=on_submit)
        submit_button.grid(row=3, column=0, columnspan=2, pady=10)
        
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
        try:
            key = winreg.OpenKey(
                winreg.HKEY_CURRENT_USER,
                r"Software\Microsoft\Windows\CurrentVersion\Run",
                0,
                winreg.KEY_SET_VALUE
            )
            
            if enable:
                # Get the path to the current executable
                exe_path = sys.executable
                # Get the path to the script
                script_path = os.path.abspath(__file__)
                # Create the command to run the script
                command = f'"{exe_path}" "{script_path}"'
                winreg.SetValueEx(key, APP_NAME, 0, winreg.REG_SZ, command)
            else:
                try:
                    winreg.DeleteValue(key, APP_NAME)
                except WindowsError:
                    pass
                    
            winreg.CloseKey(key)
            self.startup_enabled = enable
            return True
        except WindowsError as e:
            messagebox.showerror("Error", f"Failed to {'enable' if enable else 'disable'} startup: {str(e)}")
            return False

    def create_tray_icon(self):
        # Load icon from file
        try:
            # First try to load from the same directory as the executable
            icon_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'icon.ico')
            if not os.path.exists(icon_path):
                # If not found, try to load from the dist directory (when running as executable)
                icon_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'dist', 'icon.ico')
            
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
        
        # Create menu items
        menu = Menu(
            MenuItem('Settings', self.show_settings_dialog),
            MenuItem('Test Connection', self.test_connection),
            MenuItem('Start with Windows', self.toggle_startup, checked=lambda _: self.startup_enabled),
            MenuItem('Exit', self.exit_app)
        )
        
        self.icon = Icon("team_activity_monitor", image, APP_NAME, menu)
        self.icon.run_detached()

    def toggle_startup(self):
        self.set_startup(not self.startup_enabled)
        # Update the menu item
        self.icon.update_menu()

    def show_settings_dialog(self):
        def on_save():
            self.server_url = server_url_entry.get()
            self.save_credentials()
            root.destroy()

        root = tk.Tk()
        root.title(f"{APP_NAME} - Settings")
        
        # Server URL settings
        tk.Label(root, text="Server URL:").grid(row=0, column=0, padx=5, pady=5)
        server_url_entry = tk.Entry(root)
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
                messagebox.showinfo("Success", "Connection to server successful")
            else:
                messagebox.showerror("Error", "Failed to connect to server")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to connect to server: {str(e)}")

    def on_mouse_click(self, x, y, button, pressed):
        if pressed:
            self.add_event_to_buffer("mouse_click")

    def on_key_press(self, key):
        self.add_event_to_buffer("key_press")

    def add_event_to_buffer(self, event_type):
        self.has_activity = True
        self.last_event_time = datetime.now()

    def flush_event_buffer(self):
        if not self.has_activity:
            return

        try:
            self.has_activity = False
            headers = {'Authorization': f'Bearer {self.token}'} if self.token else {}
            response = requests.get(
                f"{self.server_url}/events",
                params={"username": self.username},
                headers=headers
            )
            if response.status_code == 200:
                print("Activity recorded successfully")
            elif response.status_code == 401:
                # Token expired, try to reauthenticate
                if self.authenticate():
                    # Retry the request with new token
                    headers = {'Authorization': f'Bearer {self.token}'}
                    response = requests.get(
                        f"{self.server_url}/events",
                        params={"username": self.username},
                        headers=headers
                    )
                    if response.status_code == 200:
                        print("Activity recorded successfully")
                    else:
                        print(f"Failed to record activity: {response.status_code}")
                        self.has_activity = True
                else:
                    print("Failed to reauthenticate")
                    self.has_activity = True
            else:
                print(f"Failed to record activity: {response.status_code}")
                self.has_activity = True
        except Exception as e:
            print(f"Error recording activity: {str(e)}")
            self.has_activity = True

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

    def inactivity_check(self):
        while self.is_running:
            try:
                current_time = datetime.now()
                if (current_time - self.last_event_time).total_seconds() > self.inactive_threshold:
                    self.add_event_to_buffer("inactive")
                time.sleep(60)  # Check every minute
            except Exception as e:
                print(f"Error in inactivity check: {str(e)}")

    def start_monitoring(self):
        try:
            # Start mouse listener for clicks only
            mouse_listener = mouse.Listener(on_click=self.on_mouse_click)
            mouse_listener.start()
            
            # Start keyboard listener
            keyboard_listener = keyboard.Listener(on_press=self.on_key_press)
            keyboard_listener.start()
            
            # Start inactivity checker
            # inactivity_thread = threading.Thread(target=self.inactivity_check)
            # inactivity_thread.daemon = True
            # inactivity_thread.start()
            
            # Start buffer manager
            buffer_thread = threading.Thread(target=self.buffer_manager)
            buffer_thread.daemon = True
            buffer_thread.start()
            
            # Send start event
            self.add_event_to_buffer("start")
            
            # Keep the main thread running
            try:
                while self.is_running:
                    time.sleep(1)
            except KeyboardInterrupt:
                print("\nShutting down...")
                self.exit_app()
                
        except Exception as e:
            print(f"Error starting monitoring: {str(e)}")
            messagebox.showerror("Error", f"Failed to start monitoring: {str(e)}")

    def exit_app(self):
        # Record any remaining activity before exiting
        self.flush_event_buffer()
        self.is_running = False
        if not self.service_mode:
            self.icon.stop()
        sys.exit(0)

if __name__ == "__main__":
    try:
        # Check if running as a service
        service_mode = len(sys.argv) > 1 and sys.argv[1] == "--service"
        monitor = TeamMonitor(service_mode=service_mode)
    except KeyboardInterrupt:
        print("\nShutting down...")
        sys.exit(0) 