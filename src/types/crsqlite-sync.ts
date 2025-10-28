/**
 * CR-SQLite P2P 同步类型定义
 */

// ==================== CR-SQLite 变更类型 ====================

export interface CRSQLiteChange {
  table: string;         // 表名
  pk: string;            // 主键值（JSON编码）
  cid: string;           // 列名
  val: any;              // 新值
  col_version: number;   // 列版本号
  db_version: number;    // 数据库版本号
  site_id: Uint8Array;   // 站点ID（设备ID）
  cl: number;            // 因果长度
  seq: number;           // 序列号
}

// ==================== 同步消息类型 ====================

export type SyncMessageType = 
  | 'sync-request'      // 请求同步
  | 'sync-response'     // 同步响应
  | 'changes'           // 增量变更
  | 'ack'               // 确认消息
  | 'ping'              // 心跳
  | 'pong';             // 心跳响应

export interface BaseSyncMessage {
  type: SyncMessageType;
  from: string;          // 发送者设备ID
  to?: string;           // 接收者设备ID（空表示广播）
  timestamp: number;     // 时间戳
  messageId?: string;    // 消息ID（用于追踪）
  compressed?: boolean;  // 是否压缩
  checksum?: string;     // 数据校验和
}

export interface SyncRequestMessage extends BaseSyncMessage {
  type: 'sync-request';
  data: {
    fromVersion: number;   // 请求从哪个版本开始的变更
    toVersion?: number;    // 请求到哪个版本（可选）
    siteId: string;        // 请求者的 site_id (hex)
    tables?: string[];     // 只同步特定表（可选）
  };
}

export interface SyncResponseMessage extends BaseSyncMessage {
  type: 'sync-response';
  data: {
    fromVersion: number;
    toVersion: number;
    changes: CRSQLiteChange[];  // 变更数组
    hasMore: boolean;           // 是否还有更多数据
    siteId: string;
  };
}

export interface ChangesMessage extends BaseSyncMessage {
  type: 'changes';
  data: {
    changes: CRSQLiteChange[];
    version: number;
    siteId: string;
  };
}

export interface AckMessage extends BaseSyncMessage {
  type: 'ack';
  data: {
    messageId: string;
    success: boolean;
    error?: string;
  };
}

export interface PingMessage extends BaseSyncMessage {
  type: 'ping';
  data: {
    timestamp: number;
  };
}

export interface PongMessage extends BaseSyncMessage {
  type: 'pong';
  data: {
    timestamp: number;
    latency?: number;
  };
}

export type SyncMessage = 
  | SyncRequestMessage 
  | SyncResponseMessage 
  | ChangesMessage 
  | AckMessage
  | PingMessage
  | PongMessage;

// ==================== 信令消息类型 ====================

export type SignalingMessageType = 
  | 'offer'           // WebRTC Offer
  | 'answer'          // WebRTC Answer
  | 'ice-candidate'   // ICE 候选
  | 'peer-join'       // 对等方加入
  | 'peer-leave';     // 对等方离开

export interface BaseSignalingMessage {
  type: SignalingMessageType;
  from: string;
  to: string;
  timestamp: number;
}

export interface SDPMessage extends BaseSignalingMessage {
  type: 'offer' | 'answer';
  data: {
    sdp: string;
    type: 'offer' | 'answer';
  };
}

export interface ICEMessage extends BaseSignalingMessage {
  type: 'ice-candidate';
  data: {
    candidate: string;
    sdpMLineIndex: number | null;
    sdpMid: string | null;
  };
}

export interface PeerStatusMessage extends BaseSignalingMessage {
  type: 'peer-join' | 'peer-leave';
  data: {
    deviceId: string;
    deviceName: string;
    online: boolean;
  };
}

export type SignalingMessage = SDPMessage | ICEMessage | PeerStatusMessage;

// ==================== 设备信息 ====================

export type DeviceType = 'desktop' | 'mobile' | 'tablet' | 'web';

export interface DeviceCapabilities {
  webrtc: boolean;     // 是否支持 WebRTC
  relay: boolean;      // 是否支持中继
}

