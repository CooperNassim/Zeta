@echo off
REM Zeta Trading System 数据库迁移快速脚本 (Windows)
REM 用于一键执行完整的数据库迁移流程

echo =========================================
echo Zeta Trading System 数据库迁移
echo =========================================
echo.

REM 检查Node.js
echo 1. 检查环境...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 Node.js
    pause
    exit /b 1
)
echo [成功] Node.js 已安装

REM 检查依赖
if not exist "node_modules" (
    echo 正在安装依赖...
    call npm install
)
echo [成功] 依赖已就绪

REM 备份数据
echo.
echo 2. 备份数据库...
call npm run backup
if %errorlevel% neq 0 (
    echo [错误] 备份失败
    pause
    exit /b 1
)
echo [成功] 备份完成

REM 执行迁移
echo.
echo 3. 执行数据库迁移...
call node src/scripts/run_migration.js migration_complete_v4.sql
if %errorlevel% neq 0 (
    echo [错误] 迁移失败
    echo 请查看错误信息并恢复备份:
    echo   npm run restore
    pause
    exit /b 1
)
echo [成功] 迁移完成

REM 验证迁移
echo.
echo 4. 验证迁移结果...
call node src/scripts/verify_migration.js
if %errorlevel% neq 0 (
    echo [警告] 验证未完全通过,请检查详细信息
) else (
    echo [成功] 验证通过
)

REM 显示结果
echo.
echo =========================================
echo 数据库迁移成功完成!
echo =========================================
echo.
echo 后续步骤:
echo   1. 启动后端服务: npm run dev
echo   2. 启动前端服务: cd .. ^&^& npm run dev
echo   3. 测试功能是否正常
echo.
echo 如需回滚:
echo   npm run restore
echo.
pause
