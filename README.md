# LP Generator

AIを利用してランディングページのイメージを生成し、そのデザイン要素を素材シートとして再構成、分割、透過PNG化し、ZIPで出力するWebアプリケーションです。

## 公開URL

### Webアプリケーション

https://lp-generator-kappa.vercel.app

### 公開API

https://lp-generator-production-ce78.up.railway.app

---

## 概要

Webサイトやランディングページを制作する際には、デザイン案の作成だけでなく、画像素材の準備や切り出しにも時間がかかります。

本プロジェクトでは、サービスの情報を入力すると、AIが以下の処理を行います。

1. ランディングページの完成イメージを生成
2. デザインに使用する要素を4×4の素材シートとして再生成
3. 素材シートを16個のセルに分割
4. 各セルの背景を簡易的に透過
5. PNG素材をZIP形式で一括出力

完成画像を生成するだけではなく、後続のWeb制作で再利用しやすい素材まで出力することを目的としています。

---

## 主な機能

* サービス名、コンセプト、対象ユーザーなどの入力
* AIによるLPイメージ生成
* AIによる素材シート生成
* 4×4グリッドによる素材分割
* 各セルのPNGファイル化
* 白背景の簡易透過処理
* 16個のPNG素材のプレビュー
* PNG素材をまとめたZIPファイルの出力
* 統一されたJSON形式のAPIレスポンス
* エラーコードと詳細情報を含むエラー処理

---

## 処理フロー

```text
ユーザーがサービス情報を入力
        ↓
Next.jsからExpress APIを呼び出す
        ↓
プロジェクトと画像生成用プロンプトを作成
        ↓
Cloudflare Workers AIでLP画像を生成
        ↓
Cloudflare Workers AIで素材シートを生成
        ↓
素材シートを4×4グリッドとして解析
        ↓
Sharpで16個のPNG画像に切り出す
        ↓
白に近い背景を簡易的に透過
        ↓
JSZipでZIPファイルにまとめる
        ↓
Web画面でプレビュー・ダウンロード
```

---

## システム構成

```text
Vercel
└── Next.js Web Application
        ↓ HTTP / JSON
Railway
└── Express API
        ├── Cloudflare Workers AI
        ├── Sharp
        ├── JSZip
        └── Railway Volume
```

Cloudflare Workers AIはブラウザから直接呼び出していません。

フロントエンドから自作Express APIを呼び出し、Express APIの内部からCloudflare Workers AIを利用しています。これにより、Cloudflare API Tokenをブラウザへ公開せずに利用できます。

---

## 使用技術

### フロントエンド

* Next.js
* React
* TypeScript
* Vercel

### バックエンド

* Node.js
* Express
* JavaScript
* Railway

### AI・画像処理

* Cloudflare Workers AI
* FLUX.2 [klein] 9B
* Sharp
* JSZip

### 開発・テスト

* Git
* GitHub
* Postman
* Chrome DevTools

---

## ディレクトリ構成

```text
lp-generator/
├── api/
│   ├── index.js
│   ├── package.json
│   ├── package-lock.json
│   └── public/
│       ├── generated/
│       ├── assets/
│       └── exports/
│
├── web/
│   ├── app/
│   │   └── page.tsx
│   ├── package.json
│   └── package-lock.json
│
└── README.md
```

---

# API仕様

API Base URL:

```text
https://lp-generator-production-ce78.up.railway.app
```

## 共通レスポンス形式

### 成功時

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

