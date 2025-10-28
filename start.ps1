# Gestell Node 启动脚本 (Windows)
# 用于快速启动节点

Write-Host "🚀 启动 Gestell Node..." -ForegroundColor Green
Write-Host ""

# 检查是否已安装依赖
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 检测到未安装依赖，正在安装..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# 检查是否已构建
if (-not (Test-Path "dist")) {
    Write-Host "🔨 检测到未构建，正在构建..." -ForegroundColor Yellow
    npm run build
    Write-Host ""
}

# 启动节点
Write-Host "✅ 启动节点..." -ForegroundColor Green
npm start
