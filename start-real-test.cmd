@echo off
setlocal EnableExtensions
cd /d "%~dp0"

if not exist ".env.real-test.local" (
  echo Fichier .env.real-test.local introuvable.
  echo Creez-le a partir de .env.real-test.example puis ajoutez les cles Stripe et Resend.
  pause
  exit /b 1
)

for /f "usebackq eol=# tokens=1,* delims==" %%A in (".env.real-test.local") do (
  if not "%%A"=="" set "%%A=%%B"
)

echo Demarrage du test reel sur http://127.0.0.1:%PORT%/index.html#shop
echo Gardez cette fenetre ouverte pendant le test.
echo.

npm start
