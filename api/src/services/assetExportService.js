const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const {
  GENERATED_DIR,
  ASSETS_DIR,
  EXPORTS_DIR
} = require("../config/paths");

const {
  createZipFromDirectory
} = require("./zipService");

function getBaseUrl() {
  return (
    process.env.BASE_URL ||
    "http://localhost:4000"
  );
}

async function makeLightBackgroundTransparent(
  inputPath,
  outputPath
) {
  const image = sharp(inputPath).ensureAlpha();

  const { data, info } = await image
    .raw()
    .toBuffer({
      resolveWithObject: true
    });

  const threshold = 245;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (
      r > threshold &&
      g > threshold &&
      b > threshold
    ) {
      data[i + 3] = 0;
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .png()
    .toFile(outputPath);
}

async function exportProjectAssets(project) {
  const assetSheetFileName = path.basename(
    new URL(project.assetSheetUrl).pathname
  );

  const assetSheetPath = path.join(
    GENERATED_DIR,
    assetSheetFileName
  );

  const rows =
    project.assetSheetGrid?.rows || 4;

  const cols =
    project.assetSheetGrid?.cols || 4;

  const imageWidth =
    project.assetSheetGrid?.imageWidth || 1024;

  const imageHeight =
    project.assetSheetGrid?.imageHeight || 1024;

  const cellWidth =
    Math.floor(imageWidth / cols);

  const cellHeight =
    Math.floor(imageHeight / rows);

  const projectAssetDir = path.join(
    ASSETS_DIR,
    `project-${project.id}`
  );

  await fs.rm(projectAssetDir, {
    recursive: true,
    force: true
  });

  await fs.mkdir(projectAssetDir, {
    recursive: true
  });

  const assets = [];

  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= cols; col++) {
      const cellId = `r${row}c${col}`;

      const left = Math.round(
        (col - 1) * cellWidth
      );

      const top = Math.round(
        (row - 1) * cellHeight
      );

      const rawFileName =
        `${cellId}-raw.png`;

      const transparentFileName =
        `${cellId}.png`;

      const rawPath = path.join(
        projectAssetDir,
        rawFileName
      );

      const transparentPath = path.join(
        projectAssetDir,
        transparentFileName
      );

      await sharp(assetSheetPath)
        .extract({
          left,
          top,
          width: cellWidth,
          height: cellHeight
        })
        .png()
        .toFile(rawPath);

      await makeLightBackgroundTransparent(
        rawPath,
        transparentPath
      );

      await fs.rm(rawPath, {
        force: true
      });

      assets.push({
        id: cellId,
        row,
        col,
        x: left,
        y: top,
        width: cellWidth,
        height: cellHeight,
        fileName: transparentFileName,
        imageUrl:
          `${getBaseUrl()}/assets/` +
          `project-${project.id}/` +
          transparentFileName
      });
    }
  }

  const zipFileName =
    `project-${project.id}-assets.zip`;

  const zipPath = path.join(
    EXPORTS_DIR,
    zipFileName
  );

  await fs.rm(zipPath, {
    force: true
  });

  await createZipFromDirectory(
    projectAssetDir,
    zipPath
  );

  return {
    assets,
    zipUrl:
      `${getBaseUrl()}/exports/${zipFileName}`,
    exportedAt: new Date().toISOString()
  };
}

module.exports = {
  exportProjectAssets
};