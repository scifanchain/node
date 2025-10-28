/**
 * CR-SQLite 混合传输层 (Node.js 版本)
 * 支持 WebRTC P2P 和 WebSocket 中继两种传输方式
 * 
 * 主要改动：移除了浏览器相关依赖，适配 Node.js 环境
 */

import type {
  SyncMessage,
  SyncRequestMessage,
  TransportType,
  SyncConfig,
} from '../types/crsqlite-sync';
import { CRSQLiteSyncManager } from '../core/crsqlite-sync-manager';
import * as zlib from 'zlib';
import { promisify } from 'util';
import WebSocket from 'ws';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

type MessageHandler = (message: SyncMessage, from: string, transport: TransportType) => void;

/**
 * 对等设备连接
 */
interface PeerConnection {
  deviceId: string;
  transport: TransportType;
  relayWs?: WebSocket;              // WebSocket 中继连接
  lastActivity: number;             // 最后活动时间
  retryCount: number;               // 重试次数
}

export class CRSQLiteTransport {
  private connections = new Map<string, PeerConnection>();
  private messageHandlers: MessageHandler[] = [];
  private relayWs: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnected = false;
  private workspaceId: string;
  
  constructor(
    private syncManager: CRSQLiteSyncManager,
    private deviceId: string,
    private config: SyncConfig & { workspaceId?: string }
  ) {
    this.workspaceId = config.workspaceId || 'default-workspace';
  }
  
