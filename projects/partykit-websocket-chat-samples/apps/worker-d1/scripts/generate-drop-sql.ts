import fs from 'fs';
import path from 'path';
import * as schema from '../src/db/schema';

type DbType = 'sqlite' | 'postgres' | 'mysql';
const DB_TYPE = (process.env.DB_TYPE || 'sqlite').toLowerCase() as DbType;

function getTableName(tableObj: any): string | null {
  if (!tableObj || typeof tableObj !== 'object') return null;

  const symbolKey = Symbol.for('drizzle:Name');
  if (tableObj[symbolKey] && typeof tableObj[symbolKey] === 'string') {
    return tableObj[symbolKey];
  }

  const directName = tableObj.tableName || tableObj.dbName;
  if (typeof directName === 'string') {
    return directName;
  }

  return null;
}

function generateDropSql() {
  const tableNames: string[] = [];

  for (const [_, value] of Object.entries(schema)) {
    const name = getTableName(value);
    if (name) {
      tableNames.push(name);
    }
  }

  const uniqueTables = Array.from(new Set(tableNames));

  if (uniqueTables.length === 0) {
    console.error('❌ スキーマからテーブルを検出できませんでした。');
    return;
  }

  const sqlLines: string[] = [
    `-- Auto-generated Drop Table Script for ${DB_TYPE.toUpperCase()}`,
    '--',
    ''
  ];

  switch (DB_TYPE) {
    case 'postgres':
      sqlLines.push(
        '-- マイグレーション管理テーブルのリセット',
        'TRUNCATE TABLE __drizzle_migrations;',
        '',
        '-- PostgreSQLは CASCADE を付与することで安全に削除可能'
      );
      uniqueTables.forEach((table) => {
        sqlLines.push(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
      });
      break;

    case 'mysql':
      sqlLines.push(
        '-- 一時的に外部キー制約を無効化',
        'SET FOREIGN_KEY_CHECKS = 0;',
        '',
        '-- マイグレーション管理テーブルのリセット',
        'TRUNCATE TABLE `__drizzle_migrations`;',
        ''
      );
      uniqueTables.forEach((table) => {
        sqlLines.push(`DROP TABLE IF EXISTS \`${table}\`;`);
      });
      sqlLines.push('', 'SET FOREIGN_KEY_CHECKS = 1;');
      break;

    case 'sqlite':
    default:
      sqlLines.push(
        '-- マイグレーション管理テーブルリセット',
        'DELETE FROM d1_migrations;',
        '',
        '-- 一時的に外部キー制約を無効化',
        'PRAGMA foreign_keys = OFF;',
        ''
      );
      uniqueTables.forEach((table) => {
        sqlLines.push(`DROP TABLE IF EXISTS ${table};`);
      });
      sqlLines.push('', 'PRAGMA foreign_keys = ON;');
      break;
  }

    const outputPath = path.join(__dirname, '..' , 'seeds', 'drop_tables.sql');
  fs.writeFileSync(outputPath, sqlLines.join('\n'), 'utf8');
  
  console.log(`✅ [${DB_TYPE.toUpperCase()}] 用の ${outputPath} が正常に生成されました。`);
  console.log(`対象テーブル: ${uniqueTables.join(', ')}`);
}

generateDropSql();