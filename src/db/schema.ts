/**
 * Drizzle ORM Schema 定义
 * 定义所有数据库表结构和关系
 * 
 * 注意事项：
 * 1. CR-SQLite 不支持除主键外的 UNIQUE 约束，唯一性在应用层检查
 * 2. CR-SQLite 不支持外键约束，关系定义仅用于查询
 * 3. 所有 NOT NULL 字段必须有默认值
 */

// @ts-ignore - Drizzle ORM 0.44.6 使用 sqlite-core 路径，新版本会改为 sqlite
import { sqliteTable, text, integer, real, blob, index } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

// ============================================
// Authors 表 - 作者信息
// ============================================
export const authors = sqliteTable('authors', {
  id: text('id').primaryKey().notNull(),
  username: text('username').notNull().default(''),
  passwordHash: text('passwordHash'),
  displayName: text('displayName'),
  email: text('email'),
  bio: text('bio'),
  avatarUrl: text('avatarUrl'),
  walletAddress: text('walletAddress'),
  publicKey: text('publicKey'),
  privateKeyEncrypted: text('privateKeyEncrypted'),
  totalWorks: integer('totalWorks').notNull().default(0),
  totalWords: integer('totalWords').notNull().default(0),
  status: text('status').notNull().default('active'),
  preferences: text('preferences'), // JSON 字符串
  lastActiveAt: integer('lastActiveAt'),
  createdAt: integer('createdAt').notNull().default(0),
  updatedAt: integer('updatedAt').notNull().default(0),
});

// ============================================
// Works 表 - 作品信息
// ============================================
export const works = sqliteTable('works', {
  id: text('id').primaryKey().notNull(),
  title: text('title').notNull().default(''),
  subtitle: text('subtitle'),
  description: text('description'),
  coverImageUrl: text('coverImageUrl'),
  genre: text('genre'),
  tags: text('tags'), // JSON 数组字符串
  authorId: text('authorId').notNull().default(''),
  collaborationMode: text('collaborationMode').notNull().default('private'), // 'private' | 'team' | 'public'
  collaborators: text('collaborators'), // JSON 数组字符串 - team和public模式下的固定成员列表
  status: text('status').notNull().default('draft'), // 'draft' | 'published' | 'archived'
  progressPercentage: real('progressPercentage').notNull().default(0.0),
  totalWords: integer('totalWords').notNull().default(0),
  totalCharacters: integer('totalCharacters').notNull().default(0),
  chapterCount: integer('chapterCount').notNull().default(0),
  targetWords: integer('targetWords'),
  targetCompletionDate: integer('targetCompletionDate'),
  blockchainHash: text('blockchainHash'),
  nftTokenId: text('nftTokenId'),
  nftContractAddress: text('nftContractAddress'),
  copyrightHash: text('copyrightHash'),
  isPublic: integer('isPublic', { mode: 'boolean' }).notNull().default(false),
  licenseType: text('licenseType').notNull().default('all_rights_reserved'),
  publishedAt: integer('publishedAt'),
  metadata: text('metadata'), // JSON 对象字符串
  createdAt: integer('createdAt').notNull().default(0),
  updatedAt: integer('updatedAt').notNull().default(0),
});

// ============================================
// Chapters 表 - 章节信息
// ============================================
export const chapters = sqliteTable('chapters', {
  id: text('id').primaryKey().notNull(),
  workId: text('workId').notNull().default(''),
  parentId: text('parentId'),
  level: integer('level').notNull().default(1),
  orderIndex: integer('orderIndex').notNull().default(0),
  title: text('title').notNull().default(''),
  subtitle: text('subtitle'),
  description: text('description'),
  type: text('type').notNull().default('chapter'), // 'chapter' | 'volume' | 'section'
  status: text('status').notNull().default('draft'),
  wordCount: integer('wordCount').notNull().default(0),
  characterCount: integer('characterCount').notNull().default(0),
  contentCount: integer('contentCount').notNull().default(0),
  childChapterCount: integer('childChapterCount').notNull().default(0),
  progressPercentage: real('progressPercentage').notNull().default(0.0),
  targetWords: integer('targetWords'),
  authorId: text('authorId').notNull().default(''),
  storyTimelineStart: text('storyTimelineStart'),
  storyTimelineEnd: text('storyTimelineEnd'),
  tags: text('tags'), // JSON 数组字符串
  blockchainHash: text('blockchainHash'),
  isPublic: integer('isPublic', { mode: 'boolean' }).notNull().default(false),
  publishedAt: integer('publishedAt'),
  metadata: text('metadata'), // JSON 对象字符串
  createdAt: integer('createdAt').notNull().default(0),
  updatedAt: integer('updatedAt').notNull().default(0),
});