  /**
   * 初始化传输层（Node.js 版本只使用 WebSocket 中继）
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing CR-SQLite transport (Node.js mode)...');
    
    // 获取认证令牌
    const token = await this.config.getAuthToken();
    
    // Node.js 环境只使用中继模式
    await this.initRelay(token);
    
    // 启动心跳
    this.startHeartbeat();
  }
  
  /**
   * 初始化 WebSocket 中继
   */
  private async initRelay(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 使用与 gestell-client 相同的 URL 格式
        const url = `${this.config.relayUrl}?deviceId=${this.deviceId}&workspaceId=${this.config.workspaceId || 'default-workspace'}`;
        console.log('🔌 Connecting to relay:', this.config.relayUrl);
        
        this.relayWs = new WebSocket(url);
        
        this.relayWs.on('open', () => {
          console.log('✅ WebSocket relay connected');
          this.isConnected = true;
          resolve();
        });
        
        this.relayWs.on('message', (data: WebSocket.Data) => {
          this.handleRelayMessage(data);
        });
        
        this.relayWs.on('error', (error) => {
          console.error('❌ WebSocket relay error:', error);
          this.isConnected = false;
          reject(error);
        });
        
        this.relayWs.on('close', () => {
          console.warn('⚠️ WebSocket relay closed, attempting to reconnect...');
          this.isConnected = false;
          this.attemptReconnect();
        });
        
      } catch (error) {
        console.error('❌ Failed to initialize relay:', error);
        reject(error);
      }
    });
  }
  
  /**
   * 连接到指定设备（中继模式）
   */
  async connectToDevice(deviceId: string): Promise<void> {
    if (this.connections.has(deviceId)) {
      console.log('Already connected to', deviceId);
      return;
    }
    
    if (this.relayWs) {
      this.connectViaRelay(deviceId);
    } else {
      console.error('❌ Relay WebSocket not available');
    }
  }
  
  /**
   * 通过中继连接设备
   */
  private connectViaRelay(deviceId: string): void {
    if (!this.relayWs) {
      console.error('❌ Relay WebSocket not available');
      return;
    }
    
    // 在中继模式下，连接是透明的，只需记录即可
    let peerConn = this.connections.get(deviceId);
    if (!peerConn) {
      peerConn = {
        deviceId,
        transport: 'relay',
        lastActivity: Date.now(),
        retryCount: 0
      };
      this.connections.set(deviceId, peerConn);
    }
    
    peerConn.transport = 'relay';
    peerConn.relayWs = this.relayWs;
    peerConn.lastActivity = Date.now();
    
    console.log('✅ Connected to', deviceId, 'via relay');
    
    // 请求同步
    this.requestSync(deviceId);
  }
  
  /**
   * 处理中继消息
   */
  private handleRelayMessage(data: WebSocket.Data): void {
    try {
      const text = data.toString();
      let message = JSON.parse(text) as SyncMessage;
      
      // 解压缩（如果需要）
      if (message.compressed && message.data && typeof message.data === 'string') {
        this.decompress(message.data).then(decompressed => {
          message = { ...message, data: decompressed, compressed: false };
          this.handleMessage(message, message.from, 'relay');
        }).catch(error => {
          console.error('❌ Failed to decompress message:', error);
        });
      } else {
        this.handleMessage(message, message.from, 'relay');
      }
      
    } catch (error) {
      console.error('❌ Failed to parse relay message:', error);
    }
  }
  
  /**
   * 处理接收到的消息
   */
  private handleMessage(data: any, from: string, transport: TransportType): void {
    try {
      const message = data as SyncMessage;
      
      // 更新连接活动时间
      const conn = this.connections.get(from);
      if (conn) {
        conn.lastActivity = Date.now();
      }
      
      // 调用所有消息处理器
      for (const handler of this.messageHandlers) {
        handler(message, from, transport);
      }
      
    } catch (error) {
      console.error('❌ Failed to handle message:', error);
    }
  }
  
  /**
   * 发送消息
   */
  async sendMessage(to: string, message: SyncMessage): Promise<void> {
    const conn = this.connections.get(to);
    if (!conn) {
      console.error('❌ No connection to device:', to);
      return;
    }
    
    // 压缩（如果需要）
    let messageToSend = message;
    if (this.config.enableCompression) {
      const size = JSON.stringify(message).length;
      if (size > this.config.compressionThreshold) {
        try {
          const compressed = await this.compress(message.data);
          messageToSend = { ...message, data: compressed as any, compressed: true };
        } catch (error) {
          console.error('❌ Compression failed:', error);
        }
      }
    }
    
    // 通过中继发送
    if (this.relayWs?.readyState === WebSocket.OPEN) {
      this.relayWs.send(JSON.stringify(messageToSend));
    } else {
      console.error('❌ Relay WebSocket not ready');
    }
  }
  
  /**
   * 广播消息给所有连接的设备
   */
  async broadcastMessage(message: SyncMessage): Promise<void> {
    for (const [deviceId] of this.connections) {
      await this.sendMessage(deviceId, message);
    }
  }
  
  /**
   * 请求同步
   */
  private requestSync(deviceId: string): void {
    const currentVersion = this.syncManager.getCurrentVersion();
    const siteId = this.syncManager.getSiteId();
    
    const message: SyncRequestMessage = {
      type: 'sync-request',
      from: this.deviceId,
      to: deviceId,
      timestamp: Date.now(),
      data: {
        fromVersion: 0,  // 请求所有变更
        siteId
      }
    };
    
    this.sendMessage(deviceId, message);
    console.log('📤 Sync request sent to', deviceId);
  }
  
  /**
   * 压缩数据 (使用gzip)
   */
  private async compress(data: any): Promise<string> {
    try {
      const json = JSON.stringify(data);
      const compressed = await gzip(Buffer.from(json));
      return compressed.toString('base64');
    } catch (error) {
      console.error('❌ Compression failed:', error);
      return data;
    }
  }
  
  /**
   * 解压缩数据 (使用gzip)
   */
  private async decompress(data: string): Promise<any> {
    try {
      const buffer = Buffer.from(data, 'base64');
      const decompressed = await gunzip(buffer);
      return JSON.parse(decompressed.toString());
    } catch (error) {
      console.error('❌ Decompression failed:', error);
      return data;
    }
  }
  
  /**
   * 注册消息处理器
   */
  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }
  
  /**
   * 处理断开连接
   */
  private handleDisconnect(deviceId: string): void {
    const conn = this.connections.get(deviceId);
    if (!conn) return;
    
    console.log('❌ Device disconnected:', deviceId);
    this.connections.delete(deviceId);
  }
  
  /**
   * 尝试重连
   */
  private attemptReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectTimer = setTimeout(async () => {
      console.log('🔄 Attempting to reconnect...');
      
      try {
        const token = await this.config.getAuthToken();
        await this.initRelay(token);
        
        // 重新连接所有已知设备
        for (const [deviceId] of this.connections) {
          await this.connectToDevice(deviceId);
        }
        
      } catch (error) {
        console.error('❌ Reconnection failed:', error);
        
        // 5秒后重试
        this.attemptReconnect();
      }
    }, 5000);
  }
  
  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      
      for (const [deviceId, conn] of this.connections) {
        // 检查超时
        if (now - conn.lastActivity > this.config.heartbeatTimeout) {
          console.warn('⚠️ Device timeout:', deviceId);
          this.handleDisconnect(deviceId);
          continue;
        }
        
        // 发送心跳
        const message: SyncMessage = {
          type: 'ping',
          from: this.deviceId,
          to: deviceId,
          timestamp: now,
          data: { timestamp: now }
        };
        
        this.sendMessage(deviceId, message);
      }
    }, this.config.heartbeatInterval);
  }
  
  /**
   * 获取连接的设备列表
   */
  getConnectedDevices(): Array<{ deviceId: string; transport: TransportType }> {
    return Array.from(this.connections.values()).map(conn => ({
      deviceId: conn.deviceId,
      transport: conn.transport
    }));
  }
  
  /**
   * 获取传输统计信息
   */
  getTransportStats(): {
    relayConnections: number;
    totalConnections: number;
    isConnected: boolean;
  } {
    return {
      relayConnections: this.connections.size,
      totalConnections: this.connections.size,
      isConnected: this.isConnected
    };
  }
  
  /**
   * 断开所有连接
   */
  disconnect(): void {
    console.log('🛑 Disconnecting all connections...');
    
    // 清理定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    
    // 关闭中继 WebSocket
    if (this.relayWs) {
      this.relayWs.close();
      this.relayWs = null;
    }
    
    this.connections.clear();
    this.isConnected = false;
    console.log('✅ All connections closed');
  }
}