export interface DeviceInfo {
  id: string;            // 设备ID
  name: string;          // 设备名称
  type: DeviceType;      // 设备类型
  platform: string;      // 操作系统
  userId: string;        // 所属用户
  workspaceId: string;   // 工作空间ID
  online: boolean;       // 是否在线
  lastSeen: number;      // 最后在线时间（时间戳）
  version: string;       // 应用版本
  capabilities: DeviceCapabilities;
}

export interface RegisterDeviceRequest {
  deviceId: string;
  deviceName: string;
  type: DeviceType;
  platform: string;
  version: string;
  workspaceId: string;
  capabilities: DeviceCapabilities;
}

export interface RegisterDeviceResponse {
  success: boolean;
  deviceId: string;
  token?: string;        // 可选：设备专用令牌
  expiresAt?: number;    // 令牌过期时间
}

// ==================== 连接配置 ====================

export interface ICEServer {
  urls: string | string[];
  username?: string;
  credential?: string;
  credentialType?: 'password' | 'oauth';
}

export interface ICEServersConfig {
  iceServers: ICEServer[];
  ttl: number;  // 配置有效期（秒）
}

// ==================== 同步配置 ====================

export interface SyncConfig {
  // 传输模式
  preferWebRTC: boolean;          // 优先使用 WebRTC
  fallbackToRelay: boolean;       // 是否回退到中继
  
  // 服务器配置
  signalingUrl: string;           // 信令服务器地址
  relayUrl: string;               // 中继服务器地址
  
  // 同步策略
  syncInterval: number;           // 同步间隔（毫秒）
  batchSize: number;              // 批量同步大小
  maxRetries: number;             // 最大重试次数
  
  // 心跳配置
  heartbeatInterval: number;      // 心跳间隔（毫秒）
  heartbeatTimeout: number;       // 心跳超时（毫秒）
  
  // 压缩配置
  enableCompression: boolean;     // 是否启用压缩
  compressionThreshold: number;   // 压缩阈值（字节）
  
  // 认证
  getAuthToken: () => Promise<string>;  // 获取认证令牌
}

// ==================== 同步状态 ====================

export type SyncStatus = 
  | 'disconnected'    // 未连接
  | 'connecting'      // 连接中
  | 'connected'       // 已连接
  | 'syncing'         // 同步中
  | 'synced'          // 已同步
  | 'error';          // 错误

export type TransportType = 
  | 'webrtc'          // WebRTC P2P
  | 'relay'           // WebSocket 中继
  | 'none';           // 未连接

export interface SyncState {
  status: SyncStatus;
  transport: TransportType;
  connectedPeers: string[];
  lastSyncTime: number;
  localVersion: number;
  error?: Error;
}

// ==================== 事件类型 ====================

export interface SyncEventMap {
  'status-change': SyncStatus;
  'transport-change': TransportType;
  'peer-connected': string;
  'peer-disconnected': string;
  'changes-received': CRSQLiteChange[];
  'changes-sent': CRSQLiteChange[];
  'sync-complete': void;
  'error': Error;
}

// ==================== 统计信息 ====================

export interface SyncStats {
  // 连接统计
  uptime: number;                 // 在线时长（秒）
  connections: {
    webrtc: number;               // WebRTC 连接数
    relay: number;                // 中继连接数
    total: number;                // 总连接数
  };
  
  // 传输统计
  bytesSent: number;              // 已发送字节数
  bytesReceived: number;          // 已接收字节数
  messagesSent: number;           // 已发送消息数
  messagesReceived: number;       // 已接收消息数
  
  // 同步统计
  changesSent: number;            // 已发送变更数
  changesReceived: number;        // 已接收变更数
  syncCount: number;              // 同步次数
  lastSyncDuration: number;       // 上次同步耗时（毫秒）
  
  // 错误统计
  errors: {
    connection: number;           // 连接错误
    sync: number;                 // 同步错误
    timeout: number;              // 超时错误
  };
}
