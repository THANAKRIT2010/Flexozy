@echo off
chcp 65001 >nul
setlocal

rem ==== Flexozy: obfuscate script.lua ====
rem วางไฟล์ script.lua ไว้ในโฟลเดอร์เดียวกับ obfuscate.bat แล้วดับเบิลคลิกไฟล์นี้
rem ผลลัพธ์จะอยู่ที่ script_obf.luau ในโฟลเดอร์เดียวกัน

set "SCRIPT_DIR=%~dp0"
set "INPUT=%SCRIPT_DIR%script.lua"
set "OUTPUT=%SCRIPT_DIR%script_obf.luau"

if not exist "%INPUT%" (
    echo ไม่พบไฟล์ script.lua ในโฟลเดอร์: %SCRIPT_DIR%
    pause
    exit /b 1
)

where python >nul 2>nul
if errorlevel 1 (
    echo ไม่พบ Python ในเครื่อง กรุณาติดตั้ง Python 3 และเลือก "Add to PATH"
    pause
    exit /b 1
)

echo กำลัง obfuscate script.lua ...
python "%SCRIPT_DIR%obf.py" "%INPUT%" -o "%OUTPUT%"
if errorlevel 1 (
    echo.
    echo เกิดข้อผิดพลาดระหว่าง obfuscate
    pause
    exit /b 1
)

echo.
echo สำเร็จ: %OUTPUT%
pause
endlocal
