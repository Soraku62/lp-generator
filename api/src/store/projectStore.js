const database =
  require("../database/database");

/**
 * JavaScriptの値を
 * SQLiteへ保存できるJSON文字列へ変換する
 */
function serializeJson(value) {
  if (value === undefined || value === null) {
    return null;
  }

  return JSON.stringify(value);
}

/**
 * SQLiteに保存されたJSON文字列を
 * JavaScriptの値へ戻す
 */
function parseJson(value, fallback = null) {
  if (value === undefined || value === null) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn(
      "Failed to parse stored JSON:",
      error.message
    );

    return fallback;
  }
}

/**
 * SQLiteの行データを、
 * APIで使っているプロジェクト形式へ変換する
 */
function rowToProject(row) {
  if (!row) {
    return undefined;
  }

  return {
    id: row.id,

    serviceName: row.service_name,
    concept: row.concept,
    targetUser: row.target_user,
    tone: row.tone,
    mainMessage: row.main_message,
    prompt: row.prompt,

    generatedImageUrl:
      row.generated_image_url,

    generatedAt:
      row.generated_at,

    imageModel:
      row.image_model,

    assetSheetUrl:
      row.asset_sheet_url,

    assetSheetPrompt:
      row.asset_sheet_prompt,

    assetSheetGeneratedAt:
      row.asset_sheet_generated_at,

    assetSheetGrid:
      parseJson(
        row.asset_sheet_grid_json,
        null
      ),

    exportedAssets:
      parseJson(
        row.exported_assets_json,
        null
      ),

    assetsZipUrl:
      row.assets_zip_url,

    assetsExportedAt:
      row.assets_exported_at,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at
  };
}

/**
 * プロジェクトをSQLiteへ保存する
 */
function createProject(projectData) {
  const now = new Date().toISOString();

  const createdAt =
    projectData.createdAt || now;

  const updatedAt =
    projectData.updatedAt || createdAt;

  const statement = database.prepare(`
    INSERT INTO projects (
      service_name,
      concept,
      target_user,
      tone,
      main_message,
      prompt,
      access_token_hash,

      generated_image_url,
      generated_at,
      image_model,

      asset_sheet_url,
      asset_sheet_prompt,
      asset_sheet_generated_at,
      asset_sheet_grid_json,

      exported_assets_json,
      assets_zip_url,
      assets_exported_at,

      created_at,
      updated_at
    )
    VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?,
      ?, ?
    )
  `);

  const result = statement.run(
    projectData.serviceName,
    projectData.concept,
    projectData.targetUser,
    projectData.tone,
    projectData.mainMessage,
    projectData.prompt,
    projectData.accessTokenHash,

    projectData.generatedImageUrl ?? null,
    projectData.generatedAt ?? null,
    projectData.imageModel ?? null,

    projectData.assetSheetUrl ?? null,
    projectData.assetSheetPrompt ?? null,
    projectData.assetSheetGeneratedAt ?? null,
    serializeJson(
      projectData.assetSheetGrid
    ),

    serializeJson(
      projectData.exportedAssets
    ),
    projectData.assetsZipUrl ?? null,
    projectData.assetsExportedAt ?? null,

    createdAt,
    updatedAt
  );

  return findProjectById(
    Number(result.lastInsertRowid)
  );
}

/**
 * プロジェクト一覧を取得する
 */
function getAllProjects() {
  const rows = database
    .prepare(`
      SELECT *
      FROM projects
      ORDER BY id ASC
    `)
    .all();

  return rows.map(rowToProject);
}

/**
 * IDから1件取得する
 */
function findProjectById(id) {
  const numericId = Number(id);

  if (!Number.isInteger(numericId)) {
    return undefined;
  }

  const row = database
    .prepare(`
      SELECT *
      FROM projects
      WHERE id = ?
    `)
    .get(numericId);

  return rowToProject(row);
}

function findProjectAccessById(id) {
  const numericId = Number(id);

  if (!Number.isInteger(numericId)) {
    return undefined;
  }

  const row = database
    .prepare(`
      SELECT *
      FROM projects
      WHERE id = ?
    `)
    .get(numericId);

  if (!row) {
    return undefined;
  }

  return {
    project: rowToProject(row),
    accessTokenHash:
      row.access_token_hash
  };
}

/**
 * JavaScript側の名前と
 * SQLite側の列名を対応させる
 */
const updateFieldDefinitions = {
  serviceName: {
    column: "service_name"
  },

  concept: {
    column: "concept"
  },

  targetUser: {
    column: "target_user"
  },

  tone: {
    column: "tone"
  },

  mainMessage: {
    column: "main_message"
  },

  prompt: {
    column: "prompt"
  },

  generatedImageUrl: {
    column: "generated_image_url"
  },

  generatedAt: {
    column: "generated_at"
  },

  imageModel: {
    column: "image_model"
  },

  assetSheetUrl: {
    column: "asset_sheet_url"
  },

  assetSheetPrompt: {
    column: "asset_sheet_prompt"
  },

  assetSheetGeneratedAt: {
    column: "asset_sheet_generated_at"
  },

  assetSheetGrid: {
    column: "asset_sheet_grid_json",
    serialize: serializeJson
  },

  exportedAssets: {
    column: "exported_assets_json",
    serialize: serializeJson
  },

  assetsZipUrl: {
    column: "assets_zip_url"
  },

  assetsExportedAt: {
    column: "assets_exported_at"
  }
};

/**
 * プロジェクトの一部を更新する
 */
function updateProject(id, patch) {
  const numericId = Number(id);

  if (!Number.isInteger(numericId)) {
    return undefined;
  }

  const validEntries = Object
    .entries(patch)
    .filter(([field, value]) => {
      return (
        Object.hasOwn(
          updateFieldDefinitions,
          field
        ) &&
        value !== undefined
      );
    });

  if (validEntries.length === 0) {
    return findProjectById(numericId);
  }

  const setStatements = [];
  const values = [];

  for (const [field, value] of validEntries) {
    const definition =
      updateFieldDefinitions[field];

    setStatements.push(
      `${definition.column} = ?`
    );

    const storedValue =
      definition.serialize
        ? definition.serialize(value)
        : value;

    values.push(storedValue);
  }

  const updatedAt =
    new Date().toISOString();

  setStatements.push("updated_at = ?");
  values.push(updatedAt);

  values.push(numericId);

  const statement = database.prepare(`
    UPDATE projects
    SET ${setStatements.join(", ")}
    WHERE id = ?
  `);

  const result = statement.run(...values);

  if (Number(result.changes) === 0) {
    return undefined;
  }

  return findProjectById(numericId);
}

module.exports = {
  createProject,
  getAllProjects,
  findProjectById,
  findProjectAccessById,
  updateProject
};