/**
 * P2P 节点核心类
 * 封装 CRSQLite 同步管理器和传输层
 */

import { CRSQLiteSyncManager } from '../core/crsqlite-sync-manager';
import { CRSQLiteTransport } from './CRSQLiteTransport';
import { DatabaseManager } from '../core/db-manager';
import type {
  SyncConfig,
  SyncMessage,
  SyncRequestMessage,
  SyncResponseMessage,
  ChangesMessage,
  PingMessage,
  TransportType
} from '../types/crsqlite-sync';

export interface P2PNodeConfig {
  deviceId: string;
  deviceName: string;
  deviceType: 'server' | 'desktop' | 'mobile';
  workspaceId: string;
  signalingUrl: string;
  relayUrl: string;
  serverUrl: string;
  authToken?: string;
}

export class P2PNode {
  private syncManager: CRSQLiteSyncManager;
  private transport: CRSQLiteTransport;
  private isRunning = false;
  private syncStats = {
    messagesSent: 0,
    messagesReceived: 0,
    changesSent: 0,
    changesReceived: 0,
    syncCount: 0,
    errors: 0
  };
  
  constructor(
    private dbManager: DatabaseManager,
    private config: P2PNodeConfig
  ) {
    // 初始化同步管理器
    this.syncManager = new CRSQLiteSyncManager(dbManager);
    
    // 配置传输层
    const syncConfig: SyncConfig & { workspaceId?: string } = {
      preferWebRTC: false,           // Node.js 版本不使用 WebRTC
      fallbackToRelay: true,         // 只使用中继
      signalingUrl: config.signalingUrl,
      relayUrl: config.relayUrl,
      workspaceId: config.workspaceId,  // 添加 workspaceId
      syncInterval: 30000,           // 30秒同步一次
      batchSize: 1000,               // 每批次1000条变更
      maxRetries: 3,
      heartbeatInterval: 30000,      // 30秒心跳
      heartbeatTimeout: 90000,       // 90秒超时
      enableCompression: true,       // 启用压缩
      compressionThreshold: 1024,    // 1KB 阈值
      getAuthToken: async () => config.authToken || 'anonymous'
    };
    
    // 初始化传输层
    this.transport = new CRSQLiteTransport(
      this.syncManager,
      config.deviceId,
      syncConfig
    );
    
    // 注册消息处理器
    this.transport.onMessage((message, from, transport) => {
      this.handleMessage(message, from, transport);
    });
  }
  
  /**
   * 启动 P2P 节点
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ P2P node already running');
      return;
    }
    
    try {
      console.log('');
      console.log('═══════════════════════════════════════════════════');
      console.log('  🔌 Starting P2P Node  ');
      console.log('═══════════════════════════════════════════════════');
      console.log('');
      
      console.log('📋 Node Configuration:');
      console.log(`   Device ID: ${this.config.deviceId}`);
      console.log(`   Device Name: ${this.config.deviceName}`);
      console.log(`   Device Type: ${this.config.deviceType}`);
      console.log(`   Workspace ID: ${this.config.workspaceId}`);
      console.log(`   Site ID: ${this.syncManager.getSiteId()}`);
      console.log('');
      
      // 初始化传输层
      await this.transport.initialize();
      
      this.isRunning = true;
      
      console.log('');
      console.log('═══════════════════════════════════════════════════');
      console.log('  ✅ P2P Node Online  ');
      console.log('═══════════════════════════════════════════════════');
      console.log('');
      console.log('💡 节点现在可以接受其他客户端的同步请求');
      console.log('');
      
    } catch (error) {
      console.error('❌ Failed to start P2P node:', error);
      throw error;
    }
  }
  
  /**
   * 停止 P2P 节点
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    console.log('');
    console.log('🛑 Stopping P2P node...');
    
    this.transport.disconnect();
    this.isRunning = false;
    
    console.log('✅ P2P node stopped');
    console.log('');
  }
  
  /**
   * 处理接收到的消息
   */
  private handleMessage(message: SyncMessage, from: string, transport: TransportType): void {
    try {
      this.syncStats.messagesReceived++;
      
      console.log(`[${new Date().toLocaleTimeString()}] 📨 Received ${message.type} from ${from.substring(0, 8)}... via ${transport}`);
      
      switch (message.type) {
        case 'sync-request':
          this.handleSyncRequest(message as SyncRequestMessage, from);
          break;
          
        case 'sync-response':
          this.handleSyncResponse(message as SyncResponseMessage, from);
          break;
          
        case 'changes':
          this.handleChanges(message as ChangesMessage, from);
          break;
          
        case 'ping':
          this.handlePing(message as PingMessage, from);
          break;
          
        case 'pong':
          // 心跳响应，记录延迟
          const latency = Date.now() - message.timestamp;
          console.log(`💓 Pong from ${from.substring(0, 8)}... latency: ${latency}ms`);
          break;
          
        case 'ack':
          console.log(`✅ Ack from ${from.substring(0, 8)}...`);
          break;
          
        default:
          console.warn(`⚠️ Unknown message type: ${(message as any).type}`);
      }
      
    } catch (error) {
      console.error('❌ Error handling message:', error);
      this.syncStats.errors++;
    }
  }
  
