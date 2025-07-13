@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ==========================================
echo 图钉完全卸载清理工具
echo ==========================================
echo.

echo [1/8] 正在检测图钉进程...
tasklist | findstr /i "图钉.exe" >nul
if !errorlevel! == 0 (
    echo 发现图钉进程正在运行，正在强制终止...
    taskkill /F /IM "图钉.exe" /T >nul 2>&1
    taskkill /F /IM "tuding.exe" /T >nul 2>&1
    taskkill /F /IM "Tuding.exe" /T >nul 2>&1
    taskkill /F /IM "TUDING.EXE" /T >nul 2>&1
    echo 进程已终止
) else (
    echo 未发现图钉进程
)

echo.
echo [2/8] 等待进程完全停止...
timeout /t 3 /nobreak >nul

echo [3/8] 正在清理程序安装目录...
if exist "%PROGRAMFILES%\图钉" (
    rmdir /s /q "%PROGRAMFILES%\图钉" >nul 2>&1
    echo 已删除: %PROGRAMFILES%\图钉
)
if exist "%PROGRAMFILES(X86)%\图钉" (
    rmdir /s /q "%PROGRAMFILES(X86)%\图钉" >nul 2>&1
    echo 已删除: %PROGRAMFILES(X86)%\图钉
)
if exist "%LOCALAPPDATA%\Programs\图钉" (
    rmdir /s /q "%LOCALAPPDATA%\Programs\图钉" >nul 2>&1
    echo 已删除: %LOCALAPPDATA%\Programs\图钉
)

echo [4/8] 正在清理用户数据...
if exist "%APPDATA%\tuding" (
    rmdir /s /q "%APPDATA%\tuding" >nul 2>&1
    echo 已删除: %APPDATA%\tuding
)
if exist "%APPDATA%\Tuding" (
    rmdir /s /q "%APPDATA%\Tuding" >nul 2>&1
    echo 已删除: %APPDATA%\Tuding
)
if exist "%APPDATA%\图钉" (
    rmdir /s /q "%APPDATA%\图钉" >nul 2>&1
    echo 已删除: %APPDATA%\图钉
)

echo [5/8] 正在清理本地应用数据...
if exist "%LOCALAPPDATA%\tuding" (
    rmdir /s /q "%LOCALAPPDATA%\tuding" >nul 2>&1
    echo 已删除: %LOCALAPPDATA%\tuding
)
if exist "%LOCALAPPDATA%\Tuding" (
    rmdir /s /q "%LOCALAPPDATA%\Tuding" >nul 2>&1
    echo 已删除: %LOCALAPPDATA%\Tuding
)
if exist "%LOCALAPPDATA%\图钉" (
    rmdir /s /q "%LOCALAPPDATA%\图钉" >nul 2>&1
    echo 已删除: %LOCALAPPDATA%\图钉
)

echo [6/8] 正在清理临时文件...
if exist "%TEMP%\tuding" (
    rmdir /s /q "%TEMP%\tuding" >nul 2>&1
    echo 已删除: %TEMP%\tuding
)
if exist "%TEMP%\Tuding" (
    rmdir /s /q "%TEMP%\Tuding" >nul 2>&1
    echo 已删除: %TEMP%\Tuding
)
if exist "%TEMP%\图钉" (
    rmdir /s /q "%TEMP%\图钉" >nul 2>&1
    echo 已删除: %TEMP%\图钉
)

echo [7/8] 正在清理快捷方式...
if exist "%USERPROFILE%\Desktop\图钉.lnk" (
    del "%USERPROFILE%\Desktop\图钉.lnk" >nul 2>&1
    echo 已删除桌面快捷方式
)
if exist "%USERPROFILE%\Desktop\tuding.lnk" (
    del "%USERPROFILE%\Desktop\tuding.lnk" >nul 2>&1
    echo 已删除桌面快捷方式(tuding)
)

if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\图钉.lnk" (
    del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\图钉.lnk" >nul 2>&1
    echo 已删除开始菜单快捷方式
)
if exist "%APPDATA%\Microsoft\Windows\Start Menu\Programs\tuding.lnk" (
    del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\tuding.lnk" >nul 2>&1
    echo 已删除开始菜单快捷方式(tuding)
)

echo [8/8] 正在清理注册表...
reg delete "HKCU\Software\tuding" /f >nul 2>&1
reg delete "HKCU\Software\Tuding" /f >nul 2>&1
reg delete "HKCU\Software\图钉" /f >nul 2>&1
reg delete "HKLM\Software\tuding" /f >nul 2>&1
reg delete "HKLM\Software\Tuding" /f >nul 2>&1
reg delete "HKLM\Software\图钉" /f >nul 2>&1

rem 清理自启动项
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "tuding" /f >nul 2>&1
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "Tuding" /f >nul 2>&1
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "图钉" /f >nul 2>&1
reg delete "HKLM\Software\Microsoft\Windows\CurrentVersion\Run" /v "tuding" /f >nul 2>&1
reg delete "HKLM\Software\Microsoft\Windows\CurrentVersion\Run" /v "Tuding" /f >nul 2>&1
reg delete "HKLM\Software\Microsoft\Windows\CurrentVersion\Run" /v "图钉" /f >nul 2>&1

rem 清理卸载信息
reg delete "HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\com.tuding.app" /f >nul 2>&1
reg delete "HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\图钉" /f >nul 2>&1
reg delete "HKLM\Software\Microsoft\Windows\CurrentVersion\Uninstall\tuding" /f >nul 2>&1

rem 清理文件关联
reg delete "HKLM\Software\Classes\Applications\tuding.exe" /f >nul 2>&1
reg delete "HKLM\Software\Classes\Applications\图钉.exe" /f >nul 2>&1
reg delete "HKLM\Software\Classes\.tuding" /f >nul 2>&1

echo 注册表清理完成

echo.
echo ==========================================
echo 🎉 清理完成！图钉已完全卸载。
echo ==========================================
echo.
echo 已清理的内容：
echo ✓ 程序文件和安装目录
echo ✓ 用户数据和配置文件
echo ✓ 临时文件和缓存
echo ✓ 桌面和开始菜单快捷方式
echo ✓ 注册表项和自启动设置
echo.
echo 感谢您使用图钉！
echo.
pause