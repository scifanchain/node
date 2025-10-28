FROM node:18-alpine

WORKDIR /app

# 安装构建工具（better-sqlite3 需要）
RUN apk add --no-cache python3 make g++

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建 TypeScript
RUN npm run build

# 创建数据目录
RUN mkdir -p /app/data

# 清理构建工具
RUN apk del python3 make g++

# 环境变量
ENV NODE_ENV=production
ENV DATABASE_PATH=/app/data/gestell-node.db

# 运行
CMD ["node", "dist/index.js"]
