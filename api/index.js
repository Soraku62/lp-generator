require("dotenv").config();



const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const cors = require("cors");
const sharp = require("sharp");

const app = express();
const PORT = process.env.PORT || 4000;

const JSZip = require("jszip");

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  "http://localhost:3000,http://localhost:3001"
)
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin(origin, callback) {
      // Postmanやcurlなど、Originがないリクエストも許可
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn("Blocked by CORS:", origin);
    console.warn("Allowed origins:", allowedOrigins);

      return callback(null, false);
    },
    methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
    
  })
);

app.use(express.json());

const STORAGE_DIR =
  process.env.STORAGE_DIR || path.join(__dirname, "public");

const GENERATED_DIR = path.join(STORAGE_DIR, "generated");
const ASSETS_DIR = path.join(STORAGE_DIR, "assets");
const EXPORTS_DIR = path.join(STORAGE_DIR, "exports");

app.use("/generated", express.static(GENERATED_DIR));
app.use("/assets", express.static(ASSETS_DIR));
app.use("/exports", express.static(EXPORTS_DIR));

const projects = [];
let nextProjectId = 1;

// 動作確認
app.get("/", (req, res) => {
  res.json({
    success: true,
    data: {
      message: "API is running"
    },
    error: null
  });
});

// LP画像生成API
app.post("/generate-lp", (req, res) => {
  const { serviceName, concept, targetUser, tone, mainMessage } = req.body;

  if (!concept || typeof concept !== "string") {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "MISSING_FIELD",
        message: "concept is required.",
        details: { field: "concept" }
      }
    });
  }

  if (!targetUser || typeof targetUser !== "string") {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "MISSING_FIELD",
        message: "targetUser is required.",
        details: { field: "targetUser" }
      }
    });
  }

  const prompt = `
Create a landing page visual for a web service.

Service name: ${serviceName || "Untitled Service"}
Concept: ${concept}
Target user: ${targetUser}
Tone: ${tone || "modern, clean, attractive"}
Main message: ${mainMessage || "A clear and engaging landing page"}

Create a visually appealing hero-style landing page image suitable for later grid-splitting and HTML layout reconstruction.
  `.trim();

  const project = {
    id: nextProjectId,
    serviceName: serviceName || "Untitled Service",
    concept,
    targetUser,
    tone: tone || "modern, clean, attractive",
    mainMessage: mainMessage || "A clear and engaging landing page",
    prompt,
    generatedImageUrl: null,
    createdAt: new Date().toISOString()
  };

  projects.push(project);
  nextProjectId++;

  res.json({
    success: true,
    data: project,
    error: null
  });
});

// 保存済みプロジェクト取得API
app.get("/projects/:id", (req, res) => {
  const id = Number(req.params.id);

  const project = projects.find((project) => project.id === id);

  if (!project) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: "PROJECT_NOT_FOUND",
        message: "Project not found.",
        details: {
          id: id
        }
      }
    });
  }

  res.json({
    success: true,
    data: project,
    error: null
  });
});

// グリッド分割API
app.post("/split-grid", (req, res) => {
  const { imageUrl, imageWidth, imageHeight, rows, cols } = req.body;

  if (!imageUrl || typeof imageUrl !== "string") {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "MISSING_FIELD",
        message: "imageUrl is required.",
        details: {
          field: "imageUrl"
        }
      }
    });
  }

  if (!Number.isInteger(imageWidth) || imageWidth <= 0) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "INVALID_INPUT",
        message: "imageWidth must be a positive integer.",
        details: {
          imageWidth: imageWidth
        }
      }
    });
  }

  if (!Number.isInteger(imageHeight) || imageHeight <= 0) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "INVALID_INPUT",
        message: "imageHeight must be a positive integer.",
        details: {
          imageHeight: imageHeight
        }
      }
    });
  }

  if (!Number.isInteger(rows) || rows < 1 || rows > 20) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "INVALID_GRID_SIZE",
        message: "rows must be an integer between 1 and 20.",
        details: {
          rows: rows
        }
      }
    });
  }

  if (!Number.isInteger(cols) || cols < 1 || cols > 20) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "INVALID_GRID_SIZE",
        message: "cols must be an integer between 1 and 20.",
        details: {
          cols: cols
        }
      }
    });
  }

  const cellWidth = imageWidth / cols;
  const cellHeight = imageHeight / rows;

  const cells = [];

  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= cols; col++) {
      cells.push({
        id: `r${row}c${col}`,
        row: row,
        col: col,
        x: Math.round((col - 1) * cellWidth),
        y: Math.round((row - 1) * cellHeight),
        width: Math.round(cellWidth),
        height: Math.round(cellHeight)
      });
    }
  }

  res.json({
    success: true,
    data: {
      imageUrl: imageUrl,
      grid: {
        rows: rows,
        cols: cols,
        imageWidth: imageWidth,
        imageHeight: imageHeight,
        cellWidth: Math.round(cellWidth),
        cellHeight: Math.round(cellHeight)
      },
      cells: cells
    },
    error: null
  });
});

