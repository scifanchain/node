/**
 * Drizzle ORM 数据库实例
 * 提供类型安全的数据库查询接口
 */

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

// 数据库实例类型
export type DrizzleDB = ReturnType<typeof createDrizzleDB>;

/**
 * 创建 Drizzle 数据库实例
 * @param sqliteDB better-sqlite3 数据库实例
 * @returns Drizzle ORM 实例
 */
export function createDrizzleDB(sqliteDB: Database.Database) {
  return drizzle(sqliteDB, { schema });
}

// 导出 schema 以便在其他地方使用
export { schema };
export * from './schema';
