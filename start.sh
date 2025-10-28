#!/bin/bash

# Gestell Node 启动脚本
# 用于快速启动节点

echo "🚀 启动 Gestell Node..."
echo ""

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 检测到未安装依赖，正在安装..."
    npm install
    echo ""
fi

# 检查是否已构建
if [ ! -d "dist" ]; then
    echo "🔨 检测到未构建，正在构建..."
    npm run build
    echo ""
fi

# 启动节点
echo "✅ 启动节点..."
npm start
