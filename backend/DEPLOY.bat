@echo off
chcp 65001 >nul
echo ========================================
echo   Zeta Trading System 一键部署
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] 检查环境变量配置...
if not exist ".env" (
    echo 错误: 未找到 .env 文件
    echo 请复制 .env.example 为 .env 并配置数据库连接
    pause
    exit /b 1
)

echo [2/3] 创建数据库(如果不存在)...
node src\scripts\createDatabase.js
if errorlevel 1 (
    echo 错误: 数据库创建失败
    pause
    exit /b 1
)

echo.
echo [3/3] 初始化数据库结构...
node src\scripts\initDatabase.js
if errorlevel 1 (
    echo 错误: 数据库初始化失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo   部署完成！
echo ========================================
echo.
echo 启动后端服务: npm run dev
echo 启动前端服务: npm run dev (在项目根目录)
echo.
pause