### 失敗時

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {}
  }
}
```

---

## GET `/`

APIの動作確認を行います。

### レスポンス例

```json
{
  "success": true,
  "data": {
    "message": "API is running"
  },
  "error": null
}
```

---

## POST `/generate-lp`

LP生成用のプロジェクトを作成します。

この時点では画像生成は行わず、入力情報とプロンプトを保存したプロジェクトを作成します。

### リクエスト例

```json
{
  "serviceName": "aiment",
  "concept": "A service where Japanese learners can practice conversation in a fun and natural way.",
  "targetUser": "International Japanese learners who want speaking practice.",
  "tone": "modern, soft, futuristic, clean",
  "mainMessage": "Learn Japanese by speaking, not just studying."
}
```

### 必須項目

| 項目           | 型      | 説明         |
| ------------ | ------ | ---------- |
| `concept`    | string | サービスのコンセプト |
| `targetUser` | string | 対象ユーザー     |

### 任意項目

| 項目            | 型      | 説明       |
| ------------- | ------ | -------- |
| `serviceName` | string | サービス名    |
| `tone`        | string | デザインの雰囲気 |
| `mainMessage` | string | メインメッセージ |

### レスポンス例

```json
{
  "success": true,
  "data": {
    "id": 1,
    "serviceName": "aiment",
    "concept": "A service where Japanese learners can practice conversation in a fun and natural way.",
    "targetUser": "International Japanese learners who want speaking practice.",
    "tone": "modern, soft, futuristic, clean",
    "mainMessage": "Learn Japanese by speaking, not just studying.",
    "prompt": "Create a landing page visual...",
    "generatedImageUrl": null,
    "createdAt": "2026-07-17T00:00:00.000Z"
  },
  "error": null
}
```

---

## POST `/projects/:id/generate-image`

指定したプロジェクトの情報を使ってLP画像を生成します。

### URL例

```text
POST /projects/1/generate-image
```

### リクエストボディ

```json
{}
```

### レスポンス例

```json
{
  "success": true,
  "data": {
    "id": 1,
    "imageUrl": "https://example.com/generated/1-image.png",
    "model": "@cf/black-forest-labs/flux-2-klein-9b",
    "prompt": "Create a landing page visual...",
    "generatedAt": "2026-07-17T00:00:00.000Z"
  },
  "error": null
}
```

---

## POST `/projects/:id/generate-asset-sheet`

生成済みLPの情報をもとに、4×4の素材シート画像を生成します。

各セルには、ボタン、カード、アイコン、装飾などのUI要素が1つずつ配置されます。

### URL例

```text
POST /projects/1/generate-asset-sheet
```

### リクエストボディ

```json
{}
```

### レスポンス例

```json
{
  "success": true,
  "data": {
    "id": 1,
    "assetSheetUrl": "https://example.com/generated/assetsheet-1.png",
    "model": "@cf/black-forest-labs/flux-2-klein-9b",
    "grid": {
      "rows": 4,
      "cols": 4,
      "imageWidth": 1024,
      "imageHeight": 1024
    },
    "generatedAt": "2026-07-17T00:00:00.000Z"
  },
  "error": null
}
```

---

## POST `/split-grid`

画像を指定した行数・列数に分割した場合の座標情報を返します。

このAPIは画像ファイルを直接生成するのではなく、各セルの位置とサイズをJSONで返します。

### リクエスト例

```json
{
  "imageUrl": "https://example.com/generated/assetsheet-1.png",
  "imageWidth": 1024,
  "imageHeight": 1024,
  "rows": 4,
  "cols": 4
}
```

### レスポンス例

```json
{
  "success": true,
  "data": {
    "imageUrl": "https://example.com/generated/assetsheet-1.png",
    "grid": {
      "rows": 4,
      "cols": 4,
      "imageWidth": 1024,
      "imageHeight": 1024,
      "cellWidth": 256,
      "cellHeight": 256
    },
    "cells": [
      {
        "id": "r1c1",
        "row": 1,
        "col": 1,
        "x": 0,
        "y": 0,
        "width": 256,
        "height": 256
      }
    ]
  },
  "error": null
}
```

---

## POST `/projects/:id/export-assets`

素材シートを16個のPNG画像に切り出し、簡易透過処理を行った上でZIPファイルを作成します。

### URL例

```text
POST /projects/1/export-assets
```

### リクエストボディ

```json
{}
```

### レスポンス例

```json
{
  "success": true,
  "data": {
    "projectId": 1,
    "assets": [
      {
        "id": "r1c1",
        "row": 1,
        "col": 1,
        "x": 0,
        "y": 0,
        "width": 256,
        "height": 256,
        "fileName": "r1c1.png",
        "imageUrl": "https://example.com/assets/project-1/r1c1.png"
      }
    ],
    "zipUrl": "https://example.com/exports/project-1-assets.zip",
    "exportedAt": "2026-07-17T00:00:00.000Z"
  },
  "error": null
}
```

---

## GET `/projects`

現在サーバーのメモリ上に保存されているプロジェクト一覧を取得します。

---

## GET `/projects/:id`

指定したIDのプロジェクトを取得します。

---

# 主なエラーコード

| コード                         | 説明                            |
| --------------------------- | ----------------------------- |
| `MISSING_FIELD`             | 必須項目が不足している                   |
| `INVALID_INPUT`             | 入力形式が正しくない                    |
| `INVALID_GRID_SIZE`         | グリッドの行数・列数が範囲外                |
| `PROJECT_NOT_FOUND`         | 指定したプロジェクトが存在しない              |
| `IMAGE_NOT_GENERATED`       | LP画像がまだ生成されていない               |
| `ASSET_SHEET_NOT_GENERATED` | 素材シートがまだ生成されていない              |
| `CONFIG_ERROR`              | 環境変数が設定されていない                 |
| `CLOUDFLARE_AI_ERROR`       | Cloudflare Workers AIの処理に失敗した |
| `INTERNAL_SERVER_ERROR`     | サーバー内部で処理に失敗した                |

---

# ローカルでの起動方法

## 必要環境

* Node.js 22以降
* npm
* Cloudflareアカウント
* Workers AI API Token

## リポジトリを取得

```bash
git clone <YOUR_REPOSITORY_URL>
cd lp-generator
```

---

## APIを起動

```bash
cd api
npm install
```

`api/.env` を作成します。

```env
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CF_IMAGE_MODEL=@cf/black-forest-labs/flux-2-klein-9b

