/**
 * 数据库管理器 - 服务端节点版本
 * 
 * 职责：
 * 1. 初始化 SQLite 数据库连接
 * 2. 加载 CR-SQLite 扩展（CRDT 功能）
 * 3. 使用 Drizzle ORM 管理表结构
 * 4. 将表标记为 CRDT 表以支持去中心化同步
 * 5. 提供数据库实例和 Drizzle 实例
 */

import Database from 'better-sqlite3';
import { ulid } from 'ulid';
import * as path from 'path';
import * as fs from 'fs';
import { createDrizzleDB, type DrizzleDB } from '../db';

export interface DatabaseConfig {
  dbPath: string;
  siteId?: string;
  enableWal?: boolean;
}

export interface DatabaseChange {
  table: string;
  pk: string;
  cid: string;
  val: any;
  col_version: number;
  db_version: number;
  site_id: Buffer;
  cl: number;
  seq: number;
}

export class DatabaseManager {
  private db: Database.Database | null = null;
  private drizzle: DrizzleDB | null = null;
  private siteId: string;
  private dbPath: string;
  private config: DatabaseConfig;
  private isInitialized = false;

  // 需要标记为 CRDT 的表
  private readonly CRDT_TABLES = [
    'authors',
    'works',
    'chapters',
    'contents',
    'contentVersions',
    'collaborativeDocuments',
  ];

  constructor(config: DatabaseConfig) {
    this.config = config;
    this.dbPath = config.dbPath;
    this.siteId = config.siteId || this.generateSiteId();
  }

  /**
   * 生成唯一的站点 ID
   */
  private generateSiteId(): string {
    return ulid();
  }

  /**
   * 初始化数据库
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[Database] Database already initialized');
      return;
    }

    try {
      // 1. 确保数据库目录存在
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // 2. 打开数据库连接
      this.db = new Database(this.dbPath, {
        verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
      });

      console.log(`[Database] ✅ Database opened: ${this.dbPath}`);

      // 3. 加载 CR-SQLite 扩展
      await this.loadCRSQLiteExtension();

      // 4. 配置数据库
      if (this.config.enableWal !== false) {
        this.db.pragma('journal_mode = WAL');
        console.log('[Database] ✅ WAL mode enabled');
      }

      // CR-SQLite 不支持外键约束
      this.db.pragma('foreign_keys = OFF');

      // 5. 创建 Drizzle 实例
      this.drizzle = createDrizzleDB(this.db);
      console.log('[Database] ✅ Drizzle ORM initialized');

      // 6. 创建表结构（简化版，不使用迁移）
      await this.createTables();

      // 7. 标记所有表为 CRDT 表
      await this.enableCRDTForTables();

      // 8. 显示站点 ID
      const currentSiteId = this.db.prepare('SELECT crsql_site_id() as site_id').get() as { site_id: Buffer };
      console.log(`[Database] ✅ Site ID: ${currentSiteId.site_id.toString('hex')}`);

      this.isInitialized = true;
      console.log('[Database] 🎉 Database initialized successfully');
    } catch (error) {
      console.error('[Database] ❌ Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * 加载 CR-SQLite 扩展
   */
  private async loadCRSQLiteExtension(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not opened');
    }

