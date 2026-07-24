const express = require("express");

const {
  createProject,
  getAllProjects,
  findProjectById
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

  const project = createProject({
    ...normalizedProjectData,

    prompt: buildLpPrompt(
      normalizedProjectData
    ),

    generatedImageUrl: null
  });

  return sendSuccess(res, project);
});

// GET /projects
router.get("/", (req, res) => {
  return sendSuccess(
    res,
    getAllProjects()
  );
});

// GET /projects/:id
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);

  const project = findProjectById(id);

  if (!project) {
    return sendError(
      res,
      404,
      "PROJECT_NOT_FOUND",
      "Project not found.",
      {
        id
      }
    );
  }

  return sendSuccess(res, project);
});

// POST /projects/:id/lp-images
router.post(
  "/:id/lp-images",
  async (req, res) => {
    const id = Number(req.params.id);

    const project = findProjectById(id);

    if (!project) {
      return sendError(
        res,
        404,
        "PROJECT_NOT_FOUND",
        "Project not found.",
        {
          id
        }
      );
    }

    try {
      const {
        fileName,
        model
      } = await generateCloudflareImage({
        prompt: project.prompt,
        steps: 25,
        filePrefix: String(project.id)
      });

      project.generatedImageUrl =
        `${getBaseUrl()}/generated/${fileName}`;

      project.generatedAt =
        new Date().toISOString();

      project.imageModel = model;

      return sendSuccess(res, {
        id: project.id,
        imageUrl: project.generatedImageUrl,
        model,
        prompt: project.prompt,
        generatedAt: project.generatedAt
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
router.post(
  "/:id/asset-sheets",
  async (req, res) => {
    const id = Number(req.params.id);

    const project = findProjectById(id);

    if (!project) {
      return sendError(
        res,
        404,
        "PROJECT_NOT_FOUND",
        "Project not found.",
        {
          id
        }
      );
    }

    if (!project.generatedImageUrl) {
      return sendError(
        res,
        400,
        "IMAGE_NOT_GENERATED",
        "Generate the landing page image before generating an asset sheet.",
        {
          id
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
        filePrefix:
          `assetsheet-${project.id}`
      });

      project.assetSheetUrl =
        `${getBaseUrl()}/generated/${fileName}`;

      project.assetSheetPrompt =
        assetSheetPrompt;

      project.assetSheetGeneratedAt =
        new Date().toISOString();

      project.assetSheetGrid = {
        rows: 4,
        cols: 4,
        imageWidth: 1024,
        imageHeight: 1024
      };

      return sendSuccess(res, {
        id: project.id,
        assetSheetUrl:
          project.assetSheetUrl,
        model,
        prompt: assetSheetPrompt,
        grid: project.assetSheetGrid,
        generatedAt:
          project.assetSheetGeneratedAt
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
router.post(
  "/:id/asset-exports",
  async (req, res) => {
    const id = Number(req.params.id);

    const project = findProjectById(id);

    if (!project) {
      return sendError(
        res,
        404,
        "PROJECT_NOT_FOUND",
        "Project not found.",
        {
          id
        }
      );
    }

    if (!project.assetSheetUrl) {
      return sendError(
        res,
        400,
        "ASSET_SHEET_NOT_GENERATED",
        "Generate the asset sheet before exporting assets.",
        {
          id
        }
      );
    }

    try {
      const result =
        await exportProjectAssets(project);

      project.exportedAssets =
        result.assets;

      project.assetsZipUrl =
        result.zipUrl;

      project.assetsExportedAt =
        result.exportedAt;

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