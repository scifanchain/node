/**
 * CR-SQLite 同步管理器
 * 负责提取和应用 CR-SQLite 变更
 */

import type Database from 'better-sqlite3';
import type { CRSQLiteChange } from '../types/crsqlite-sync';
import { DatabaseManager } from './db-manager';

export class CRSQLiteSyncManager {
  private db: Database.Database;
  private siteId: string | null = null;
  
  constructor(private dbManager: DatabaseManager) {
    this.db = dbManager.getDatabase();
    this.initializeSiteId();
  }
  
  /**
   * 初始化站点ID
   */
  private initializeSiteId(): void {
    try {
      const result = this.db.prepare('SELECT crsql_site_id() as site_id').get() as { site_id: Buffer };
      this.siteId = result.site_id.toString('hex');
      console.log('✅ CR-SQLite Site ID:', this.siteId);
    } catch (error) {
      console.error('❌ Failed to get site ID:', error);
      throw error;
    }
  }
  
  /**
   * 获取站点ID（十六进制字符串）
   */
  getSiteId(): string {
    if (!this.siteId) {
      throw new Error('Site ID not initialized');
    }
    return this.siteId;
  }
  
  /**
   * 获取当前数据库版本
   */
  getCurrentVersion(): number {
    try {
      const result = this.db.prepare('SELECT crsql_db_version() as version').get() as { version: number };
      return result.version;
    } catch (error) {
      console.error('❌ Failed to get current version:', error);
      return 0;
    }
  }
  
  /**
   * 获取自指定版本以来的所有变更
   * 
   * @param version 起始版本号（不包含）
   * @param tables 可选：只获取特定表的变更
   * @returns 变更数组
   */
  getChangesSince(version: number, tables?: string[]): CRSQLiteChange[] {
    try {
      let query = `
        SELECT 
          "table",
          pk,
          cid,
          val,
          col_version,
          db_version,
          site_id,
          cl,
          seq
        FROM crsql_changes
        WHERE db_version > ?
      `;
      
      const params: any[] = [version];
      
      // 如果指定了表，添加表过滤
      if (tables && tables.length > 0) {
        const placeholders = tables.map(() => '?').join(',');
        query += ` AND "table" IN (${placeholders})`;
        params.push(...tables);
      }
      
      query += ' ORDER BY db_version ASC, seq ASC';
      
      const changes = this.db.prepare(query).all(...params) as any[];
      
      // 将 Buffer 转换为数组（便于 JSON 序列化）
      // 注意：Uint8Array 在 JSON.stringify 后会变成 {0: x, 1: y, ...} 格式
      // 所以我们先转换为普通数组 [x, y, z, ...]
      const formattedChanges: CRSQLiteChange[] = changes.map(change => ({
        table: change.table,
        // pk 在数据库中是 BLOB，需要转换为字符串
        pk: Buffer.isBuffer(change.pk) ? change.pk.toString('utf8') : 
            (typeof change.pk === 'string' ? change.pk : JSON.stringify(change.pk)),
        cid: change.cid,
        val: change.val,
        col_version: change.col_version,
        db_version: change.db_version,
        site_id: Array.from(new Uint8Array(change.site_id)) as any, // 转换为普通数组
        cl: change.cl,
        seq: change.seq
      }));
      
      console.log(`📤 Retrieved ${formattedChanges.length} changes since version ${version}`);
      return formattedChanges;
      
    } catch (error) {
      console.error('❌ Failed to get changes:', error);
      throw error;
    }
  }
  