// ============================================
// Contents 表 - 内容块
// ============================================
export const contents = sqliteTable('contents', {
  id: text('id').primaryKey().notNull(),
  workId: text('workId').notNull().default(''),
  chapterId: text('chapterId'),
  orderIndex: integer('orderIndex').notNull().default(0),
  title: text('title'),
  type: text('type').notNull().default('text'), // 'text' | 'dialogue' | 'scene' | 'note'
  contentJson: text('contentJson'), // ProseMirror JSON 格式
  wordCount: integer('wordCount').notNull().default(0),
  characterCount: integer('characterCount').notNull().default(0),
  paragraphCount: integer('paragraphCount').notNull().default(0),
  status: text('status').notNull().default('draft'),
  version: integer('version').notNull().default(1),
  authorId: text('authorId').notNull().default(''),
  isCollaborative: integer('isCollaborative', { mode: 'boolean' }).notNull().default(false),
  contributors: text('contributors'), // JSON 数组字符串
  storyTimeline: text('storyTimeline'),
  charactersInvolved: text('charactersInvolved'), // JSON 数组字符串
  location: text('location'),
  sceneDescription: text('sceneDescription'),
  tags: text('tags'), // JSON 数组字符串
  emotionTone: text('emotionTone'),
  importanceLevel: integer('importanceLevel').notNull().default(3), // 1-5
  contentHash: text('contentHash'),
  blockchainTimestamp: integer('blockchainTimestamp'),
  copyrightStatus: text('copyrightStatus').notNull().default('draft'),
  isPublic: integer('isPublic', { mode: 'boolean' }).notNull().default(false),
  publishedAt: integer('publishedAt'),
  writingDuration: integer('writingDuration').notNull().default(0),
  lastEditedAt: integer('lastEditedAt').notNull().default(0),
  lastEditorId: text('lastEditorId').notNull().default(''),
  notes: text('notes'),
  metadata: text('metadata'), // JSON 对象字符串
  createdAt: integer('createdAt').notNull().default(0),
  updatedAt: integer('updatedAt').notNull().default(0),
});

// ============================================
// ContentVersions 表 - 内容版本历史
// ============================================
export const contentVersions = sqliteTable('contentVersions', {
  id: text('id').primaryKey().notNull(),
  contentId: text('contentId').notNull().default(''),
  contentJson: text('contentJson').notNull().default(''),
  contentHtml: text('contentHtml'),
  contentText: text('contentText'),
  wordCount: integer('wordCount').notNull().default(0),
  characterCount: integer('characterCount').notNull().default(0),
  versionNumber: integer('versionNumber').notNull().default(1),
  changeSummary: text('changeSummary'),
  authorId: text('authorId').notNull().default(''),
  blockchainHash: text('blockchainHash'),
  createdAt: integer('createdAt').notNull().default(0),
});

// ============================================
// CollaborativeDocuments 表 - Yjs 协作文档
// ============================================
export const collaborativeDocuments = sqliteTable('collaborativeDocuments', {
  id: text('id').primaryKey().notNull(),
  contentId: text('contentId').notNull().default(''),
  workId: text('workId').notNull().default(''),
  documentType: text('documentType').notNull().default('text'),
  yjsState: text('yjsState', { mode: 'text' }), // 存储为 Buffer，但 SQLite 中为 BLOB
  stateVector: text('stateVector', { mode: 'text' }), // 存储为 Buffer
  maxConnections: integer('maxConnections').notNull().default(10),
  lastSyncAt: integer('lastSyncAt'),
  createdAt: integer('createdAt').notNull().default(0),
  updatedAt: integer('updatedAt').notNull().default(0),
});

// ============================================
// Relations - 定义表之间的关系（仅用于查询）
// ============================================

export const authorsRelations = relations(authors, ({ many }) => ({
  works: many(works),
  chapters: many(chapters),
  contents: many(contents),
}));

export const worksRelations = relations(works, ({ one, many }) => ({
  author: one(authors, {
    fields: [works.authorId],
    references: [authors.id],
  }),
  chapters: many(chapters),
  contents: many(contents),
}));

export const chaptersRelations = relations(chapters, ({ one, many }) => ({
  work: one(works, {
    fields: [chapters.workId],
    references: [works.id],
  }),
  author: one(authors, {
    fields: [chapters.authorId],
    references: [authors.id],
  }),
  parent: one(chapters, {
    fields: [chapters.parentId],
    references: [chapters.id],
    relationName: 'parentChild',
  }),
  children: many(chapters, {
    relationName: 'parentChild',
  }),
  contents: many(contents),
}));

export const contentsRelations = relations(contents, ({ one, many }) => ({
  work: one(works, {
    fields: [contents.workId],
    references: [works.id],
  }),
  chapter: one(chapters, {
    fields: [contents.chapterId],
    references: [chapters.id],
  }),
  author: one(authors, {
    fields: [contents.authorId],
    references: [authors.id],
  }),
  versions: many(contentVersions),
  collaborativeDoc: one(collaborativeDocuments, {
    fields: [contents.id],
    references: [collaborativeDocuments.contentId],
  }),
}));

export const contentVersionsRelations = relations(contentVersions, ({ one }) => ({
  content: one(contents, {
    fields: [contentVersions.contentId],
    references: [contents.id],
  }),
  author: one(authors, {
    fields: [contentVersions.authorId],
    references: [authors.id],
  }),
}));

export const collaborativeDocumentsRelations = relations(collaborativeDocuments, ({ one }) => ({
  content: one(contents, {
    fields: [collaborativeDocuments.contentId],
    references: [contents.id],
  }),
  work: one(works, {
    fields: [collaborativeDocuments.workId],
    references: [works.id],
  }),
}));

// ============================================
// TypeScript 类型导出
// ============================================

// Select 类型（查询返回）
export type Author = typeof authors.$inferSelect;
export type Work = typeof works.$inferSelect;
export type Chapter = typeof chapters.$inferSelect;
export type Content = typeof contents.$inferSelect;
export type ContentVersion = typeof contentVersions.$inferSelect;
export type CollaborativeDocument = typeof collaborativeDocuments.$inferSelect;

// Insert 类型（插入数据）
export type NewAuthor = typeof authors.$inferInsert;
export type NewWork = typeof works.$inferInsert;
export type NewChapter = typeof chapters.$inferInsert;
export type NewContent = typeof contents.$inferInsert;
export type NewContentVersion = typeof contentVersions.$inferInsert;
export type NewCollaborativeDocument = typeof collaborativeDocuments.$inferInsert;

