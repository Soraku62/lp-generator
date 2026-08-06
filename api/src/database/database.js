const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const {
  DATABASE_PATH
} = require("../config/paths");

// データベースを保存するフォルダがなければ作成
fs.mkdirSync(
  path.dirname(DATABASE_PATH),
  {
    recursive: true
  }
);

// SQLiteデータベースへ接続
// ファイルが存在しなければ自動作成される
const database = new DatabaseSync(
  DATABASE_PATH,
  {
    timeout: 5000
  }
);

// データベースの基本設定とテーブル作成
database.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    service_name TEXT NOT NULL,
    concept TEXT NOT NULL,
    target_user TEXT NOT NULL,
    tone TEXT NOT NULL,
    main_message TEXT NOT NULL,
    prompt TEXT NOT NULL,
    access_token_hash TEXT,

    generated_image_url TEXT,
    generated_at TEXT,
    image_model TEXT,

    asset_sheet_url TEXT,
    asset_sheet_prompt TEXT,
    asset_sheet_generated_at TEXT,
    asset_sheet_grid_json TEXT,

    exported_assets_json TEXT,
    assets_zip_url TEXT,
    assets_exported_at TEXT,

    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// 既存のprojectsテーブルに
// access_token_hash列があるか確認する
const projectColumns = database
  .prepare("PRAGMA table_info(projects)")
  .all();

const hasAccessTokenHash =
  projectColumns.some(
    (column) =>
      column.name === "access_token_hash"
  );

// 古いDBには列がないため追加する
if (!hasAccessTokenHash) {
  database.exec(`
    ALTER TABLE projects
    ADD COLUMN access_token_hash TEXT
  `);

  console.log(
    "Added access_token_hash column to projects table."
  );
}

console.log(
  `SQLite database connected: ${DATABASE_PATH}`
);

module.exports = database;