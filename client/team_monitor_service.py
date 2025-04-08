import win32serviceutil
import win32service
import win32event
import servicemanager
import socket
import sys
import os
from team_monitor import TeamMonitor

class TeamMonitorService(win32serviceutil.ServiceFramework):
    _svc_name_ = "TeamActivityMonitor"
    _svc_display_name_ = "Team Activity Monitor"
    _svc_description_ = "Monitors user activity and sends data to the server"

    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
        socket.setdefaulttimeout(60)
        self.monitor = None

    def SvcStop(self):
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.hWaitStop)
        if self.monitor:
            self.monitor.exit_app()

    def SvcDoRun(self):
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, '')
        )
        self.main()

    def main(self):
        try:
            self.monitor = TeamMonitor()
            # Keep the service running
            while True:
                if win32event.WaitForSingleObject(self.hWaitStop, 1000) == win32event.WAIT_OBJECT_0:
                    break
        except Exception as e:
            servicemanager.LogErrorMsg(f"Service error: {str(e)}")

if __name__ == '__main__':
    if len(sys.argv) == 1:
        servicemanager.Initialize()
        servicemanager.PrepareToHostSingle(TeamMonitorService)
        servicemanager.StartServiceCtrlDispatcher()
    else:
        win32serviceutil.HandleCommandLine(TeamMonitorService) 