// Update 类型（部分更新）
export type UpdateAuthor = Partial<NewAuthor>;
export type UpdateWork = Partial<NewWork>;
export type UpdateChapter = Partial<NewChapter>;
export type UpdateContent = Partial<NewContent>;

// Delete 类型（删除条件）
export type DeleteAuthor = Pick<Author, 'id'>;
export type DeleteWork = Pick<Work, 'id'>;
export type DeleteChapter = Pick<Chapter, 'id'>;
export type DeleteContent = Pick<Content, 'id'>;
export type DeleteContentVersion = Pick<ContentVersion, 'id'>;
export type DeleteCollaborativeDocument = Pick<CollaborativeDocument, 'id'>;

// ============================================
// Block System Schema
// 全新的 Block 模型数据库结构
// ============================================


// ============================================
// 核心层 (Core Layer)
// ============================================

/**
 * blocks - Block 核心表
 * 所有类型的 Block 的基础结构
 */
export const blocks = sqliteTable('blocks', {
  // 主键
  id: text('id').primaryKey(),                // UUID v4
  
  // 类型信息
  type: text('type').notNull(),               // character, location, event, scene, etc.
  category: text('category').notNull(),       // narrative, world, meta
  
  // 基础字段（所有 Block 共有）
  title: text('title').notNull(),
  summary: text('summary'),                   // 简短摘要
  
  // 注意：文学描写内容通过 blockVariants 表关联（一对多）
  // contentJson 和 contentYdoc 已移至 blockVariants 表
  
  // 扩展字段（类型特定）
  extendedFields: text('extended_fields'),    // JSON string，根据 type 包含不同字段
  
  // 版本控制
  version: integer('version').notNull().default(1),
  contentHash: text('content_hash').notNull(), // SHA-256 hash of content
  
  // 所有权与创作
  creatorId: text('creator_id').notNull(),    // 创建者 ID
  workId: text('work_id'),                     // 所属作品（可选）
  spaceId: text('space_id'),                   // 所属协作空间（可选）
  
  // 状态
  status: text('status').notNull().default('draft'), // draft, published, archived
  visibility: text('visibility').notNull().default('private'), // private, team, public
  
  // Fork 信息
  originBlockId: text('origin_block_id'),     // 源 Block（如果是 Fork）
  forkType: text('fork_type'),                 // variation, alternative, parallel, etc.
  
  // 元数据
  tags: text('tags'),                          // JSON array
  metadata: text('metadata'),                  // JSON object - 任意扩展数据
  
  // 时间戳
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
  publishedAt: integer('published_at'),
  
  // CR-SQLite CRDT 支持
  db_version: integer('__crsql_db_version'),
  site_id: blob('__crsql_site_id'),
  
  // 搜索优化
  searchVector: text('search_vector'),         // 全文搜索向量
}, (table) => ({
  // 索引
  typeIdx: index('blocks_type_idx').on(table.type),
  creatorIdx: index('blocks_creator_idx').on(table.creatorId),
  workIdx: index('blocks_work_idx').on(table.workId),
  spaceIdx: index('blocks_space_idx').on(table.spaceId),
  statusIdx: index('blocks_status_idx').on(table.status),
  originIdx: index('blocks_origin_idx').on(table.originBlockId),
  createdAtIdx: index('blocks_created_at_idx').on(table.createdAt),
  hashIdx: index('blocks_hash_idx').on(table.contentHash),
}));

/**
 * blockVariants - Block 变体表
 * 同一个 Block 在不同场景、不同角度的不同文学描写
 * 
 * 与 Fork 的区别：
 * - Fork: 创建新的 Block，可以改变所有属性
 * - Variant: 还是同一个 Block，只是不同的文学表达
 * 
 * 使用场景：
 * - 同一个人物在不同作品中的描写
 * - 同一个地点在不同时间的描写
 * - 同一个事件从不同视角的叙述
 */
export const blockVariants = sqliteTable('block_variants', {
  id: text('id').primaryKey(),
  
  // 关联的 Block
  blockId: text('block_id').notNull().references(() => blocks.id, { onDelete: 'cascade' }),
  
  // 变体信息
  variantName: text('variant_name').notNull(), // 变体名称，如"正式描写"、"第一视角"、"诗意版本"
  variantType: text('variant_type').notNull().default('standard'), // standard, poetic, technical, first_person, etc.
  description: text('description'),            // 变体说明
  
  // 文学描写内容（这是核心字段）
  contentJson: text('content_json'),           // 富文本内容（ProseMirror JSON）
  contentYdoc: blob('content_ydoc'),           // Yjs 文档（用于协作编辑）
  contentText: text('content_text'),           // 纯文本版本（用于搜索和预览）
  
  // 内容元数据
  wordCount: integer('word_count').default(0), // 字数统计
  language: text('language').default('zh'),    // 语言
  tone: text('tone'),                          // 语气：formal, casual, poetic, technical
  perspective: text('perspective'),            // 视角：first_person, third_person, omniscient
  
  // 使用场景
  workId: text('work_id'),                     // 所属作品（如果特定于某个作品）
  sceneContext: text('scene_context'),         // 场景上下文（JSON）
  
  // 版本控制
  version: integer('version').notNull().default(1),
  contentHash: text('content_hash'),           // 内容 Hash
  
  // 状态
  isDefault: integer('is_default').notNull().default(0), // 是否为默认变体
  isActive: integer('is_active').notNull().default(1),
  
  // 质量评分
  qualityScore: real('quality_score'),         // 0.0 - 1.0
  viewCount: integer('view_count').notNull().default(0),
  useCount: integer('use_count').notNull().default(0), // 被引用次数
  
  // 创作信息
  createdBy: text('created_by').notNull(),
  
  // 时间戳
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
  
  // CR-SQLite CRDT 支持
  db_version: integer('__crsql_db_version'),
  site_id: blob('__crsql_site_id'),
}, (table) => ({
  blockIdx: index('block_variants_block_idx').on(table.blockId),
  workIdx: index('block_variants_work_idx').on(table.workId),
  defaultIdx: index('block_variants_default_idx').on(table.blockId, table.isDefault),
  typeIdx: index('block_variants_type_idx').on(table.variantType),
  creatorIdx: index('block_variants_creator_idx').on(table.createdBy),
}));