  /**
   * 处理同步请求
   */
  private handleSyncRequest(message: SyncRequestMessage, from: string): void {
    try {
      console.log(`📤 Processing sync request from ${from.substring(0, 8)}... (from version ${message.data.fromVersion})`);
      
      // 获取变更
      const changes = this.syncManager.getChangesSince(
        message.data.fromVersion,
        message.data.tables
      );
      
      const currentVersion = this.syncManager.getCurrentVersion();
      
      // 发送响应
      const response: SyncResponseMessage = {
        type: 'sync-response',
        from: this.config.deviceId,
        to: from,
        timestamp: Date.now(),
        data: {
          fromVersion: message.data.fromVersion,
          toVersion: currentVersion,
          changes: changes,
          hasMore: false,
          siteId: this.syncManager.getSiteId()
        }
      };
      
      this.transport.sendMessage(from, response);
      this.syncStats.messagesSent++;
      this.syncStats.changesSent += changes.length;
      this.syncStats.syncCount++;
      
      console.log(`✅ Sent ${changes.length} changes to ${from.substring(0, 8)}... (version ${currentVersion})`);
      
    } catch (error) {
      console.error('❌ Error handling sync request:', error);
      this.syncStats.errors++;
    }
  }
  
  /**
   * 处理同步响应
   */
  private handleSyncResponse(message: SyncResponseMessage, from: string): void {
    try {
      const { changes, fromVersion, toVersion } = message.data;
      
      console.log(`📥 Received ${changes.length} changes from ${from.substring(0, 8)}... (v${fromVersion} -> v${toVersion})`);
      
      if (changes.length > 0) {
        // 应用变更
        const applied = this.syncManager.applyChanges(changes);
        this.syncStats.changesReceived += applied;
        
        console.log(`✅ Applied ${applied}/${changes.length} changes`);
        
        // 发送确认
        this.transport.sendMessage(from, {
          type: 'ack',
          from: this.config.deviceId,
          to: from,
          timestamp: Date.now(),
          data: {
            messageId: message.timestamp.toString(),
            success: true
          }
        });
        this.syncStats.messagesSent++;
      }
      
    } catch (error) {
      console.error('❌ Error handling sync response:', error);
      this.syncStats.errors++;
    }
  }
  
  /**
   * 处理增量变更
   */
  private handleChanges(message: ChangesMessage, from: string): void {
    try {
      const { changes } = message.data;
      
      console.log(`📥 Received ${changes.length} incremental changes from ${from.substring(0, 8)}...`);
      
      if (changes.length > 0) {
        const applied = this.syncManager.applyChanges(changes);
        this.syncStats.changesReceived += applied;
        
        console.log(`✅ Applied ${applied}/${changes.length} changes`);
      }
      
    } catch (error) {
      console.error('❌ Error handling changes:', error);
      this.syncStats.errors++;
    }
  }
  
  /**
   * 处理心跳
   */
  private handlePing(message: PingMessage, from: string): void {
    try {
      // 回复 pong
      this.transport.sendMessage(from, {
        type: 'pong',
        from: this.config.deviceId,
        to: from,
        timestamp: Date.now(),
        data: {
          timestamp: message.data.timestamp,
          latency: Date.now() - message.data.timestamp
        }
      });
      
    } catch (error) {
      console.error('❌ Error handling ping:', error);
    }
  }
  
  /**
   * 获取节点状态
   */
  getStatus() {
    const transportStats = this.transport.getTransportStats();
    const changeStats = this.syncManager.getChangeStats();
    const currentVersion = this.syncManager.getCurrentVersion();
    
    return {
      isRunning: this.isRunning,
      deviceId: this.config.deviceId,
      siteId: this.syncManager.getSiteId(),
      
      // 连接状态
      connections: {
        ...transportStats,
        devices: this.transport.getConnectedDevices()
      },
      
      // 数据库状态
      database: {
        version: currentVersion,
        totalChanges: changeStats.totalChanges,
        oldestVersion: changeStats.oldestVersion,
        newestVersion: changeStats.newestVersion,
        tables: changeStats.tables
      },
      
      // 同步统计
      stats: {
        ...this.syncStats,
        uptime: this.isRunning ? Date.now() : 0
      }
    };
  }
  
  /**
   * 打印状态报告
   */
  printStatus(): void {
    const status = this.getStatus();
    
    console.log('');
    console.log('═══════════════════════════════════════════════════');
    console.log('  📊 P2P Node Status Report  ');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    
    console.log('🔌 Connection:');
    console.log(`   Status: ${status.isRunning ? '🟢 Online' : '🔴 Offline'}`);
    console.log(`   Transport: ${status.connections.isConnected ? '✅ Connected' : '❌ Disconnected'}`);
    console.log(`   Connected Devices: ${status.connections.totalConnections}`);
    console.log('');
    
    console.log('📊 Database:');
    console.log(`   Current Version: ${status.database.version}`);
    console.log(`   Total Changes: ${status.database.totalChanges}`);
    console.log(`   Version Range: ${status.database.oldestVersion} - ${status.database.newestVersion}`);
    console.log('');
    
    console.log('📈 Sync Statistics:');
    console.log(`   Messages Sent: ${status.stats.messagesSent}`);
    console.log(`   Messages Received: ${status.stats.messagesReceived}`);
    console.log(`   Changes Sent: ${status.stats.changesSent}`);
    console.log(`   Changes Received: ${status.stats.changesReceived}`);
    console.log(`   Sync Count: ${status.stats.syncCount}`);
    console.log(`   Errors: ${status.stats.errors}`);
    console.log('');
    
    if (status.database.tables.length > 0) {
      console.log('📋 Top Tables:');
      const topTables = status.database.tables.slice(0, 5);
      for (const table of topTables) {
        console.log(`   ${table.table}: ${table.count} changes`);
      }
      console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════');
    console.log('');
  }
}
