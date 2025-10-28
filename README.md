# Gestell Node 🚀

**24/7 在线的去中心化数据库节点**

一个永不下线的 P2P 同步节点，用于 Gestell 去中心化写作平台。

---

## 🎯 核心定位

```
Gestell Node 提供 24/7 在线的数据库 P2P 同步

多个Gestell Node节点构成节点池，供客户端随机连接。

```

### 工作原理

```
客户端 A (桌面应用)
    ↓ P2P 同步
Gestell Node (24/7 在线)  ← 本项目
    ↑ P2P 同步
客户端 B (桌面应用)
```

---

## ✨ 特性

- 🗄️ **SQLite + CR-SQLite** - CRDT 数据库，自动冲突解决
- 🔄 **P2P 同步** - 连接到现有 P2P 服务器，接收和广播变更
- 💾 **持久化存储** - 数据永久保存在本地
- 📊 **实时统计** - 监控数据库状态和同步情况
- 🐋 **Docker 支持** - 一键部署
- 🔒 **优雅关闭** - 安全的数据保存机制

---

## 📦 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Node.js** | 18+ | 运行环境 |
| **TypeScript** | 5.9.x | 类型安全 |
| **Better-SQLite3** | 12.x | SQLite 数据库 |
| **CR-SQLite** | 0.16.x | CRDT 同步扩展 |
| **Drizzle ORM** | 0.44.x | 类型安全 ORM |
| **PeerJS** | 1.5.x | P2P 连接 |
| **WebSocket** | 8.x | 实时通信 |

---

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- npm 或 yarn

### 安装

```bash
# 1. 进入项目目录
cd gestell-node

# 2. 安装依赖
npm install

# 3. 复制配置文件
cp .env.example .env

# 4. 编辑配置（可选）
# 编辑 .env 文件，修改数据库路径等配置
```

### 运行

#### 方式 1: 开发模式

```bash
npm run dev
```

#### 方式 2: 生产模式

```bash
# 构建
npm run build

# 运行
npm start
```

#### 方式 3: Docker (推荐)

```bash
# 使用 Docker Compose
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```

---

## ⚙️ 配置说明

### 环境变量 (`.env`)

```bash
# 数据库配置
DATABASE_PATH=./data/gestell-node.db

# P2P 配置（连接到现有服务器）
SIGNALING_URL=ws://106.53.71.197:2026/crsqlite/signal
RELAY_URL=ws://106.53.71.197:2026/crsqlite/relay
SERVER_URL=http://106.53.71.197:2026
WORKSPACE_ID=default-workspace

# 设备信息
DEVICE_NAME=gestell-node-01
DEVICE_TYPE=server
```

### 配置项说明

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_PATH` | 数据库文件路径 | `./data/gestell-node.db` |
| `SIGNALING_URL` | WebRTC 信令服务器 | - |
| `RELAY_URL` | WebSocket 中继服务器 | - |
| `SERVER_URL` | 设备发现 API 地址 | - |
| `WORKSPACE_ID` | 工作空间 ID | `default-workspace` |
| `DEVICE_NAME` | 设备名称 | `gestell-node-01` |
| `DEVICE_TYPE` | 设备类型 | `server` |

---

## 📁 项目结构

```
gestell-node/
├── src/
│   ├── core/                  # 核心模块
│   │   ├── db-manager.ts      # 数据库管理器
│   │   ├── device-id-manager.ts # 设备 ID 管理
│   │   └── ulid.ts            # ULID 生成器
│   │
│   ├── db/                    # 数据库 Schema
│   │   ├── index.ts           # Drizzle 实例
│   │   └── schema.ts          # 表结构定义
│   │
│   ├── p2p/                   # P2P 同步（待实现）
│   │   └── P2PNode.ts         # P2P 节点核心
│   │
│   └── index.ts               # 主入口
│
├── data/                      # 数据目录
│   ├── gestell-node.db        # 数据库文件
│   └── device-config.json     # 设备配置
│
├── dist/                      # 编译输出
├── Dockerfile                 # Docker 配置
├── docker-compose.yml         # Docker Compose 配置
├── package.json               # 项目配置
├── tsconfig.json              # TypeScript 配置
├── .env                       # 环境变量
└── README.md                  # 本文件
```

---

## 🔧 开发指南

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式（自动重启）
npm run dev

# 构建
npm run build

# 清理
npm run clean
```

### 数据库操作

```bash
# 查看数据库状态
# 节点启动后会自动显示统计信息

# 清理旧变更记录
# 节点每小时自动清理（保留7天）
```