/**
 * blockTypes - Block 类型定义表
 * 定义每种 Block 类型的结构和验证规则
 */
export const blockTypes = sqliteTable('block_types', {
  id: text('id').primaryKey(),                 // 如 'character', 'location'
  category: text('category').notNull(),        // narrative, world, meta
  
  // 显示信息
  displayName: text('display_name').notNull(),
  displayNameI18n: text('display_name_i18n'), // JSON: {en, zh, ...}
  description: text('description'),
  icon: text('icon'),                          // Icon 名称或 emoji
  color: text('color'),                        // 主题色
  
  // Schema 定义
  baseFields: text('base_fields').notNull(),   // JSON array - 必需的基础字段
  extendedSchema: text('extended_schema').notNull(), // JSON Schema - 扩展字段定义
  
  // 验证规则
  validationRules: text('validation_rules'),   // JSON object
  
  // 允许的关系类型
  allowedRelations: text('allowed_relations'), // JSON array of RelationType
  
  // 渲染配置
  renderConfig: text('render_config'),         // JSON - UI 渲染配置
  
  // 系统字段
  isSystem: integer('is_system').notNull().default(0), // 是否为系统内置类型
  isActive: integer('is_active').notNull().default(1),
  
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  categoryIdx: index('block_types_category_idx').on(table.category),
}));

/**
 * blockSchemas - Block 类型 Schema 版本管理
 * 支持 Schema 演化和向后兼容
 */
export const blockSchemas = sqliteTable('block_schemas', {
  id: text('id').primaryKey(),
  blockTypeId: text('block_type_id').notNull().references(() => blockTypes.id),
  
  version: integer('version').notNull(),
  schema: text('schema').notNull(),            // JSON Schema
  
  migrationUp: text('migration_up'),           // 升级脚本
  migrationDown: text('migration_down'),       // 降级脚本
  
  isActive: integer('is_active').notNull().default(0),
  
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  typeVersionIdx: index('block_schemas_type_version_idx').on(table.blockTypeId, table.version),
}));

// ============================================
// 关系层 (Relation Layer)
// ============================================

/**
 * blockRelations - Block 之间的关系
 */
export const blockRelations = sqliteTable('block_relations', {
  id: text('id').primaryKey(),
  
  // 关系两端
  sourceBlockId: text('source_block_id').notNull().references(() => blocks.id, { onDelete: 'cascade' }),
  targetBlockId: text('target_block_id').notNull().references(() => blocks.id, { onDelete: 'cascade' }),
  
  // 关系类型
  relationType: text('relation_type').notNull(), // RelationType enum
  relationTypeId: text('relation_type_id').references(() => relationTypes.id),
  
  // 关系属性
  strength: real('strength').default(1.0),      // 0.0 - 1.0 关系强度
  bidirectional: integer('bidirectional').notNull().default(0), // 是否双向
  
  // 关系元数据
  properties: text('properties'),               // JSON object - 关系特定属性
  description: text('description'),
  
  // 时空约束
  validFrom: integer('valid_from'),             // 关系生效时间
  validTo: integer('valid_to'),                 // 关系失效时间
  contextBlockId: text('context_block_id').references(() => blocks.id), // 关系发生的上下文
  
  // 创作信息
  createdBy: text('created_by').notNull(),
  
  // 版本控制
  version: integer('version').notNull().default(1),
  
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
  
  // CRDT
  db_version: integer('__crsql_db_version'),
  site_id: blob('__crsql_site_id'),
}, (table) => ({
  sourceIdx: index('block_relations_source_idx').on(table.sourceBlockId),
  targetIdx: index('block_relations_target_idx').on(table.targetBlockId),
  typeIdx: index('block_relations_type_idx').on(table.relationType),
  bothIdx: index('block_relations_both_idx').on(table.sourceBlockId, table.targetBlockId),
}));

/**
 * relationTypes - 关系类型定义
 */
export const relationTypes = sqliteTable('relation_types', {
  id: text('id').primaryKey(),                 // 如 'FAMILY', 'CAUSES'
  
  // 显示信息
  displayName: text('display_name').notNull(),
  displayNameI18n: text('display_name_i18n'), // JSON
  description: text('description'),
  
  // 关系属性
  category: text('category').notNull(),        // temporal, causal, social, spatial, etc.
  defaultBidirectional: integer('default_bidirectional').notNull().default(0),
  inverseRelationId: text('inverse_relation_id'), // 反向关系
  
  // 约束
  allowedSourceTypes: text('allowed_source_types'), // JSON array of blockType IDs
  allowedTargetTypes: text('allowed_target_types'), // JSON array of blockType IDs
  
  // 属性 Schema
  propertiesSchema: text('properties_schema'), // JSON Schema for properties field
  
  // 可视化
  color: text('color'),
  icon: text('icon'),
  lineStyle: text('line_style'),               // solid, dashed, dotted
  
  isSystem: integer('is_system').notNull().default(0),
  isActive: integer('is_active').notNull().default(1),
  
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  categoryIdx: index('relation_types_category_idx').on(table.category),
}));

