import win32serviceutil
import win32service
import win32event
import servicemanager
import socket
import sys
import os
import subprocess

class TeamMonitorService(win32serviceutil.ServiceFramework):
    _svc_name_ = "TeamMonitor"
    _svc_display_name_ = "Team Monitor Service"
    _svc_description_ = "Monitors team activity and sends data to server"

    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
        socket.setdefaulttimeout(60)
        self.is_alive = True

    def SvcStop(self):
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.hWaitStop)
        self.is_alive = False

    def SvcDoRun(self):
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, '')
        )
        self.main()

    def main(self):
        # Get the path to the executable
        exe_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist', 'TeamMonitor.exe')
        
        # Start the application in service mode
        process = subprocess.Popen([exe_path, '--service'], 
                                 creationflags=subprocess.CREATE_NO_WINDOW)
        
        # Wait for the stop event
        while self.is_alive:
            if process.poll() is not None:
                # If the process died, restart it
                process = subprocess.Popen([exe_path, '--service'], 
                                        creationflags=subprocess.CREATE_NO_WINDOW)
            win32event.WaitForSingleObject(self.hWaitStop, 1000)
        
        # Cleanup
        process.terminate()
        process.wait()

if __name__ == '__main__':
    if len(sys.argv) == 1:
        servicemanager.Initialize()
        servicemanager.PrepareToHostSingle(TeamMonitorService)
        servicemanager.StartServiceCtrlDispatcher()
    else:
        win32serviceutil.HandleCommandLine(TeamMonitorService) 