#!/bin/bash

echo "========================================"
echo "  Zeta Trading System 本地部署"
echo "========================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[检查] 确认 PostgreSQL 已安装并运行..."
echo ""
echo "请确保:"
echo "  1. PostgreSQL 已安装"
echo "     Mac: brew install postgresql@14"
echo "     Ubuntu: sudo apt-get install postgresql postgresql-contrib"
echo "  2. PostgreSQL 服务已启动"
echo "     Mac: brew services start postgresql@14"
echo "     Ubuntu: sudo systemctl start postgresql"
echo "  3. 已创建数据库用户和密码"
echo ""

read -p "是否继续? (Y/N): " CONFIRM
if [ "$CONFIRM" != "Y" ] && [ "$CONFIRM" != "y" ]; then
    echo "部署已取消"
    exit 1
fi

echo ""
echo "[1/5] 检查环境变量配置..."
if [ ! -f ".env" ]; then
    echo "复制 .env.example 为 .env"
    cp .env.example .env
    echo ""
    echo "请编辑 .env 文件，设置数据库密码"
    echo "注意: 如果 PostgreSQL 密码不是默认密码，请修改"
    echo ""
    read -p "按 Enter 继续..." dummy
fi

echo "[2/5] 安装后端依赖..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "错误: 后端依赖安装失败"
    exit 1
fi

echo ""
echo "[3/5] 创建数据库..."
node src/scripts/createDatabase.js --force
if [ $? -ne 0 ]; then
    echo "错误: 数据库创建失败"
    exit 1
fi

echo ""
echo "[4/5] 初始化数据库..."
npm run init-db
if [ $? -ne 0 ]; then
    echo "错误: 数据库初始化失败"
    exit 1
fi

echo ""
echo "[5/5] 安装前端依赖..."
cd ..
npm install
if [ $? -ne 0 ]; then
    echo "错误: 前端依赖安装失败"
    exit 1
fi

echo ""
echo "========================================"
echo "  本地部署完成！"
echo "========================================"
echo ""
echo "启动服务:"
echo "  终端1 (后端): cd backend && npm run dev"
echo "  终端2 (前端): npm run dev"
echo ""
echo "或使用 Docker 部署: docker-compose up -d"
echo ""