// ============================================
// Fork 层 (Fork Layer)
// ============================================

/**
 * blockTrees - Block Fork 树结构
 */
export const blockTrees = sqliteTable('block_trees', {
  id: text('id').primaryKey(),
  
  // 树的根节点
  rootBlockId: text('root_block_id').notNull().references(() => blocks.id),
  
  // 树信息
  treeName: text('tree_name'),
  treeType: text('tree_type').notNull().default('standard'), // standard, parallel_world
  
  // 统计
  totalNodes: integer('total_nodes').notNull().default(1),
  maxDepth: integer('max_depth').notNull().default(0),
  totalForks: integer('total_forks').notNull().default(0),
  
  // 元数据
  metadata: text('metadata'),                  // JSON
  
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  rootIdx: index('block_trees_root_idx').on(table.rootBlockId),
}));

/**
 * forkRelations - Fork 关系表
 * 记录 Block 之间的 Fork 关系
 */
export const forkRelations = sqliteTable('fork_relations', {
  id: text('id').primaryKey(),
  
  treeId: text('tree_id').notNull().references(() => blockTrees.id),
  
  // Fork 关系
  parentBlockId: text('parent_block_id').notNull().references(() => blocks.id),
  childBlockId: text('child_block_id').notNull().references(() => blocks.id),
  
  // Fork 类型
  forkType: text('fork_type').notNull(),       // variation, alternative, parallel, etc.
  
  // Fork 元数据
  forkReason: text('fork_reason'),             // 为什么 Fork
  differencesSummary: text('differences_summary'), // 与父节点的差异
  divergencePoint: text('divergence_point'),   // 分叉点描述
  
  // 层级信息
  depth: integer('depth').notNull().default(0),
  orderIndex: integer('order_index').notNull().default(0), // 在同级中的顺序
  
  // 平行世界专用
  worldId: text('world_id'),                   // 属于哪个平行世界
  worldName: text('world_name'),
  
  // 创作信息
  forkedBy: text('forked_by').notNull(),
  
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  treeIdx: index('fork_relations_tree_idx').on(table.treeId),
  parentIdx: index('fork_relations_parent_idx').on(table.parentBlockId),
  childIdx: index('fork_relations_child_idx').on(table.childBlockId),
  worldIdx: index('fork_relations_world_idx').on(table.worldId),
}));

/**
 * parallelWorlds - 平行世界管理
 */
export const parallelWorlds: any = sqliteTable('parallel_worlds', {
  id: text('id').primaryKey(),
  
  // 世界信息
  name: text('name').notNull(),
  description: text('description'),
  color: text('color'),                        // 可视化时的颜色
  icon: text('icon'),
  
  // 分叉信息
  originWorldId: text('origin_world_id').references((): any => parallelWorlds.id),
  divergenceBlockId: text('divergence_block_id').references(() => blocks.id),
  divergenceType: text('divergence_type'),     // decision, accident, intervention
  divergenceDescription: text('divergence_description'),
  
  // 世界属性
  stability: real('stability').notNull().default(1.0), // 0.0 - 1.0
  canonicalStatus: text('canonical_status').notNull().default('alternative'), // primary, secondary, alternative
  
  // 世界差异
  differencesFromOrigin: text('differences_from_origin'), // JSON array
  
  // 关联
  workId: text('work_id'),
  createdBy: text('created_by').notNull(),
  
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  originIdx: index('parallel_worlds_origin_idx').on(table.originWorldId),
  workIdx: index('parallel_worlds_work_idx').on(table.workId),
  statusIdx: index('parallel_worlds_status_idx').on(table.canonicalStatus),
}));

// ============================================
// 协作层 (Collaboration Layer)
// ============================================

/**
 * blockSpaces - 协作空间
 */
export const blockSpaces = sqliteTable('block_spaces', {
  id: text('id').primaryKey(),
  
  // 空间信息
  name: text('name').notNull(),
  description: text('description'),
  spaceType: text('space_type').notNull().default('open'), // open, closed, invite_only
  
  // 关联
  workId: text('work_id'),
  
  // 设置
  settings: text('settings'),                  // JSON - 协作规则
  
  // 状态
  status: text('status').notNull().default('active'), // active, archived, closed
  
  // 统计
  memberCount: integer('member_count').notNull().default(0),
  blockCount: integer('block_count').notNull().default(0),
  
  // 创建者
  createdBy: text('created_by').notNull(),
  
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  workIdx: index('block_spaces_work_idx').on(table.workId),
  typeIdx: index('block_spaces_type_idx').on(table.spaceType),
  statusIdx: index('block_spaces_status_idx').on(table.status),
}));

/**
 * blockSpaceMembers - 空间成员
 */
