const express = require("express");

const {
  createProject,
  getAllProjects,
  updateProject
} = require("../store/projectStore");

const {
  buildLpPrompt
} = require("../prompts/lpPrompt");

const {
  buildAssetSheetPrompt
} = require("../prompts/assetSheetPrompt");

const {
  generateCloudflareImage
} = require("../services/cloudflareImageService");

const {
  exportProjectAssets
} = require("../services/assetExportService");

const {
  sendSuccess,
  sendError,
  sendCaughtError
} = require("../utils/apiResponse");

const {
  generateProjectToken,
  hashProjectToken
} = require("../security/projectToken");

const {
  requireProjectAccess
} = require("../middleware/requireProjectAccess");

const router = express.Router();

function getBaseUrl() {
  return (
    process.env.BASE_URL ||
    "http://localhost:4000"
  );
}

// POST /projects
router.post("/", (req, res) => {
  const {
    serviceName,
    concept,
    targetUser,
    tone,
    mainMessage
  } = req.body;

  if (
    !concept ||
    typeof concept !== "string"
  ) {
    return sendError(
      res,
      400,
      "MISSING_FIELD",
      "concept is required.",
      {
        field: "concept"
      }
    );
  }

  if (
    !targetUser ||
    typeof targetUser !== "string"
  ) {
    return sendError(
      res,
      400,
      "MISSING_FIELD",
      "targetUser is required.",
      {
        field: "targetUser"
      }
    );
  }

  const normalizedProjectData = {
    serviceName:
      serviceName || "Untitled Service",

    concept,
    targetUser,

    tone:
      tone || "modern, clean, attractive",

    mainMessage:
      mainMessage ||
      "A clear and engaging landing page"
  };

  const accessToken =
  generateProjectToken();

  const accessTokenHash =
  hashProjectToken(accessToken);

  const project = createProject({
    ...normalizedProjectData,

    prompt: buildLpPrompt(
      normalizedProjectData
    ),
    accessTokenHash,
    generatedImageUrl: null
  });

  return sendSuccess(
  res,
  {
    ...project,
    accessToken
  },
  201
);
});

// GET /projects
if (process.env.NODE_ENV !== "production") {
  router.get("/", (req, res) => {
    return sendSuccess(
      res,
      getAllProjects()
    );
  });
}

// GET /projects/:id
router.get("/:id", requireProjectAccess,(req, res) => {
  return sendSuccess(
      res,
      req.project
    );
});

// POST /projects/:id/lp-images
// POST /projects/:id/lp-images
router.post(
  "/:id/lp-images",
  requireProjectAccess,
  async (req, res) => {
    const project = req.project;

    try {
      const {
        fileName,
        model
      } = await generateCloudflareImage({
        prompt: project.prompt,
        steps: 25,
        filePrefix: String(project.id)
      });

      const imageUrl =
        `${getBaseUrl()}/generated/${fileName}`;

      const generatedAt =
        new Date().toISOString();

      updateProject(project.id, {
        generatedImageUrl: imageUrl,
        generatedAt,
        imageModel: model
      });

      return sendSuccess(res, {
        id: project.id,
        imageUrl,
        model,
        prompt: project.prompt,
        generatedAt
      });
    } catch (error) {
      return sendCaughtError(
        res,
        error,
        "Failed to generate image."
      );
    }
  }
);

// POST /projects/:id/asset-sheets
// POST /projects/:id/asset-sheets
router.post(
  "/:id/asset-sheets",
  requireProjectAccess,
  async (req, res) => {
    const project = req.project;

    if (!project.generatedImageUrl) {
      return sendError(
        res,
        400,
        "IMAGE_NOT_GENERATED",
        "Generate the landing page image before generating an asset sheet.",
        {
          id: project.id
        }
      );
    }

    try {
      const assetSheetPrompt =
        buildAssetSheetPrompt(project);

      const {
        fileName,
        model
      } = await generateCloudflareImage({
        prompt: assetSheetPrompt,
        steps: 4,
        filePrefix: `assetsheet-${project.id}`
      });

      const assetSheetUrl =
        `${getBaseUrl()}/generated/${fileName}`;

      const assetSheetGeneratedAt =
        new Date().toISOString();

      const assetSheetGrid = {
        rows: 4,
        cols: 4,
        imageWidth: 1024,
        imageHeight: 1024
      };

      updateProject(project.id, {
        assetSheetUrl,
        assetSheetPrompt,
        assetSheetGeneratedAt,
        assetSheetGrid
      });

      return sendSuccess(res, {
        id: project.id,
        assetSheetUrl,
        model,
        prompt: assetSheetPrompt,
        grid: assetSheetGrid,
        generatedAt: assetSheetGeneratedAt
      });
    } catch (error) {
      return sendCaughtError(
        res,
        error,
        "Failed to generate asset sheet."
      );
    }
  }
);

// POST /projects/:id/assets-exports
// POST /projects/:id/asset-exports
router.post(
  "/:id/asset-exports",
  requireProjectAccess,
  async (req, res) => {
    const project = req.project;

    if (!project.assetSheetUrl) {
      return sendError(
        res,
        400,
        "ASSET_SHEET_NOT_GENERATED",
        "Generate the asset sheet before exporting assets.",
        {
          id: project.id
        }
      );
    }

    try {
      const result =
        await exportProjectAssets(project);

      updateProject(project.id, {
        exportedAssets: result.assets,
        assetsZipUrl: result.zipUrl,
        assetsExportedAt: result.exportedAt
      });

      return sendSuccess(res, {
        projectId: project.id,
        assets: result.assets,
        zipUrl: result.zipUrl,
        exportedAt: result.exportedAt
      });
    } catch (error) {
      return sendCaughtError(
        res,
        error,
        "Failed to export assets."
      );
    }
  }
);

module.exports = router;