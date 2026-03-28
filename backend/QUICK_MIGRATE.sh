#!/bin/bash

# Zeta Trading System 数据库迁移快速脚本
# 用于一键执行完整的数据库迁移流程

set -e  # 遇到错误立即退出

echo "========================================="
echo "Zeta Trading System 数据库迁移"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查Node.js
echo "1. 检查环境..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到 Node.js${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js 已安装${NC}"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "正在安装依赖..."
    npm install
fi
echo -e "${GREEN}✓ 依赖已就绪${NC}"

# 备份数据
echo ""
echo "2. 备份数据库..."
npm run backup
if [ $? -ne 0 ]; then
    echo -e "${RED}错误: 备份失败${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 备份完成${NC}"

# 执行迁移
echo ""
echo "3. 执行数据库迁移..."
node src/scripts/run_migration.js migration_complete_v4.sql
if [ $? -ne 0 ]; then
    echo -e "${RED}错误: 迁移失败${NC}"
    echo "请查看错误信息并恢复备份:"
    echo "  npm run restore"
    exit 1
fi
echo -e "${GREEN}✓ 迁移完成${NC}"

# 验证迁移
echo ""
echo "4. 验证迁移结果..."
node src/scripts/verify_migration.js
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}警告: 验证未完全通过,请检查详细信息${NC}"
else
    echo -e "${GREEN}✓ 验证通过${NC}"
fi

# 显示结果
echo ""
echo "========================================="
echo -e "${GREEN}数据库迁移成功完成!${NC}"
echo "========================================="
echo ""
echo "后续步骤:"
echo "  1. 启动后端服务: npm run dev"
echo "  2. 启动前端服务: cd .. && npm run dev"
echo "  3. 测试功能是否正常"
echo ""
echo "如需回滚:"
echo "  npm run restore"
echo ""