export const blockSpaceMembers = sqliteTable('block_space_members', {
  id: text('id').primaryKey(),
  
  spaceId: text('space_id').notNull().references(() => blockSpaces.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  
  // 角色
  role: text('role').notNull().default('contributor'), // owner, moderator, contributor, reviewer
  
  // 权限
  permissions: text('permissions'),            // JSON array
  
  // 状态
  status: text('status').notNull().default('active'), // active, suspended, left
  
  // 统计
  contributionCount: integer('contribution_count').notNull().default(0),
  reviewCount: integer('review_count').notNull().default(0),
  
  joinedAt: integer('joined_at').notNull().default(sql`(unixepoch())`),
  lastActiveAt: integer('last_active_at'),
}, (table) => ({
  spaceIdx: index('block_space_members_space_idx').on(table.spaceId),
  userIdx: index('block_space_members_user_idx').on(table.userId),
  roleIdx: index('block_space_members_role_idx').on(table.role),
}));

/**
 * blockContributions - Block 贡献记录
 */
export const blockContributions = sqliteTable('block_contributions', {
  id: text('id').primaryKey(),
  
  blockId: text('block_id').notNull().references(() => blocks.id, { onDelete: 'cascade' }),
  spaceId: text('space_id').notNull().references(() => blockSpaces.id),
  
  contributorId: text('contributor_id').notNull(),
  
  // 贡献类型
  contributionType: text('contribution_type').notNull(), // create, edit, fork, merge
  
  // 贡献内容
  changesSummary: text('changes_summary'),
  diffData: text('diff_data'),                 // JSON - 具体变更
  
  // 状态（协作流程）
  status: text('status').notNull().default('submitted'), // submitted, in_review, accepted, rejected
  
  // 评分
  qualityScore: real('quality_score'),         // 0.0 - 1.0
  innovationScore: real('innovation_score'),   // 0.0 - 1.0
  
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  reviewedAt: integer('reviewed_at'),
  acceptedAt: integer('accepted_at'),
}, (table) => ({
  blockIdx: index('block_contributions_block_idx').on(table.blockId),
  spaceIdx: index('block_contributions_space_idx').on(table.spaceId),
  contributorIdx: index('block_contributions_contributor_idx').on(table.contributorId),
  statusIdx: index('block_contributions_status_idx').on(table.status),
}));

/**
 * peerReviews - 同行评审
 */
export const peerReviews = sqliteTable('peer_reviews', {
  id: text('id').primaryKey(),
  
  contributionId: text('contribution_id').notNull().references(() => blockContributions.id, { onDelete: 'cascade' }),
  reviewerId: text('reviewer_id').notNull(),
  
  // 评审结果
  decision: text('decision').notNull(),        // approve, request_changes, reject
  
  // 评分
  qualityScore: real('quality_score'),         // 1.0 - 5.0
  innovationScore: real('innovation_score'),
  consistencyScore: real('consistency_score'),
  
  // 评审内容
  feedback: text('feedback'),
  suggestedChanges: text('suggested_changes'), // JSON
  
  // 标签
  tags: text('tags'),                          // JSON array
  
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  contributionIdx: index('peer_reviews_contribution_idx').on(table.contributionId),
  reviewerIdx: index('peer_reviews_reviewer_idx').on(table.reviewerId),
  decisionIdx: index('peer_reviews_decision_idx').on(table.decision),
}));

/**
 * collaborativeEdits - 协作编辑记录
 */
export const collaborativeEdits = sqliteTable('collaborative_edits', {
  id: text('id').primaryKey(),
  
  blockId: text('block_id').notNull().references(() => blocks.id, { onDelete: 'cascade' }),
  spaceId: text('space_id').notNull().references(() => blockSpaces.id),
  
  // 编辑者
  editorId: text('editor_id').notNull(),
  
  // 编辑类型
  editType: text('edit_type').notNull(),       // content, metadata, relations, merge
  
  // 编辑内容
  changes: text('changes').notNull(),          // JSON - CRDT changes
  previousHash: text('previous_hash').notNull(),
  newHash: text('new_hash').notNull(),
  
  // 合并提议（如果是 merge）
  mergeProposalId: text('merge_proposal_id'),
  
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  blockIdx: index('collaborative_edits_block_idx').on(table.blockId),
  editorIdx: index('collaborative_edits_editor_idx').on(table.editorId),
  typeIdx: index('collaborative_edits_type_idx').on(table.editType),
}));

/**
 * mergeProposals - 合并提议
 */
export const mergeProposals = sqliteTable('merge_proposals', {
  id: text('id').primaryKey(),
  
  spaceId: text('space_id').notNull().references(() => blockSpaces.id),
  
  // 合并源
  sourceBlockIds: text('source_block_ids').notNull(), // JSON array
  targetBlockId: text('target_block_id').references(() => blocks.id),
  
  // 合并策略
  mergeStrategy: text('merge_strategy').notNull(), // manual, auto, hybrid
  mergeResult: text('merge_result'),           // JSON - 合并结果预览
  
  // 提议者
  proposedBy: text('proposed_by').notNull(),
  
  // 状态
  status: text('status').notNull().default('pending'), // pending, voting, accepted, rejected
  
  // 投票
  votingEndsAt: integer('voting_ends_at'),
  
  // 说明
  rationale: text('rationale'),
  
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  resolvedAt: integer('resolved_at'),
}, (table) => ({
  spaceIdx: index('merge_proposals_space_idx').on(table.spaceId),
  proposerIdx: index('merge_proposals_proposer_idx').on(table.proposedBy),
  statusIdx: index('merge_proposals_status_idx').on(table.status),
}));

/**
 * consensusVotes - 共识投票
 */
export const consensusVotes = sqliteTable('consensus_votes', {
  id: text('id').primaryKey(),
  
  // 投票对象
  targetType: text('target_type').notNull(),   // contribution, merge_proposal, canonization
  targetId: text('target_id').notNull(),
  
  spaceId: text('space_id').notNull().references(() => blockSpaces.id),
  voterId: text('voter_id').notNull(),
  
  // 投票
  vote: text('vote').notNull(),                // approve, neutral, disapprove
  weight: real('weight').notNull().default(1.0), // 基于声誉的投票权重
  
  // 理由
  comment: text('comment'),
  
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  targetIdx: index('consensus_votes_target_idx').on(table.targetType, table.targetId),
  voterIdx: index('consensus_votes_voter_idx').on(table.voterId),
  spaceIdx: index('consensus_votes_space_idx').on(table.spaceId),
}));

