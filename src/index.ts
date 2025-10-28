/**
 * Gestell Node - 24/7 P2P 同步节点
 * 
 * 一个永不下线的去中心化数据库节点
 * 核心功能：接收并同步来自客户端的数据变更
 */

import 'dotenv/config';
import { DatabaseManager } from './core/db-manager';
import { getDeviceId } from './core/device-id-manager';
import { P2PNode } from './p2p/P2PNode';
import * as path from 'path';

async function bootstrap() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  🚀 Gestell P2P Node Starting...  ');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  
  try {
    // 1. 加载配置
    const config = {
      dbPath: process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'gestell-node.db'),
      signalingUrl: process.env.SIGNALING_URL || '',
      relayUrl: process.env.RELAY_URL || '',
      serverUrl: process.env.SERVER_URL || '',
      workspaceId: process.env.WORKSPACE_ID || 'default-workspace',
      deviceName: process.env.DEVICE_NAME || 'gestell-node',
      deviceType: process.env.DEVICE_TYPE || 'server',
    };
    
    console.log('📋 配置信息:');
    console.log(`   数据库路径: ${config.dbPath}`);
    console.log(`   工作空间ID: ${config.workspaceId}`);
    console.log(`   信令服务器: ${config.signalingUrl}`);
    console.log(`   中继服务器: ${config.relayUrl}`);
    console.log('');
    
    // 2. 初始化数据库
    console.log('📊 正在初始化数据库...');
    const dbManager = new DatabaseManager({
      dbPath: config.dbPath,
      enableWal: true
    });
    await dbManager.initialize();
    console.log('✅ 数据库初始化完成');
    console.log('');
    
    // 3. 获取设备 ID
    const deviceId = await getDeviceId(path.dirname(config.dbPath));
    console.log(`📱 设备信息:`);
    console.log(`   设备 ID: ${deviceId}`);
    console.log(`   设备名称: ${config.deviceName}`);
    console.log(`   设备类型: ${config.deviceType}`);
    console.log('');
    
    // 4. 显示数据库统计
    const dbVersion = dbManager.getCurrentVersion();
    const stats = dbManager.getChangesStats();
    console.log('📈 数据库状态:');
    console.log(`   当前版本: ${dbVersion}`);
    console.log(`   变更记录: ${stats.totalChanges} 条`);
    console.log(`   版本范围: ${stats.oldestVersion} - ${stats.newestVersion}`);
    console.log(`   估算大小: ${(stats.estimatedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log('');
    
    // 5. 启动 P2P 节点
    console.log('🚀 启动 P2P 同步节点...');
    const p2pNode = new P2PNode(dbManager, {
      deviceId,
      deviceName: config.deviceName,
      deviceType: config.deviceType as any,
      workspaceId: config.workspaceId,
      signalingUrl: config.signalingUrl,
      relayUrl: config.relayUrl,
      serverUrl: config.serverUrl,
      authToken: process.env.AUTH_TOKEN || 'anonymous'
    });
    
    await p2pNode.start();
    
    // 6. 设置定期任务
    setupPeriodicTasks(dbManager, p2pNode);
    
    console.log('═══════════════════════════════════════════════════');
    console.log('  ✅ Gestell P2P Node 运行中  ');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('💡 按 Ctrl+C 停止节点');
    console.log('');
    
    // 7. 优雅关闭
    setupGracefulShutdown(dbManager, p2pNode);
    
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════');
    console.error('  ❌ 启动失败  ');
    console.error('═══════════════════════════════════════════════════');
    console.error('');
    console.error('错误详情:', error);
    console.error('');
    process.exit(1);
  }
}

/**
 * 设置定期任务
 */
function setupPeriodicTasks(dbManager: DatabaseManager, p2pNode: P2PNode) {
  // 每 5 分钟输出详细状态
  setInterval(() => {
    p2pNode.printStatus();
  }, 300000); // 5分钟
  
  // 每小时清理旧变更（保留最近7天）
  setInterval(() => {
    const currentVersion = dbManager.getCurrentVersion();
    const sevenDaysAgo = currentVersion - (7 * 24 * 60 * 60 * 1000); // 粗略估算
    
    if (sevenDaysAgo > 0) {
      console.log(`[${new Date().toLocaleTimeString()}] 🧹 开始清理旧变更...`);
      try {
        dbManager.compactChanges(sevenDaysAgo);
      } catch (error) {
        console.error('清理失败:', error);
      }
    }
  }, 3600000); // 每小时
}

/**
 * 设置优雅关闭
 */
function setupGracefulShutdown(dbManager: DatabaseManager, p2pNode: P2PNode) {
  const shutdown = async (signal: string) => {
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log(`  🛑 收到 ${signal} 信号，正在关闭...  `);
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    
    // 打印最终状态
    p2pNode.printStatus();
    
    console.log('🔌 关闭 P2P 连接...');
    await p2pNode.stop();
    console.log('✅ P2P 连接已关闭');
    console.log('');
    
    console.log('📊 最终统计:');
    const stats = dbManager.getChangesStats();
    console.log(`   总变更: ${stats.totalChanges} 条`);
    console.log(`   版本范围: ${stats.oldestVersion} - ${stats.newestVersion}`);
    console.log('');
    
    console.log('🗄️  关闭数据库...');
    dbManager.close();
    console.log('✅ 数据库已关闭');
    console.log('');
    
    console.log('👋 再见！');
    console.log('');
    process.exit(0);
  };
  
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  
  // 捕获未处理的异常
  process.on('uncaughtException', (error) => {
    console.error('');
    console.error('❌❌❌ 未捕获的异常:', error);
    console.error('Stack:', error.stack);
    console.error('');
    shutdown('UNCAUGHT_EXCEPTION');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('');
    console.error('❌❌❌ 未处理的 Promise 拒绝:', reason);
    console.error('Promise:', promise);
    console.error('');
  });
}

// 启动应用
bootstrap().catch((error) => {
  console.error('启动失败:', error);
  process.exit(1);
});
