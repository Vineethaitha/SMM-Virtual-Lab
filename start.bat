@echo off
REM 21CSC403T Virtual Lab - Windows startup script.
REM Sets up (first run) and launches BOTH servers in separate windows:
REM   Backend  -> http://127.0.0.1:8000
REM   Frontend -> http://localhost:5173

setlocal
set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"
set "VENV_DIR=%ROOT_DIR%.venv"

where python >nul 2>&1
if errorlevel 1 (
  echo [fail] Python 3 not found. Install Python 3.11+ and retry.
  exit /b 1
)

if not exist "%VENV_DIR%" (
  echo [start] Creating virtual environment at .venv ...
  python -m venv "%VENV_DIR%"
)

echo [start] Installing backend dependencies ...
call "%VENV_DIR%\Scripts\activate.bat"
python -m pip install --quiet --upgrade pip
python -m pip install --quiet -r "%BACKEND_DIR%\requirements.txt"

if not exist "%FRONTEND_DIR%\node_modules" (
  echo [start] Installing frontend dependencies ...
  pushd "%FRONTEND_DIR%" && npm install && popd
)

echo [start] Launching backend on http://127.0.0.1:8000 ...
start "21CSC403T Backend" cmd /k "cd /d "%BACKEND_DIR%" && "%VENV_DIR%\Scripts\uvicorn.exe" app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [start] Launching frontend on http://localhost:5173 ...
start "21CSC403T Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"

echo [ ok ] Servers launched. Open http://localhost:5173
endlocal
