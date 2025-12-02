#!/bin/bash

# 部署脚本 - 将 dist 目录推送到远程服务器
# 目标服务器: 10.10.10.1:22
# 目标路径: /Users/xieyt/Develop/docker-data/nginx-data/nginx-1.27.5/html/image-gen-demo

set -e  # 遇到错误立即退出

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 配置变量
REMOTE_USER="xieyt"
REMOTE_HOST="10.10.10.1"
REMOTE_PORT="22"
REMOTE_PATH="/Users/xieyt/Develop/docker-data/nginx-data/nginx-1.27.5/html/image-gen-demo"
LOCAL_DIST="./dist"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}开始部署流程...${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# 1. 检查是否有未提交的代码
echo -e "${YELLOW}[1/3] 检查 Git 状态...${NC}"

if [ ! -d ".git" ]; then
    echo -e "${RED}错误: 当前目录不是 Git 仓库！${NC}"
    exit 1
fi

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${RED}错误: 发现未提交的代码！${NC}"
    echo ""
    echo -e "${YELLOW}未提交的更改:${NC}"
    git status --short
    echo ""
    echo -e "${YELLOW}请先提交或暂存您的更改:${NC}"
    echo "  git add ."
    echo "  git commit -m \"your commit message\""
    exit 1
fi

echo -e "${GREEN}✓ Git 状态检查通过 - 没有未提交的代码${NC}"
echo ""

# 2. 构建项目
echo -e "${YELLOW}[2/3] 构建项目...${NC}"

# 删除旧的 dist 目录
if [ -d "$LOCAL_DIST" ]; then
    echo -e "${YELLOW}删除旧的 dist 目录...${NC}"
    rm -rf "$LOCAL_DIST"
fi

# 执行构建
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}错误: 构建失败！${NC}"
    exit 1
fi

# 检查构建后的 dist 目录
if [ ! -d "$LOCAL_DIST" ]; then
    echo -e "${RED}错误: 构建后 dist 目录不存在！${NC}"
    exit 1
fi

if [ -z "$(ls -A $LOCAL_DIST)" ]; then
    echo -e "${RED}错误: 构建后 dist 目录为空！${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 项目构建成功${NC}"
echo ""

# 3. 部署到服务器
echo -e "${YELLOW}[3/3] 部署到远程服务器...${NC}"

# 提示用户输入密码
echo -e "${YELLOW}即将连接到 ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PORT}${NC}"
echo -e "${YELLOW}目标路径: ${REMOTE_PATH}${NC}"
echo ""

# 使用 rsync 同步文件
# -a: 归档模式，保留权限、时间戳等
# -v: 详细模式
# -z: 压缩传输
# --delete: 删除目标目录中源目录没有的文件
# --progress: 显示进度
echo -e "${YELLOW}开始同步文件...${NC}"

rsync -avz --delete --progress \
    -e "ssh -p ${REMOTE_PORT}" \
    "${LOCAL_DIST}/" \
    "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/"

# 检查 rsync 是否成功
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ 部署成功！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${YELLOW}远程路径: ${REMOTE_PATH}${NC}"
else
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}✗ 部署失败！${NC}"
    echo -e "${RED}========================================${NC}"
    exit 1
fi