/**
 * reputationScores - 声誉系统
 */
export const reputationScores = sqliteTable('reputation_scores', {
  id: text('id').primaryKey(),
  
  userId: text('user_id').notNull().unique(),
  
  // 总声誉
  totalReputation: integer('total_reputation').notNull().default(0),
  
  // 分类声誉
  creatorReputation: integer('creator_reputation').notNull().default(0),
  reviewerReputation: integer('reviewer_reputation').notNull().default(0),
  collaboratorReputation: integer('collaborator_reputation').notNull().default(0),
  curatorReputation: integer('curator_reputation').notNull().default(0),
  
  // 专长领域（最擅长的 Block 类型）
  specialties: text('specialties'),            // JSON array of blockType IDs
  
  // 成就
  achievements: text('achievements'),          // JSON array
  
  // 等级
  tier: text('tier').notNull().default('novice'), // novice, contributor, expert, master
  
  // 统计
  totalContributions: integer('total_contributions').notNull().default(0),
  totalReviews: integer('total_reviews').notNull().default(0),
  acceptedContributions: integer('accepted_contributions').notNull().default(0),
  helpfulReviews: integer('helpful_reviews').notNull().default(0),
  
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  userIdx: index('reputation_scores_user_idx').on(table.userId),
  tierIdx: index('reputation_scores_tier_idx').on(table.tier),
  totalIdx: index('reputation_scores_total_idx').on(table.totalReputation),
}));

// ============================================
// 组合层 (Composition Layer)
// ============================================

/**
 * works - 作品（保留，但扩展以支持 Block）
 * 注意：这是对现有 works 表的扩展设计，实际实现时需要与现有表整合
 */
export const blockWorks = sqliteTable('block_works', {
  id: text('id').primaryKey(),
  
  // 基本信息（与现有 works 兼容）
  title: text('title').notNull(),
  summary: text('summary'),
  coverUrl: text('cover_url'),
  
  // 作品类型
  workType: text('work_type').notNull().default('block_based'), // block_based, traditional, hybrid
  
  // 组合结构类型
  structureType: text('structure_type').notNull().default('linear'), // linear, tree, graph, timeline, multiverse
  
  // 作者
  authorId: text('author_id').notNull(),
  collaborators: text('collaborators'),        // JSON array of user IDs
  
  // 状态
  status: text('status').notNull().default('draft'),
  visibility: text('visibility').notNull().default('private'),
  
  // 统计
  blockCount: integer('block_count').notNull().default(0),
  worldCount: integer('world_count').notNull().default(0),
  
  // 元数据
  tags: text('tags'),
  metadata: text('metadata'),
  
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
  publishedAt: integer('published_at'),
}, (table) => ({
  authorIdx: index('block_works_author_idx').on(table.authorId),
  typeIdx: index('block_works_type_idx').on(table.workType),
  statusIdx: index('block_works_status_idx').on(table.status),
}));

/**
 * workBlocks - 作品与 Block 的关联
 */
export const workBlocks: any = sqliteTable('work_blocks', {
  id: text('id').primaryKey(),
  
  workId: text('work_id').notNull().references(() => blockWorks.id, { onDelete: 'cascade' }),
  blockId: text('block_id').notNull().references(() => blocks.id, { onDelete: 'cascade' }),
  
  // 在作品中的角色
  role: text('role').notNull(),                // main, supporting, background, reference
  importance: integer('importance').notNull().default(5), // 1-10
  
  // 平行世界
  worldId: text('world_id').references(() => parallelWorlds.id),
  
  // 顺序（用于线性/树形结构）
  orderIndex: integer('order_index'),
  chapterNumber: integer('chapter_number'),
  sectionNumber: integer('section_number'),
  
  // 层级（用于树形结构）
  parentId: text('parent_id').references((): any => workBlocks.id),
  depth: integer('depth').notNull().default(0),
  
  // 位置（用于图形/时间线结构）
  positionX: real('position_x'),
  positionY: real('position_y'),
  timestamp: integer('timestamp'),             // 时间线位置
  
  // 元数据
  metadata: text('metadata'),
  
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  workIdx: index('work_blocks_work_idx').on(table.workId),
  blockIdx: index('work_blocks_block_idx').on(table.blockId),
  worldIdx: index('work_blocks_world_idx').on(table.worldId),
  orderIdx: index('work_blocks_order_idx').on(table.workId, table.orderIndex),
}));

/**
 * workStructures - 作品结构定义
 */
export const workStructures = sqliteTable('work_structures', {
  id: text('id').primaryKey(),
  
  workId: text('work_id').notNull().references(() => blockWorks.id, { onDelete: 'cascade' }),
  
  // 结构类型
  structureType: text('structure_type').notNull(),
  
  // 结构定义（根据类型不同，存储不同的 JSON）
  structureData: text('structure_data').notNull(), // JSON
  
  // 版本
  version: integer('version').notNull().default(1),
  
  // 是否激活
  isActive: integer('is_active').notNull().default(1),
  
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  workIdx: index('work_structures_work_idx').on(table.workId),
  activeIdx: index('work_structures_active_idx').on(table.workId, table.isActive),
}));

// ============================================
// 区块链层 (Blockchain Layer)
// ============================================

/**
 * chainBlocks - 上链的 Block（ChainBlock）
 */
