/**
 * 设备 ID 管理器 - 服务端节点版本
 * 负责生成、存储和加载设备唯一标识符
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ulid } from 'ulid';

export class DeviceIdManager {
  private deviceId: string | null = null;
  private configPath: string;
  
  constructor(configDir?: string) {
    // 使用指定的配置目录，或默认使用当前目录的 data 文件夹
    const baseDir = configDir || path.join(process.cwd(), 'data');
    this.configPath = path.join(baseDir, 'device-config.json');
  }
  
  /**
   * 获取或生成设备 ID
   */
  async getDeviceId(): Promise<string> {
    if (this.deviceId) {
      return this.deviceId;
    }
    
    // 尝试从文件加载
    if (fs.existsSync(this.configPath)) {
      try {
        const content = fs.readFileSync(this.configPath, 'utf-8');
        const config = JSON.parse(content);
        
        if (config.deviceId) {
          this.deviceId = config.deviceId;
          console.log('📱 设备 ID 已加载:', this.deviceId);
          return config.deviceId;
        }
      } catch (error) {
        console.error('❌ 读取设备配置失败:', error);
      }
    }
    
    // 生成新的设备 ID
    const newId = this.generateDeviceId();
    this.deviceId = newId;
    await this.saveDeviceId();
    
    console.log('📱 新设备 ID 已生成:', newId);
    return newId;
  }
  
  /**
   * 生成设备 ID
   */
  private generateDeviceId(): string {
    const id = ulid();
    return `device-${id}`;
  }
  
  /**
   * 保存设备 ID 到文件
   */
  private async saveDeviceId(): Promise<void> {
    if (!this.deviceId) {
      throw new Error('No device ID to save');
    }
    
    const config = {
      deviceId: this.deviceId,
      createdAt: new Date().toISOString(),
      platform: process.platform,
      hostname: os.hostname(),
      nodeVersion: process.version
    };
    
    try {
      // 确保目录存在
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // 写入文件
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
      console.log('✅ 设备配置已保存:', this.configPath);
    } catch (error) {
      console.error('❌ 保存设备配置失败:', error);
      throw error;
    }
  }
  
  /**
   * 获取设备信息
   */
  getDeviceInfo(): {
    deviceId: string | null;
    platform: string;
    hostname: string;
    nodeVersion: string;
  } {
    return {
      deviceId: this.deviceId,
      platform: process.platform,
      hostname: os.hostname(),
      nodeVersion: process.version
    };
  }
  
  /**
   * 重置设备 ID
   */
  async resetDeviceId(): Promise<string> {
    this.deviceId = null;
    
    // 删除配置文件
    if (fs.existsSync(this.configPath)) {
      fs.unlinkSync(this.configPath);
      console.log('🗑️  设备配置已删除');
    }
    
    // 生成新 ID
    return await this.getDeviceId();
  }
}

/**
 * 便捷函数：获取设备 ID
 */
let _deviceIdManager: DeviceIdManager | null = null;

export async function getDeviceId(configDir?: string): Promise<string> {
  if (!_deviceIdManager) {
    _deviceIdManager = new DeviceIdManager(configDir);
  }
  return await _deviceIdManager.getDeviceId();
}

export function getDeviceInfo(configDir?: string) {
  if (!_deviceIdManager) {
    _deviceIdManager = new DeviceIdManager(configDir);
  }
  return _deviceIdManager.getDeviceInfo();
}
