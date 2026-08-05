const express = require("express");

const {
  createProject
} = require("../store/projectStore");

const {
  sendSuccess,
  sendError
} = require("../utils/apiResponse");

const router = express.Router();

function getBaseUrl() {
  return (
    process.env.BASE_URL ||
    "http://localhost:4000"
  );
}

router.post(
  "/import-asset-sheet",
  (req, res) => {
    const {
      fileName,
      rows = 4,
      cols = 4
    } = req.body;

    if (
      !fileName ||
      typeof fileName !== "string"
    ) {
      return sendError(
        res,
        400,
        "MISSING_FIELD",
        "fileName is required.",
        {
          field: "fileName"
        }
      );
    }

    const project = createProject({
      serviceName: "Imported Asset Sheet",

      concept:
        "Imported existing asset sheet for local export testing",

      targetUser: "Developer",
      tone: "test",
      mainMessage: "test",
      prompt: "",
      generatedImageUrl: null,

      assetSheetUrl:
        `${getBaseUrl()}/generated/${fileName}`,

      assetSheetGrid: {
        rows,
        cols,
        imageWidth: 1024,
        imageHeight: 1024
      }
    });

    return sendSuccess(res, project);
  }
);

module.exports = router;