async function callCloudflareImageAI(prompt) {
  const model =
    process.env.CF_IMAGE_MODEL || "@cf/stabilityai/stable-diffusion-xl-base-1.0";

  const style = process.env.CF_IMAGE_API_STYLE || "path";

  if (style === "path") {
    const cloudflareUrl =
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`;

    const requestBody = {
      prompt: prompt,
      negative_prompt: "low quality, blurry, distorted, broken text",
      width: 1024,
      height: 1024,
      num_steps: 20,
      guidance: 7.5
    };

    console.log("Cloudflare API style: path");
    console.log("Cloudflare model:", model);
    console.log("Cloudflare URL:", cloudflareUrl);
    console.log("Cloudflare request body:", requestBody);

    return fetch(cloudflareUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
  }

  if (style === "universal") {
    const cloudflareUrl =
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run`;

    const requestBody = {
      model: model,
      input: {
        prompt: prompt
      }
    };

    console.log("Cloudflare API style: universal");
    console.log("Cloudflare model:", model);
    console.log("Cloudflare URL:", cloudflareUrl);
    console.log("Cloudflare request body:", requestBody);

    return fetch(cloudflareUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "image/png"
      },
      body: JSON.stringify(requestBody)
    });
  }

  throw new Error(`Unsupported CF_IMAGE_API_STYLE: ${style}`);
}

async function saveCloudflareImageResponse(response, projectId) {
  await fs.mkdir(GENERATED_DIR, { recursive: true });

  const contentType = response.headers.get("content-type") || "";

  console.log("Cloudflare response content-type:", contentType);

  // 画像そのものが返ってくる場合
  if (contentType.startsWith("image/")) {
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extension = "jpg";
    if (contentType.includes("png")) extension = "png";
    if (contentType.includes("webp")) extension = "webp";

    const fileName = `${projectId}-${Date.now()}-${randomUUID()}.${extension}`;
    const filePath = path.join(GENERATED_DIR, fileName);

    await fs.writeFile(filePath, buffer);
    return fileName;
  }

  // JSONとして返ってくる場合
  const text = await response.text();

  console.log("Cloudflare raw response:", text);

  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error(`Cloudflare response is not JSON or image. Raw: ${text.slice(0, 500)}`);
  }

  const maybeBase64 =
    json?.result?.image ||
    json?.result?.image_b64 ||
    json?.image ||
    json?.image_b64 ||
    json?.result?.images?.[0] ||
    json?.images?.[0] ||
    json?.result?.output?.[0]?.b64_json ||
    json?.output?.[0]?.b64_json;

  if (!maybeBase64) {
    throw new Error(`Unsupported response format: ${JSON.stringify(json)}`);
  }

  const cleanedBase64 = maybeBase64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(cleanedBase64, "base64");

  const fileName = `${projectId}-${Date.now()}-${randomUUID()}.png`;
  const filePath = path.join(GENERATED_DIR, fileName);

  await fs.writeFile(filePath, buffer);
  return fileName;
}

function buildAssetSheetPrompt(project) {
  return `
Create a clean UI component asset sheet for a landing page design.

Project information:
- Service name: ${project.serviceName || "Untitled Service"}
- Concept: ${project.concept}
- Target user: ${project.targetUser}
- Tone: ${project.tone || "modern, clean, soft"}
- Main message: ${project.mainMessage || "A clear and engaging landing page"}

Important safety and design rules:
- Create only generic, original UI design elements.
- Do not create real people, celebrities, existing characters, copyrighted characters, or recognizable brand logos.
- Do not create a finished landing page.
- Do not imitate a specific existing brand or creator.
- Use simple placeholder shapes instead of readable text.
- Use a clean light background.
- Keep every asset isolated and reusable.
- Arrange the assets neatly on a clear 4x4 grid.
- Put only one main asset in each grid cell.
- Keep every asset fully inside its own cell.
- Leave clear spacing between cells.
- Do not let assets overlap across grid boundaries.

Include these generic landing page assets:
1. abstract brand mark placeholder
2. headline text placeholder block
3. primary call-to-action button
4. secondary button or input field
5. abstract hero visual icon
6. feature card component 1
7. feature card component 2
8. feature card component 3
9. decorative wave shape
10. soft glow background shape
11. navigation bar component
12. small dashboard panel
13. circular badge icon
14. simple chat bubble icon
15. small statistics card
16. decorative floating icon

Visual style:
- modern SaaS
- clean
- soft gradient
- futuristic but simple
- blue and purple accent colors
- polished UI kit presentation

Output goal:
A reusable 1024x1024 UI asset sheet arranged neatly on a 4x4 grid for later grid splitting.
  `.trim();
}

