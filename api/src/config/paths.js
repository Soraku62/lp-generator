const path = require("path");

// apiフォルダの絶対パス
// __dirnameは api/src/config を指すため、../.. でapiまで戻る
const API_ROOT_DIR = path.resolve(__dirname, "../..");

// RailwayではSTORAGE_DIR=/data
// ローカルではapi/publicを使う
const STORAGE_DIR =
  process.env.STORAGE_DIR || path.join(API_ROOT_DIR, "public");

const GENERATED_DIR = path.join(STORAGE_DIR, "generated");
const ASSETS_DIR = path.join(STORAGE_DIR, "assets");
const EXPORTS_DIR = path.join(STORAGE_DIR, "exports");

module.exports = {
  STORAGE_DIR,
  GENERATED_DIR,
  ASSETS_DIR,
  EXPORTS_DIR
};