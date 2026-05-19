@echo off
setlocal
cd /d "%~dp0"

if not exist tools mkdir tools

echo Demarrage du tunnel public vers http://127.0.0.1:4174
echo Gardez cette fenetre ouverte pendant le test terrain.
echo.

ssh.exe -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -o ServerAliveInterval=30 -o ExitOnForwardFailure=yes -R 80:localhost:4174 nokey@localhost.run
