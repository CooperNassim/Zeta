@echo off
chcp 65001 >nul
echo ========================================
echo   Zeta Trading System 本地部署
echo ========================================
echo.

cd /d "%~dp0"

echo [检查] 确认 PostgreSQL 已安装并运行...
echo.
echo 请确保:
echo   1. PostgreSQL 已安装 (下载地址: https://www.postgresql.org/download/windows/)
echo   2. PostgreSQL 服务已启动
echo   3. 已创建数据库用户和密码
echo.

set /p CONFIRM="是否继续? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo 部署已取消
    pause
    exit /b
)

echo.
echo [1/5] 检查环境变量配置...
if not exist ".env" (
    echo 复制 .env.example 为 .env
    copy .env.example .env
    echo.
    echo 请编辑 .env 文件，设置数据库密码
    echo 注意: 如果 PostgreSQL 密码不是默认密码，请修改
    notepad .env
    echo.
)

echo [2/5] 安装后端依赖...
cd backend
call npm install
if errorlevel 1 (
    echo 错误: 后端依赖安装失败
    pause
    exit /b 1
)

echo.
echo [3/5] 创建数据库...
node src\scripts\createDatabase.js --force
if errorlevel 1 (
    echo 错误: 数据库创建失败
    pause
    exit /b 1
)

echo.
echo [4/5] 初始化数据库...
call npm run init-db
if errorlevel 1 (
    echo 错误: 数据库初始化失败
    pause
    exit /b 1
)

echo.
echo [5/5] 安装前端依赖...
cd ..
call npm install
if errorlevel 1 (
    echo 错误: 前端依赖安装失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo   本地部署完成！
echo ========================================
echo.
echo 启动服务:
echo   终端1 (后端): cd backend ^&^& npm run dev
echo   终端2 (前端): npm run dev
echo.
echo 或使用 Docker 部署: docker-compose up -d
echo.
pause