BASE_URL=http://localhost:4000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
STORAGE_DIR=./public
```

起動します。

```bash
npm start
```

APIは以下で起動します。

```text
http://localhost:4000
```

---

## Webアプリを起動

別のターミナルを開きます。

```bash
cd web
npm install
```

`web/.env.local` を作成します。

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

起動します。

```bash
npm run dev
```

Webアプリは以下で起動します。

```text
http://localhost:3000
```

---

# 環境変数

## API

| 環境変数                    | 説明                           |
| ----------------------- | ---------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare Workers AIの認証トークン |
| `CLOUDFLARE_ACCOUNT_ID` | CloudflareのアカウントID           |
| `CF_IMAGE_MODEL`        | 使用する画像生成モデル                  |
| `BASE_URL`              | API自身の公開URL                  |
| `ALLOWED_ORIGINS`       | CORSで許可するWebアプリのOrigin       |
| `STORAGE_DIR`           | 生成画像やZIPの保存先                 |
| `PORT`                  | APIの待ち受けポート。Railwayでは自動設定    |

## Web

| 環境変数                       | 説明              |
| -------------------------- | --------------- |
| `NEXT_PUBLIC_API_BASE_URL` | Express APIのURL |

`.env` および `.env.local` はGitHubへコミットしません。

---

# デプロイ構成

## API

Railwayにデプロイしています。

モノレポ内の設定：

```text
Root Directory: /api
Start Command: npm start
```

生成画像、PNG素材、ZIPファイルはRailway Volumeの `/data` に保存します。

## Web

Vercelにデプロイしています。

モノレポ内の設定：

```text
Root Directory: web
Framework Preset: Next.js
```

Vercelの環境変数には、Railwayの公開API URLを設定します。

---

# 設計上の工夫

## 外部AI APIを直接公開しない

Cloudflare Workers AIのAPI TokenはExpress API側の環境変数に保存しています。

ブラウザからCloudflareを直接呼ばないことで、API Tokenの流出を防いでいます。

## 処理単位でエンドポイントを分離

LP画像生成、素材シート生成、グリッド解析、PNG出力を別々のエンドポイントとして設計しました。

これにより、それぞれの処理を個別に再利用できます。

## レスポンス形式を統一

全てのAPIで以下の構造を使用しています。

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

または、

```json
{
  "success": false,
  "data": null,
  "error": {}
}
```

## Railway Volumeを使用

生成画像やZIPファイルを再デプロイ後も保持しやすくするため、Railway Volumeを利用しています。

## 本番環境のCORS制御

Railway APIを呼び出せるOriginを環境変数で管理しています。

Vercelの固定本番URLと、デプロイごとに変化するプレビューURLは別Originとして扱われるため、提出用には固定本番URLを使用しています。

---

# 現在の制約

## プロジェクト情報はメモリ保存

プロジェクト情報は現在、以下の配列に保存しています。

```js
const projects = [];
```

そのため、Railwayのサービスが再起動または再デプロイされると、プロジェクト情報は失われます。

画像、PNG、ZIPファイルはRailway Volumeに保存されますが、プロジェクトとの関連情報は永続化されていません。

## 透過処理は簡易方式

現在は、RGB値が白に近いピクセルを透明にしています。

そのため、白いカード、文字、装飾など、本来残すべき部分まで透明になる場合があります。

## AI生成結果にばらつきがある

AIが必ず正確に4×4グリッドへ要素を配置するとは限りません。

素材がセルをまたいだり、不要な文字が生成されたりする場合があります。

## 認証とレート制限が未実装

現在はAPI認証や利用者ごとの回数制限を実装していません。

公開URLを知っている利用者は、画像生成APIを実行できます。

## Cloudflare Workers AIの無料枠

Cloudflare Workers AIには1日あたりの無料利用枠があります。

無料枠を使い切った場合、翌日のリセットまで新しい画像を生成できません。

---

# 今後の改善

* SQLiteやPostgreSQLによるプロジェクト情報の永続化
* APIキーまたはユーザー認証の追加
* IPやユーザー単位のレート制限
* OpenAPI / SwaggerによるAPI仕様書の自動生成
* 素材シートのグリッド認識精度向上
* 背景色を固定したクロマキー方式の透過処理
* AIによる背景除去モデルの導入
* 不要なセルを除外する機能
* 分割数をユーザーが指定できる機能
* ZIP内のファイル名を素材内容に応じて変更する機能
* 自動テストの追加
* 過去に生成したプロジェクトの一覧・再ダウンロード機能

---

# 計画から変更した点

当初はGoogle AI Studioの使用を例として想定していましたが、実装ではCloudflare Workers AIを採用しました。

また、当初はAIの出力をJSON形式に制御する予定でしたが、本プロジェクトの主なAI出力は画像です。

そのため、生成画像をサーバーへ保存し、以下の情報をJSON形式で返す設計に変更しました。

* 画像URL
* モデル名
* 生成日時
* グリッド情報
* 各セルの座標
* PNG素材一覧
* ZIPファイルURL

---

# 学習したこと

本プロジェクトを通して、以下を学習しました。

* REST APIの設計と実装
* Expressによるルーティング
* JSON形式の入出力設計
* 入力チェックとエラー処理
* 外部AI APIとの連携
* API Tokenをサーバー側で管理する方法
* Next.jsとExpress APIの接続
* CORSとプリフライトリクエスト
* Sharpによる画像分割・透過処理
* JSZipによるZIPファイル生成
* RailwayへのAPI公開
* VercelへのNext.js公開
* Railway Volumeによるファイル保存
* ローカル環境と本番環境での環境変数管理
* GitHubを利用したモノレポ管理

---

# 成果

本プロジェクトでは、以下の一連の処理をWeb上で実行できるシステムを完成させました。

```text
サービス情報入力
↓
LP画像生成
↓
素材シート生成
↓
4×4グリッド分割
↓
16個の透過PNG生成
↓
ZIPファイル出力
```

単に外部AI APIを呼び出すだけではなく、生成した画像を後続のWeb制作に利用できる形式へ変換する独自処理を、自作Web APIとして設計・実装・公開しました。

---

## Author

永楽 蒼弥