    try {
      const extensionPath = this.getCRSQLiteExtensionPath();

      if (!fs.existsSync(extensionPath)) {
        throw new Error(`CR-SQLite extension not found at: ${extensionPath}`);
      }

      this.db.loadExtension(extensionPath);
      console.log('[Database] ✅ CR-SQLite extension loaded');
    } catch (error) {
      console.error('[Database] ❌ Failed to load CR-SQLite extension:', error);
      throw error;
    }
  }

  /**
   * 获取 CR-SQLite 扩展路径（Node.js 版本）
   */
  private getCRSQLiteExtensionPath(): string {
    const platform = process.platform;
    let extensionName: string;

    if (platform === 'win32') {
      extensionName = 'crsqlite.dll';
    } else if (platform === 'darwin') {
      extensionName = 'crsqlite.dylib';
    } else {
      extensionName = 'crsqlite.so';
    }

    // Node.js 环境中查找扩展
    const possiblePaths = [
      // 当前目录的 node_modules
      path.join(process.cwd(), 'node_modules', '@vlcn.io', 'crsqlite', 'dist', extensionName),
      // 全局 node_modules
      path.join(__dirname, '..', '..', 'node_modules', '@vlcn.io', 'crsqlite', 'dist', extensionName),
    ];

    console.log('[Database] 🔍 查找 CR-SQLite 扩展...');
    console.log('[Database] process.cwd():', process.cwd());
    console.log('[Database] __dirname:', __dirname);

    for (const possiblePath of possiblePaths) {
      console.log('[Database] 尝试路径:', possiblePath);
      if (fs.existsSync(possiblePath)) {
        console.log('[Database] ✅ 找到扩展:', possiblePath);
        return possiblePath;
      }
    }

    console.error('[Database] ❌ 未找到 CR-SQLite 扩展，尝试的路径:');
    possiblePaths.forEach(p => console.error('[Database]   -', p));
    return possiblePaths[0];
  }

  /**
   * 创建数据库表（简化版）
   */
  private async createTables(): Promise<void> {
    if (!this.drizzle || !this.db) {
      throw new Error('Drizzle or Database not initialized');
    }

    try {
      console.log('[Database] 📊 Creating database tables...');
      
      // 创建所有需要的表（从 gestell-client 迁移文件）
      const tables = [
        // authors 表
        `CREATE TABLE IF NOT EXISTS authors (
          id TEXT PRIMARY KEY NOT NULL,
          username TEXT DEFAULT '' NOT NULL,
          passwordHash TEXT,
          displayName TEXT,
          email TEXT,
          bio TEXT,
          avatarUrl TEXT,
          walletAddress TEXT,
          publicKey TEXT,
          privateKeyEncrypted TEXT,
          totalWorks INTEGER DEFAULT 0 NOT NULL,
          totalWords INTEGER DEFAULT 0 NOT NULL,
          status TEXT DEFAULT 'active' NOT NULL,
          preferences TEXT,
          lastActiveAt INTEGER,
          createdAt INTEGER DEFAULT 0 NOT NULL,
          updatedAt INTEGER DEFAULT 0 NOT NULL
        )`,
        
        // works 表
        `CREATE TABLE IF NOT EXISTS works (
          id TEXT PRIMARY KEY NOT NULL,
          title TEXT DEFAULT '' NOT NULL,
          subtitle TEXT,
          description TEXT,
          coverImageUrl TEXT,
          genre TEXT,
          tags TEXT,
          authorId TEXT DEFAULT '' NOT NULL,
          collaborationMode TEXT DEFAULT 'solo' NOT NULL,
          collaborators TEXT,
          status TEXT DEFAULT 'draft' NOT NULL,
          progressPercentage REAL DEFAULT 0 NOT NULL,
          totalWords INTEGER DEFAULT 0 NOT NULL,
          totalCharacters INTEGER DEFAULT 0 NOT NULL,
          chapterCount INTEGER DEFAULT 0 NOT NULL,
          targetWords INTEGER,
          targetCompletionDate INTEGER,
          blockchainHash TEXT,
          nftTokenId TEXT,
          nftContractAddress TEXT,
          copyrightHash TEXT,
          isPublic INTEGER DEFAULT 0 NOT NULL,
          licenseType TEXT DEFAULT 'all_rights_reserved' NOT NULL,
          publishedAt INTEGER,
          metadata TEXT,
          createdAt INTEGER DEFAULT 0 NOT NULL,
          updatedAt INTEGER DEFAULT 0 NOT NULL
        )`,
        
        // chapters 表
        `CREATE TABLE IF NOT EXISTS chapters (
          id TEXT PRIMARY KEY NOT NULL,
          workId TEXT DEFAULT '' NOT NULL,
          parentId TEXT,
          level INTEGER DEFAULT 1 NOT NULL,
          orderIndex INTEGER DEFAULT 0 NOT NULL,
          title TEXT DEFAULT '' NOT NULL,
          subtitle TEXT,
          description TEXT,
          type TEXT DEFAULT 'chapter' NOT NULL,
          status TEXT DEFAULT 'draft' NOT NULL,
          wordCount INTEGER DEFAULT 0 NOT NULL,
          characterCount INTEGER DEFAULT 0 NOT NULL,
          contentCount INTEGER DEFAULT 0 NOT NULL,
          childChapterCount INTEGER DEFAULT 0 NOT NULL,
          progressPercentage REAL DEFAULT 0 NOT NULL,
          targetWords INTEGER,
          authorId TEXT DEFAULT '' NOT NULL,
          storyTimelineStart TEXT,
          storyTimelineEnd TEXT,
          tags TEXT,
          blockchainHash TEXT,
          isPublic INTEGER DEFAULT 0 NOT NULL,
          publishedAt INTEGER,
          metadata TEXT,
          createdAt INTEGER DEFAULT 0 NOT NULL,
          updatedAt INTEGER DEFAULT 0 NOT NULL
        )`,
        
        // contents 表
        `CREATE TABLE IF NOT EXISTS contents (
          id TEXT PRIMARY KEY NOT NULL,
          workId TEXT DEFAULT '' NOT NULL,
          chapterId TEXT,
          orderIndex INTEGER DEFAULT 0 NOT NULL,
          title TEXT,
          type TEXT DEFAULT 'text' NOT NULL,
          contentJson TEXT,
          wordCount INTEGER DEFAULT 0 NOT NULL,
          characterCount INTEGER DEFAULT 0 NOT NULL,
          paragraphCount INTEGER DEFAULT 0 NOT NULL,
          status TEXT DEFAULT 'draft' NOT NULL,
          version INTEGER DEFAULT 1 NOT NULL,
          authorId TEXT DEFAULT '' NOT NULL,
          isCollaborative INTEGER DEFAULT 0 NOT NULL,
          contributors TEXT,
          storyTimeline TEXT,
          charactersInvolved TEXT,
          location TEXT,
          sceneDescription TEXT,
          tags TEXT,
          emotionTone TEXT,
          importanceLevel INTEGER DEFAULT 3 NOT NULL,
          contentHash TEXT,
          blockchainTimestamp INTEGER,
          copyrightStatus TEXT DEFAULT 'draft' NOT NULL,
          isPublic INTEGER DEFAULT 0 NOT NULL,
          publishedAt INTEGER,
          writingDuration INTEGER DEFAULT 0 NOT NULL,
          lastEditedAt INTEGER DEFAULT 0 NOT NULL,
          lastEditorId TEXT DEFAULT '' NOT NULL,
          notes TEXT,
          metadata TEXT,
          createdAt INTEGER DEFAULT 0 NOT NULL,
          updatedAt INTEGER DEFAULT 0 NOT NULL
        )`,
        
        // contentVersions 表
        `CREATE TABLE IF NOT EXISTS contentVersions (
          id TEXT PRIMARY KEY NOT NULL,
          contentId TEXT DEFAULT '' NOT NULL,
          contentJson TEXT DEFAULT '' NOT NULL,
          contentHtml TEXT,
          contentText TEXT,
          wordCount INTEGER DEFAULT 0 NOT NULL,
          characterCount INTEGER DEFAULT 0 NOT NULL,
          versionNumber INTEGER DEFAULT 1 NOT NULL,
          changeSummary TEXT,
          authorId TEXT DEFAULT '' NOT NULL,
          blockchainHash TEXT,
          createdAt INTEGER DEFAULT 0 NOT NULL
        )`,
        
        // collaborativeDocuments 表
        `CREATE TABLE IF NOT EXISTS collaborativeDocuments (
          id TEXT PRIMARY KEY NOT NULL,
          contentId TEXT DEFAULT '' NOT NULL,
          workId TEXT DEFAULT '' NOT NULL,
          documentType TEXT DEFAULT 'text' NOT NULL,
          yjsState TEXT,
          stateVector TEXT,
          maxConnections INTEGER DEFAULT 10 NOT NULL,
          lastSyncAt INTEGER,
          createdAt INTEGER DEFAULT 0 NOT NULL,
          updatedAt INTEGER DEFAULT 0 NOT NULL
        )`
      ];
      
      // 执行所有表创建语句
      for (const sql of tables) {
        this.db.prepare(sql).run();
      }
      
      console.log('[Database] ✅ Tables created successfully');
    } catch (error) {
      console.error('[Database] ❌ Failed to create tables:', error);
      throw error;
    }
  }

  /**
   * 为所有表启用 CRDT 功能
   */
  private async enableCRDTForTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not opened');
    }

    console.log(`[Database] 🔄 Enabling CRDT for ${this.CRDT_TABLES.length} tables...`);

    for (const tableName of this.CRDT_TABLES) {
      try {
        // 检查表是否存在
        const tableExists = this.db
          .prepare(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name=?`)
          .get(tableName) as { count: number };

        if (tableExists.count === 0) {
          console.log(`[Database] ⚠️  Table '${tableName}' does not exist, skipping CRDT setup`);
          continue;
        }

        // 检查表是否已经是 CRDT 表
        let isCRDTTable = false;
        try {
          const result = this.db
            .prepare(`SELECT COUNT(*) as count FROM crsql_master WHERE tbl_name = ?`)
            .get(tableName) as { count: number };
          isCRDTTable = result.count > 0;
        } catch (error) {
          isCRDTTable = false;
        }

        if (isCRDTTable) {
          console.log(`[Database] ✅ Table '${tableName}' is already a CRDT table`);
          continue;
        }

        // 标记表为 CRDT 表
        this.db.prepare(`SELECT crsql_as_crr(?)`).get(tableName);
        console.log(`[Database] ✅ Table '${tableName}' marked as CRDT`);
      } catch (error) {
        console.error(`[Database] ❌ Failed to enable CRDT for table '${tableName}':`, error);
      }
    }

    console.log('[Database] 🎉 CRDT setup completed');
  }

  /**
   * 获取 better-sqlite3 数据库实例
   */
  getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * 获取 Drizzle ORM 实例
   */
  getDrizzle(): DrizzleDB {
    if (!this.drizzle) {
      throw new Error('Drizzle not initialized');
    }
    return this.drizzle;
  }

  /**
   * 获取当前数据库版本
   */
  getCurrentVersion(): number {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const result = this.db.prepare(`SELECT crsql_db_version() as version`).get() as { version: number };
    return result.version;
  }

  /**
   * 获取变更记录
   */
  getChanges(sinceVersion: number = 0): DatabaseChange[] {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return this.db
      .prepare(
        `SELECT "table", "pk", "cid", "val", "col_version", "db_version", "site_id", "cl", "seq"
         FROM crsql_changes
         WHERE db_version > ?
         ORDER BY db_version ASC`
      )
      .all(sinceVersion) as DatabaseChange[];
  }

  /**
   * 应用远程变更
   */
  applyChanges(changes: DatabaseChange[]): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare(`
      INSERT INTO crsql_changes 
      ("table", "pk", "cid", "val", "col_version", "db_version", "site_id", "cl", "seq")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const applyBatch = this.db.transaction((changeBatch: DatabaseChange[]) => {
      for (const change of changeBatch) {
        stmt.run(
          change.table,
          change.pk,
          change.cid,
          change.val,
          change.col_version,
          change.db_version,
          change.site_id,
          change.cl,
          change.seq
        );
      }
    });

    applyBatch(changes);
  }

  /**
   * 清理已同步的变更记录
   */
  compactChanges(beforeVersion: number): void {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const beforeCount = this.db
        .prepare('SELECT COUNT(*) as count FROM crsql_changes WHERE db_version < ?')
        .get(beforeVersion) as { count: number };

      console.log(`[Database] 🗑️  准备清理 ${beforeCount.count} 条旧变更记录...`);

      const result = this.db
        .prepare('DELETE FROM crsql_changes WHERE db_version < ?')
        .run(beforeVersion);

      console.log(`[Database] ✅ 已清理 ${result.changes} 条变更记录`);

      this.db.prepare('VACUUM').run();
      console.log('[Database] 🧹 数据库已压缩');
    } catch (error) {
      console.error('[Database] ❌ 清理变更记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取变更记录统计
   */
  getChangesStats(): {
    totalChanges: number;
    oldestVersion: number;
    newestVersion: number;
    estimatedSize: number;
  } {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stats = this.db
      .prepare(`
        SELECT 
          COUNT(*) as totalChanges,
          MIN(db_version) as oldestVersion,
          MAX(db_version) as newestVersion
        FROM crsql_changes
      `)
      .get() as {
        totalChanges: number;
        oldestVersion: number | null;
        newestVersion: number | null;
      };

    const estimatedSize = stats.totalChanges * 500;

    return {
      totalChanges: stats.totalChanges,
      oldestVersion: stats.oldestVersion ?? 0,
      newestVersion: stats.newestVersion ?? 0,
      estimatedSize,
    };
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.drizzle = null;
      this.isInitialized = false;
      console.log('[Database] Database closed');
    }
  }
}
