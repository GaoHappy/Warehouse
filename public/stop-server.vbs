Dim objShell
Set objShell = CreateObject("WScript.Shell")
objShell.Run "taskkill /f /im node.exe", 0, True
Set objShell = Nothing