async function makeLightBackgroundTransparent(inputPath, outputPath) {
  const image = sharp(inputPath).ensureAlpha();

  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const threshold = 245;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // ほぼ白い部分を透明化する簡易処理
    if (r > threshold && g > threshold && b > threshold) {
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

async function createZipFromDirectory(sourceDir, zipPath) {
  await fs.mkdir(path.dirname(zipPath), { recursive: true });

  const zip = new JSZip();
  const fileNames = await fs.readdir(sourceDir);

  for (const fileName of fileNames) {
    const filePath = path.join(sourceDir, fileName);
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

app.post("/projects/:id/generate-asset-sheet", async (req, res) => {
  const id = Number(req.params.id);
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: "PROJECT_NOT_FOUND",
        message: "Project not found.",
        details: { id }
      }
    });
  }

  if (!project.generatedImageUrl) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "IMAGE_NOT_GENERATED",
        message: "Generate the landing page image before generating an asset sheet.",
        details: { id }
      }
    });
  }

  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: "CONFIG_ERROR",
        message: "Cloudflare API token or Account ID is missing.",
        details: null
      }
    });
  }

  try {
    const model =
      process.env.CF_IMAGE_MODEL || "@cf/black-forest-labs/flux-2-klein-9b";

    const cloudflareUrl =
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`;

    const assetSheetPrompt = buildAssetSheetPrompt(project);

    const form = new FormData();
    form.append("prompt", assetSheetPrompt);
    form.append("width", "1024");
    form.append("height", "1024");
    form.append("steps", "4");

    console.log("Cloudflare URL (asset sheet):", cloudflareUrl);
    console.log("Asset sheet prompt:", assetSheetPrompt);

    const cloudflareResponse = await fetch(cloudflareUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
      },
      body: form
    });

    if (!cloudflareResponse.ok) {
      const errorText = await cloudflareResponse.text();

      console.log("Cloudflare asset sheet error status:", cloudflareResponse.status);
      console.log("Cloudflare asset sheet error body:", errorText);

      return res.status(502).json({
        success: false,
        data: null,
        error: {
          code: "CLOUDFLARE_AI_ERROR",
          message: "Cloudflare Workers AI request failed while generating asset sheet.",
          details: {
            status: cloudflareResponse.status,
            body: errorText
          }
        }
      });
    }

    const fileName = await saveCloudflareImageResponse(
      cloudflareResponse,
      `assetsheet-${project.id}`
    );

    const assetSheetUrl = `${process.env.BASE_URL || "http://localhost:4000"}/generated/${fileName}`;

    project.assetSheetUrl = assetSheetUrl;
    project.assetSheetPrompt = assetSheetPrompt;
    project.assetSheetGeneratedAt = new Date().toISOString();
    project.assetSheetGrid = {
      rows: 4,
      cols: 4,
      imageWidth: 1024,
      imageHeight: 1024
    };

    res.json({
      success: true,
      data: {
        id: project.id,
        assetSheetUrl: assetSheetUrl,
        model: model,
        prompt: assetSheetPrompt,
        grid: project.assetSheetGrid,
        generatedAt: project.assetSheetGeneratedAt
      },
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate asset sheet.",
        details: {
          message: error.message
        }
      }
    });
  }
});

app.get("/projects", (req, res) => {
  res.json({
    success: true,
    data: projects,
    error: null
  });
});

app.post("/projects/:id/generate-image", async (req, res) => {
  const id = Number(req.params.id);
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: "PROJECT_NOT_FOUND",
        message: "Project not found.",
        details: { id }
      }
    });
  }

  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
    return res.status(500).json({
      success: false,
      data: null,
      error: {
        code: "CONFIG_ERROR",
        message: "Cloudflare API token or Account ID is missing.",
        details: null
      }
    });
  }

  try {
    const model =
      process.env.CF_IMAGE_MODEL || "@cf/black-forest-labs/flux-2-klein-9b";

    const cloudflareUrl =
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`;

    // ここが重要：JSONではなくFormDataで送る
    const form = new FormData();
    form.append("prompt", project.prompt);
    form.append("width", "1024");
    form.append("height", "1024");
    form.append("steps", "25");

    console.log("Cloudflare URL:", cloudflareUrl);

    const cloudflareResponse = await fetch(cloudflareUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
      },
      body: form
    });

    if (!cloudflareResponse.ok) {
      const errorText = await cloudflareResponse.text();

      return res.status(502).json({
        success: false,
        data: null,
        error: {
          code: "CLOUDFLARE_AI_ERROR",
          message: "Cloudflare Workers AI request failed.",
          details: {
            status: cloudflareResponse.status,
            body: errorText
          }
        }
      });
    }

    const fileName = await saveCloudflareImageResponse(cloudflareResponse, project.id);
    const imageUrl = `${process.env.BASE_URL || "http://localhost:4000"}/generated/${fileName}`;

    project.generatedImageUrl = imageUrl;
    project.generatedAt = new Date().toISOString();
    project.imageModel = model;

    res.json({
      success: true,
      data: {
        id: project.id,
        imageUrl,
        model,
        prompt: project.prompt,
        generatedAt: project.generatedAt
      },
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate image.",
        details: {
          message: error.message
        }
      }
    });
  }
});