export const chainBlocks = sqliteTable('chain_blocks', {
  id: text('id').primaryKey(),
  
  // 关联的 Block
  blockId: text('block_id').notNull().references(() => blocks.id),
  
  // 区块链信息
  contentHash: text('content_hash').notNull().unique(), // 与 blocks.contentHash 对应
  merkleRoot: text('merkle_root').notNull(),   // Merkle 树根
  previousHash: text('previous_hash'),         // 前一个 ChainBlock 的 hash
  
  // NFT 信息
  nftTokenId: text('nft_token_id'),
  nftContractAddress: text('nft_contract_address'),
  nftChain: text('nft_chain'),                 // ethereum, polygon, etc.
  nftMetadataUri: text('nft_metadata_uri'),
  
  // 上链状态
  chainStatus: text('chain_status').notNull().default('pending'), // pending, minting, minted, failed
  
  // 正典状态
  canonicalStatus: text('canonical_status').notNull(), // primary, secondary, alternative
  consensusScore: real('consensus_score').notNull(),   // 0.0 - 1.0
  
  // 版税分配
  royaltyDistribution: text('royalty_distribution'), // JSON - 收益分配方案
  
  // 上链时间
  mintedAt: integer('minted_at'),
  mintedBy: text('minted_by'),
  
  // 交易信息
  transactionHash: text('transaction_hash'),
  blockNumber: integer('block_number'),
  
  createdAt: integer('created_at').notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at').notNull().default(sql`(unixepoch())`),
}, (table) => ({
  blockIdx: index('chain_blocks_block_idx').on(table.blockId),
  hashIdx: index('chain_blocks_hash_idx').on(table.contentHash),
  statusIdx: index('chain_blocks_status_idx').on(table.chainStatus),
  canonicalIdx: index('chain_blocks_canonical_idx').on(table.canonicalStatus),
  nftIdx: index('chain_blocks_nft_idx').on(table.nftTokenId),
}));

/**
 * canonicalBlocks - 正典 Block 版本管理
 */
export const canonicalBlocks = sqliteTable('canonical_blocks', {
  id: text('id').primaryKey(),
  
  // Block Tree
  treeId: text('tree_id').notNull().references(() => blockTrees.id),
  
  // 正典 Block
  blockId: text('block_id').notNull().references(() => blocks.id),
  
  // 正典级别
  tier: text('tier').notNull(),                // primary, secondary, alternative
  tierRank: integer('tier_rank').notNull().default(0), // 在同一 tier 内的排名
  
  // 共识信息
  consensusScore: real('consensus_score').notNull(),
  totalVotes: integer('total_votes').notNull().default(0),
  approvalRate: real('approval_rate').notNull(), // 0.0 - 1.0
  
  // 时间
  canonizedAt: integer('canonized_at').notNull().default(sql`(unixepoch())`),
  reviewedAt: integer('reviewed_at'),
  
  // 元数据
  metadata: text('metadata'),
}, (table) => ({
  treeIdx: index('canonical_blocks_tree_idx').on(table.treeId),
  blockIdx: index('canonical_blocks_block_idx').on(table.blockId),
  tierIdx: index('canonical_blocks_tier_idx').on(table.tier),
  scoreIdx: index('canonical_blocks_score_idx').on(table.consensusScore),
}));

// ============================================
// 类型定义导出
// ============================================

export type Block = typeof blocks.$inferSelect;
export type NewBlock = typeof blocks.$inferInsert;

export type BlockVariant = typeof blockVariants.$inferSelect;
export type NewBlockVariant = typeof blockVariants.$inferInsert;

export type BlockType = typeof blockTypes.$inferSelect;
export type NewBlockType = typeof blockTypes.$inferInsert;

export type BlockRelation = typeof blockRelations.$inferSelect;
export type NewBlockRelation = typeof blockRelations.$inferInsert;

export type RelationType = typeof relationTypes.$inferSelect;
export type NewRelationType = typeof relationTypes.$inferInsert;

export type BlockTree = typeof blockTrees.$inferSelect;
export type NewBlockTree = typeof blockTrees.$inferInsert;

export type ForkRelation = typeof forkRelations.$inferSelect;
export type NewForkRelation = typeof forkRelations.$inferInsert;

export type ParallelWorld = typeof parallelWorlds.$inferSelect;
export type NewParallelWorld = typeof parallelWorlds.$inferInsert;

export type BlockSpace = typeof blockSpaces.$inferSelect;
export type NewBlockSpace = typeof blockSpaces.$inferInsert;

export type BlockContribution = typeof blockContributions.$inferSelect;
export type NewBlockContribution = typeof blockContributions.$inferInsert;

export type PeerReview = typeof peerReviews.$inferSelect;
export type NewPeerReview = typeof peerReviews.$inferInsert;

export type MergeProposal = typeof mergeProposals.$inferSelect;
export type NewMergeProposal = typeof mergeProposals.$inferInsert;

export type ConsensusVote = typeof consensusVotes.$inferSelect;
export type NewConsensusVote = typeof consensusVotes.$inferInsert;

export type ReputationScore = typeof reputationScores.$inferSelect;
export type NewReputationScore = typeof reputationScores.$inferInsert;

export type BlockWork = typeof blockWorks.$inferSelect;
export type NewBlockWork = typeof blockWorks.$inferInsert;

export type WorkBlock = typeof workBlocks.$inferSelect;
export type NewWorkBlock = typeof workBlocks.$inferInsert;

export type WorkStructure = typeof workStructures.$inferSelect;
export type NewWorkStructure = typeof workStructures.$inferInsert;

export type ChainBlock = typeof chainBlocks.$inferSelect;
export type NewChainBlock = typeof chainBlocks.$inferInsert;

export type CanonicalBlock = typeof canonicalBlocks.$inferSelect;
export type NewCanonicalBlock = typeof canonicalBlocks.$inferInsert;
