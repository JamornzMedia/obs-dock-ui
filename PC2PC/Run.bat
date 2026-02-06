@echo off
echo.
echo  Installing dependencies...
python -m pip install numpy sounddevice pyaudiowpatch --quiet 2>nul

echo.
echo  ========================================
echo    NDI Audio Bridge v1.0
echo    Browser will open automatically
echo  ========================================
echo.
python "%~dp0app.py"
pause