app.post("/projects/:id/export-assets", async (req, res) => {
  const id = Number(req.params.id);
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: "PROJECT_NOT_FOUND",
        message: "Project not found.",
        details: { id }
      }
    });
  }

  if (!project.assetSheetUrl) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "ASSET_SHEET_NOT_GENERATED",
        message: "Generate the asset sheet before exporting assets.",
        details: { id }
      }
    });
  }

  try {
    const assetSheetFileName = path.basename(
      new URL(project.assetSheetUrl).pathname
    );

    const assetSheetPath = path.join(GENERATED_DIR, assetSheetFileName);

    const rows = project.assetSheetGrid?.rows || 4;
    const cols = project.assetSheetGrid?.cols || 4;
    const imageWidth = project.assetSheetGrid?.imageWidth || 1024;
    const imageHeight = project.assetSheetGrid?.imageHeight || 1024;

    const cellWidth = Math.floor(imageWidth / cols);
    const cellHeight = Math.floor(imageHeight / rows);

    const projectAssetDir = path.join(ASSETS_DIR, `project-${project.id}`);
    await fs.rm(projectAssetDir, { recursive: true, force: true });
    await fs.mkdir(projectAssetDir, { recursive: true });

    const assets = [];

    for (let row = 1; row <= rows; row++) {
      for (let col = 1; col <= cols; col++) {
        const cellId = `r${row}c${col}`;

        const left = Math.round((col - 1) * cellWidth);
        const top = Math.round((row - 1) * cellHeight);

        const rawFileName = `${cellId}-raw.png`;
        const transparentFileName = `${cellId}.png`;

        const rawPath = path.join(projectAssetDir, rawFileName);
        const transparentPath = path.join(projectAssetDir, transparentFileName);

        await sharp(assetSheetPath)
          .extract({
            left,
            top,
            width: cellWidth,
            height: cellHeight
          })
          .png()
          .toFile(rawPath);

        await makeLightBackgroundTransparent(rawPath, transparentPath);

        await fs.rm(rawPath, { force: true });

        assets.push({
          id: cellId,
          row,
          col,
          x: left,
          y: top,
          width: cellWidth,
          height: cellHeight,
          fileName: transparentFileName,
          imageUrl: `${process.env.BASE_URL || "http://localhost:4000"}/assets/project-${project.id}/${transparentFileName}`
        });
      }
    }

    const zipFileName = `project-${project.id}-assets.zip`;
    const zipPath = path.join(EXPORTS_DIR, zipFileName);

    await fs.rm(zipPath, { force: true });
    await createZipFromDirectory(projectAssetDir, zipPath);

    const zipUrl = `${process.env.BASE_URL || "http://localhost:4000"}/exports/${zipFileName}`;

    project.exportedAssets = assets;
    project.assetsZipUrl = zipUrl;
    project.assetsExportedAt = new Date().toISOString();

    res.json({
      success: true,
      data: {
        projectId: project.id,
        assets,
        zipUrl,
        exportedAt: project.assetsExportedAt
      },
      error: null
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to export assets.",
        details: {
          message: error.message
        }
      }
    });
  }
});

app.post("/dev/import-asset-sheet", (req, res) => {
  const { fileName, rows = 4, cols = 4 } = req.body;

  if (!fileName || typeof fileName !== "string") {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: "MISSING_FIELD",
        message: "fileName is required.",
        details: { field: "fileName" }
      }
    });
  }

  const project = {
    id: nextProjectId,
    serviceName: "Imported Asset Sheet",
    concept: "Imported existing asset sheet for local export testing",
    targetUser: "Developer",
    tone: "test",
    mainMessage: "test",
    prompt: "",
    generatedImageUrl: null,
    assetSheetUrl: `${process.env.BASE_URL || "http://localhost:4000"}/generated/${fileName}`,
    assetSheetGrid: {
      rows,
      cols,
      imageWidth: 1024,
      imageHeight: 1024
    },
    createdAt: new Date().toISOString()
  };

  projects.push(project);
  nextProjectId++;

  res.json({
    success: true,
    data: project,
    error: null
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
