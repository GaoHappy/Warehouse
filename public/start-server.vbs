Dim objShell, scriptDir, command
scriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
command = "cmd /c ""cd /d " & scriptDir & " && node server.js"""
Set objShell = CreateObject("WScript.Shell")
objShell.Run command, 0, False
WScript.Sleep 2000
objShell.Run "http://localhost:3000/#/"
Set objShell = Nothing