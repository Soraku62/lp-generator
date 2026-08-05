const path = require("path");

// apiフォルダの絶対パス
const API_ROOT_DIR = path.resolve(__dirname, "../..");

// 生成画像やZIPの保存先
// Railwayでは STORAGE_DIR=/data
const STORAGE_DIR =
  process.env.STORAGE_DIR ||
  path.join(API_ROOT_DIR, "public");

const GENERATED_DIR = path.join(
  STORAGE_DIR,
  "generated"
);

const ASSETS_DIR = path.join(
  STORAGE_DIR,
  "assets"
);

const EXPORTS_DIR = path.join(
  STORAGE_DIR,
  "exports"
);

// SQLiteデータベースの保存先
//
// ローカル:
// api/data/lp-generator.sqlite
//
// Railway:
// /data/lp-generator.sqlite
const DATA_DIR =
  process.env.DATA_DIR ||
  process.env.STORAGE_DIR ||
  path.join(API_ROOT_DIR, "data");

const DATABASE_PATH =
  process.env.DATABASE_PATH ||
  path.join(DATA_DIR, "lp-generator.sqlite");

module.exports = {
  API_ROOT_DIR,
  STORAGE_DIR,
  GENERATED_DIR,
  ASSETS_DIR,
  EXPORTS_DIR,
  DATA_DIR,
  DATABASE_PATH
};