### Docker 开发

```bash
# 构建镜像
docker-compose build

# 运行容器
docker-compose up

# 后台运行
docker-compose up -d

# 查看日志
docker-compose logs -f gestell-node

# 进入容器
docker-compose exec gestell-node sh

# 停止容器
docker-compose down

# 清理数据
docker-compose down -v
```

---

## 📊 监控与维护

### 运行状态

节点启动后会显示：

```
═══════════════════════════════════════════════════
  🚀 Gestell P2P Node Starting...  
═══════════════════════════════════════════════════

📋 配置信息:
   数据库路径: ./data/gestell-node.db
   工作空间ID: default-workspace
   信令服务器: ws://106.53.71.197:2026/crsqlite/signal
   中继服务器: ws://106.53.71.197:2026/crsqlite/relay

📊 数据库状态:
   当前版本: 12345
   变更记录: 1000 条
   版本范围: 1 - 12345
   估算大小: 0.50 MB

═══════════════════════════════════════════════════
  ✅ Gestell P2P Node 运行中  
═══════════════════════════════════════════════════
```

### 定期任务

- **每分钟**: 输出数据库状态
- **每小时**: 清理旧变更记录（保留7天）

### 日志查看

```bash
# 开发模式
npm run dev

# Docker
docker-compose logs -f

# 生产模式（重定向到文件）
npm start > logs/node.log 2>&1 &
```

---

## 🐛 故障排查

### 问题: 数据库初始化失败

**原因**: CR-SQLite 扩展未找到

**解决**:
```bash
# 检查扩展是否存在
ls node_modules/@vlcn.io/crsqlite/dist/

# 重新安装
npm rebuild better-sqlite3
npm rebuild @vlcn.io/crsqlite
```

### 问题: 无法连接到 P2P 服务器

**原因**: 网络问题或配置错误

**解决**:
```bash
# 检查网络连接
curl http://106.53.71.197:2026/health

# 检查配置
cat .env | grep URL
```

### 问题: 数据库文件损坏

**原因**: 非正常关闭或磁盘故障

**解决**:
```bash
# 备份数据库
cp data/gestell-node.db data/gestell-node.db.backup

# 检查完整性
sqlite3 data/gestell-node.db "PRAGMA integrity_check;"

# 如需恢复，从备份恢复
```

---

## 🚢 部署指南

### 本地部署

```bash
# 1. 克隆项目
git clone <repo-url>
cd gestell-node

# 2. 安装依赖
npm install

# 3. 配置环境
cp .env.example .env
# 编辑 .env

# 4. 构建
npm run build

# 5. 启动
npm start

# 6. 使用 PM2 守护进程（推荐）
npm install -g pm2
pm2 start dist/index.js --name gestell-node
pm2 save
pm2 startup
```

### Docker 部署

```bash
# 1. 克隆项目
git clone <repo-url>
cd gestell-node

# 2. 配置环境
cp .env.example .env
# 编辑 .env

# 3. 启动
docker-compose up -d

# 4. 检查状态
docker-compose ps
docker-compose logs -f
```

### 服务器部署

```bash
# 1. 上传到服务器
scp -r gestell-node user@server:/path/to/

# 2. SSH 登录
ssh user@server

# 3. 安装依赖
cd /path/to/gestell-node
npm install --production

# 4. 构建
npm run build

# 5. 使用 systemd 管理
sudo nano /etc/systemd/system/gestell-node.service

# 6. 启动服务
sudo systemctl start gestell-node
sudo systemctl enable gestell-node
```

#### systemd 配置示例

```ini
[Unit]
Description=Gestell P2P Node
After=network.target

[Service]
Type=simple
User=gestell
WorkingDirectory=/opt/gestell-node
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

---

## 📝 待办事项

- [ ] 实现 P2P 网络连接
- [ ] 添加 WebSocket 服务器
- [ ] 实现设备发现注册
- [ ] 添加健康检查端点
- [ ] 实现数据备份功能
- [ ] 添加监控指标导出
- [ ] 编写单元测试
- [ ] 编写集成测试

---

## 📄 许可证

MIT License

---

## 🤝 贡献

欢迎贡献代码！请先阅读贡献指南。

---

## 📧 联系方式

- **项目**: Gestell
- **组织**: Scifan Chain
- **仓库**: [GitHub](https://github.com/scifanchain/gestell)

---

**Gestell Node** - 让你的数据永不下线 🌟