  /**
   * 获取指定版本范围的变更
   * 
   * @param fromVersion 起始版本（不包含）
   * @param toVersion 结束版本（包含）
   * @param tables 可选：只获取特定表的变更
   */
  getChangesInRange(fromVersion: number, toVersion: number, tables?: string[]): CRSQLiteChange[] {
    try {
      let query = `
        SELECT 
          "table",
          pk,
          cid,
          val,
          col_version,
          db_version,
          site_id,
          cl,
          seq
        FROM crsql_changes
        WHERE db_version > ? AND db_version <= ?
      `;
      
      const params: any[] = [fromVersion, toVersion];
      
      if (tables && tables.length > 0) {
        const placeholders = tables.map(() => '?').join(',');
        query += ` AND "table" IN (${placeholders})`;
        params.push(...tables);
      }
      
      query += ' ORDER BY db_version ASC, seq ASC';
      
      const changes = this.db.prepare(query).all(...params) as any[];
      
      // 将 Buffer 转换为数组（便于 JSON 序列化）
      const formattedChanges: CRSQLiteChange[] = changes.map(change => ({
        table: change.table,
        // pk 在数据库中是 BLOB，需要转换为字符串
        pk: Buffer.isBuffer(change.pk) ? change.pk.toString('utf8') : 
            (typeof change.pk === 'string' ? change.pk : JSON.stringify(change.pk)),
        cid: change.cid,
        val: change.val,
        col_version: change.col_version,
        db_version: change.db_version,
        site_id: Array.from(new Uint8Array(change.site_id)) as any, // 转换为普通数组
        cl: change.cl,
        seq: change.seq
      }));
      
      console.log(`📤 Retrieved ${formattedChanges.length} changes from ${fromVersion} to ${toVersion}`);
      return formattedChanges;
      
    } catch (error) {
      console.error('❌ Failed to get changes in range:', error);
      throw error;
    }
  }
  
