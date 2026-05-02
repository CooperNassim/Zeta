#!/bin/bash

echo "========================================"
echo "  Zeta Trading System 一键部署"
echo "========================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "[1/3] 检查环境变量配置..."
if [ ! -f ".env" ]; then
    echo "错误: 未找到 .env 文件"
    echo "请复制 .env.example 为 .env 并配置数据库连接"
    exit 1
fi

echo "[2/3] 创建数据库(如果不存在)..."
node src/scripts/createDatabase.js

echo ""
echo "[3/3] 初始化数据库结构..."
node src/scripts/initDatabase.js

echo ""
echo "========================================"
echo "  部署完成！"
echo "========================================"
echo ""
echo "启动后端服务: npm run dev"
echo "启动前端服务: npm run dev (在项目根目录)"
echo ""