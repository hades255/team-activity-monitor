import os
import sys
import time
import json
import winreg
import requests
import threading
from datetime import datetime
from pynput import mouse, keyboard
from pystray import Icon, Menu, MenuItem
from PIL import Image
import tkinter as tk
from tkinter import messagebox
import ctypes
from ctypes import wintypes

class TeamMonitor:
    def __init__(self):
        self.username = None
        self.password = None
        self.server_url = "http://localhost:3000/api"  # Default server URL
        self.last_event_time = datetime.now()
        self.inactive_threshold = 600  # 10 minutes in seconds
        self.is_running = True
        
        # Check if first run
        if self.is_first_run():
            self.show_login_dialog()
        else:
            self.load_credentials()
            
        # Create system tray icon
        self.create_tray_icon()
        
        # Start monitoring
        self.start_monitoring()

    def is_first_run(self):
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\TeamMonitor", 0, winreg.KEY_READ)
            winreg.CloseKey(key)
            return False
        except WindowsError:
            return True

    def save_credentials(self):
        try:
            key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, r"Software\TeamMonitor")
            winreg.SetValueEx(key, "Username", 0, winreg.REG_SZ, self.username)
            winreg.SetValueEx(key, "Password", 0, winreg.REG_SZ, self.password)
            winreg.SetValueEx(key, "ServerURL", 0, winreg.REG_SZ, self.server_url)
            winreg.CloseKey(key)
        except WindowsError as e:
            messagebox.showerror("Error", f"Failed to save credentials: {str(e)}")

    def load_credentials(self):
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\TeamMonitor", 0, winreg.KEY_READ)
            self.username = winreg.QueryValueEx(key, "Username")[0]
            self.password = winreg.QueryValueEx(key, "Password")[0]
            self.server_url = winreg.QueryValueEx(key, "ServerURL")[0]
            winreg.CloseKey(key)
        except WindowsError as e:
            messagebox.showerror("Error", f"Failed to load credentials: {str(e)}")

    def show_login_dialog(self):
        def on_submit():
            self.username = username_entry.get()
            self.password = password_entry.get()
            self.server_url = server_url_entry.get()
            
            if not self.username or not self.password:
                messagebox.showerror("Error", "Username and password are required")
                return
                
            self.save_credentials()
            root.destroy()

        root = tk.Tk()
        root.title("Team Monitor Login")
        
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

    def create_tray_icon(self):
        # Create a simple icon
        image = Image.new('RGB', (64, 64), color='green')
        
        # Create menu items
        menu = Menu(
            MenuItem('Settings', self.show_settings_dialog),
            MenuItem('Test Connection', self.test_connection),
            MenuItem('Exit', self.exit_app)
        )
        
        self.icon = Icon("team_monitor", image, "Team Monitor", menu)
        self.icon.run_detached()

    def show_settings_dialog(self):
        def on_save():
            self.server_url = server_url_entry.get()
            self.save_credentials()
            root.destroy()

        root = tk.Tk()
        root.title("Team Monitor Settings")
        
        tk.Label(root, text="Server URL:").grid(row=0, column=0, padx=5, pady=5)
        server_url_entry = tk.Entry(root)
        server_url_entry.insert(0, self.server_url)
        server_url_entry.grid(row=0, column=1, padx=5, pady=5)
        
        save_button = tk.Button(root, text="Save", command=on_save)
        save_button.grid(row=1, column=0, columnspan=2, pady=10)
        
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
            self.send_event("mouse_click")

    def on_key_press(self, key):
        self.send_event("key_press")

    def inactivity_check(self):
        while self.is_running:
            try:
                current_time = datetime.now()
                if (current_time - self.last_event_time).total_seconds() > self.inactive_threshold:
                    self.send_event("inactive")
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
            inactivity_thread = threading.Thread(target=self.inactivity_check)
            inactivity_thread.daemon = True
            inactivity_thread.start()
            
            # Send start event
            self.send_event("start")
            
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

    def send_event(self, event_type):
        try:
            data = {
                "username": self.username,
                "event_type": event_type,
                "event_datetime": datetime.now().isoformat()
            }
            response = requests.get(f"{self.server_url}/event", params=data)
            if response.status_code == 200:
                self.last_event_time = datetime.now()
            else:
                print(f"Failed to send event: {response.status_code}")
        except Exception as e:
            print(f"Error sending event: {str(e)}")

    def exit_app(self):
        self.is_running = False
        self.icon.stop()
        sys.exit(0)

if __name__ == "__main__":
    try:
        monitor = TeamMonitor()
    except KeyboardInterrupt:
        print("\nShutting down...")
        sys.exit(0) 