  /**
   * 应用远程变更
   * CR-SQLite 会自动处理冲突（CRDT 合并）
   * 
   * @param changes 变更数组
   * @returns 成功应用的变更数量
   */
  applyChanges(changes: CRSQLiteChange[]): number {
    if (changes.length === 0) {
      console.log('⚠️ No changes to apply');
      return 0;
    }
    
    try {
      let appliedCount = 0;
      
      // 使用事务确保原子性
      const transaction = this.db.transaction((changes: CRSQLiteChange[]) => {
        const stmt = this.db.prepare(`
          INSERT INTO crsql_changes 
          ("table", pk, cid, val, col_version, db_version, site_id, cl, seq)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        for (const change of changes) {
          try {
            // 验证必需字段
            if (!change.table || change.pk === undefined || change.cid === undefined) {
              console.warn(`⚠️ Invalid change object, missing required fields:`, {
                table: change.table,
                pk: change.pk,
                cid: change.cid
              });
              continue;
            }
            
            // 将 site_id 转换为 Buffer
            // 处理不同的输入格式：Uint8Array, Array, 或序列化的对象
            let siteIdBuffer: Buffer;
            if (Buffer.isBuffer(change.site_id)) {
              siteIdBuffer = change.site_id;
            } else if (change.site_id instanceof Uint8Array) {
              siteIdBuffer = Buffer.from(change.site_id);
            } else if (Array.isArray(change.site_id)) {
              siteIdBuffer = Buffer.from(change.site_id);
            } else if (typeof change.site_id === 'object' && change.site_id !== null) {
              // JSON 序列化后的 Uint8Array 变成了 {0: x, 1: y, ...} 格式
              const values = Object.values(change.site_id);
              siteIdBuffer = Buffer.from(values as number[]);
            } else {
              throw new Error(`Invalid site_id format: ${typeof change.site_id}`);
            }
            
            // 准备参数，确保所有值都存在
            // pk 需要转换为 Buffer（CR-SQLite 期望 BLOB 类型）
            let pkBuffer: Buffer;
            if (typeof change.pk === 'string') {
              // 检查是否是 Buffer 对象的 JSON 字符串格式
              try {
                const parsed = JSON.parse(change.pk);
                if (parsed && parsed.type === 'Buffer' && Array.isArray(parsed.data)) {
                  // 是序列化的 Buffer，直接使用数据
                  pkBuffer = Buffer.from(parsed.data);
                } else {
                  // 普通 JSON 字符串，转换为 Buffer
                  pkBuffer = Buffer.from(change.pk, 'utf8');
                }
              } catch (e) {
                // 不是 JSON，是普通字符串，转换为 Buffer
                pkBuffer = Buffer.from(change.pk, 'utf8');
              }
            } else if (Buffer.isBuffer(change.pk)) {
              pkBuffer = change.pk;
            } else {
              // 其他类型，转换为 JSON 字符串再转 Buffer
              pkBuffer = Buffer.from(JSON.stringify(change.pk), 'utf8');
            }
            
            const params = [
              change.table,
              pkBuffer,
              change.cid,
              change.val ?? null,  // val 可以为 null
              change.col_version,
              change.db_version,
              siteIdBuffer,
              change.cl,
              change.seq
            ];
            
            // 验证参数数量
            if (params.length !== 9) {
              console.error(`❌ Invalid parameter count: ${params.length}, expected 9`, change);
              continue;
            }
            
            stmt.run(...params);
            
            appliedCount++;
          } catch (error) {
            // CR-SQLite 可能会拒绝某些变更（例如已有更新的版本）
            console.warn(`⚠️ Failed to apply change for ${change.table}.${change.cid}:`, error);
            console.debug('Change object:', JSON.stringify(change, null, 2));
          }
        }
      });
      
      transaction(changes);
      
      console.log(`✅ Applied ${appliedCount}/${changes.length} changes`);
      return appliedCount;
      
    } catch (error) {
      console.error('❌ Failed to apply changes:', error);
      throw error;
    }
  }
  
  /**
   * 压缩变更日志
   * 删除指定版本之前的变更记录，释放空间
   * 
   * @param beforeVersion 删除此版本之前的变更
   */
  compactChanges(beforeVersion: number): void {
    try {
      const result = this.db.prepare(`
        DELETE FROM crsql_changes 
        WHERE db_version < ?
      `).run(beforeVersion);
      
      console.log(`🗑️ Compacted ${result.changes} changes before version ${beforeVersion}`);
      
      // VACUUM 回收空间（可选，耗时较长）
      // this.db.prepare('VACUUM').run();
      
    } catch (error) {
      console.error('❌ Failed to compact changes:', error);
      throw error;
    }
  }
  
  /**
   * 获取变更统计信息
   */
  getChangeStats(): {
    totalChanges: number;
    oldestVersion: number;
    newestVersion: number;
    tables: { table: string; count: number }[];
  } {
    try {
      // 总变更数
      const totalResult = this.db.prepare('SELECT COUNT(*) as count FROM crsql_changes').get() as { count: number };
      
      // 版本范围
      const versionResult = this.db.prepare(`
        SELECT 
          MIN(db_version) as oldest,
          MAX(db_version) as newest
        FROM crsql_changes
      `).get() as { oldest: number | null; newest: number | null };
      
      // 按表统计
      const tableResults = this.db.prepare(`
        SELECT 
          "table",
          COUNT(*) as count
        FROM crsql_changes
        GROUP BY "table"
        ORDER BY count DESC
      `).all() as { table: string; count: number }[];
      
      return {
        totalChanges: totalResult.count,
        oldestVersion: versionResult.oldest ?? 0,
        newestVersion: versionResult.newest ?? 0,
        tables: tableResults
      };
      
    } catch (error) {
      console.error('❌ Failed to get change stats:', error);
      return {
        totalChanges: 0,
        oldestVersion: 0,
        newestVersion: 0,
        tables: []
      };
    }
  }
  
  /**
   * 检查是否有待同步的变更
   * 
   * @param sinceVersion 检查此版本之后是否有变更
   */
  hasChanges(sinceVersion: number): boolean {
    try {
      const result = this.db.prepare(`
        SELECT COUNT(*) as count 
        FROM crsql_changes 
        WHERE db_version > ?
        LIMIT 1
      `).get(sinceVersion) as { count: number };
      
      return result.count > 0;
    } catch (error) {
      console.error('❌ Failed to check for changes:', error);
      return false;
    }
  }
  
  /**
   * 清空所有变更日志（危险操作！）
   */
  clearAllChanges(): void {
    try {
      const result = this.db.prepare('DELETE FROM crsql_changes').run();
      console.log(`🗑️ Cleared all ${result.changes} changes`);
    } catch (error) {
      console.error('❌ Failed to clear changes:', error);
      throw error;
    }
  }
}
