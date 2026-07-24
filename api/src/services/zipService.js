const fs = require("fs/promises");
const path = require("path");
const JSZip = require("jszip");

async function createZipFromDirectory(
  sourceDir,
  zipPath
) {
  await fs.mkdir(path.dirname(zipPath), {
    recursive: true
  });

  const zip = new JSZip();
  const fileNames = await fs.readdir(sourceDir);

  for (const fileName of fileNames) {
    const filePath = path.join(
      sourceDir,
      fileName
    );

    const stat = await fs.stat(filePath);

    if (!stat.isFile()) {
      continue;
    }

    const fileBuffer = await fs.readFile(filePath);

    zip.file(fileName, fileBuffer);
  }

  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9
    }
  });

  await fs.writeFile(zipPath, zipBuffer);
}

module.exports = {
  createZipFromDirectory
};