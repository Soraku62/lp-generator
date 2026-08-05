const express = require("express");

const {
  calculateGridSplit
} = require("../services/gridService");

const {
  sendSuccess,
  sendError
} = require("../utils/apiResponse");

const router = express.Router();

router.post("/", (req, res) => {
  const {
    imageUrl,
    imageWidth,
    imageHeight,
    rows,
    cols
  } = req.body;

  if (
    !imageUrl ||
    typeof imageUrl !== "string"
  ) {
    return sendError(
      res,
      400,
      "MISSING_FIELD",
      "imageUrl is required.",
      {
        field: "imageUrl"
      }
    );
  }

  if (
    !Number.isInteger(imageWidth) ||
    imageWidth <= 0
  ) {
    return sendError(
      res,
      400,
      "INVALID_INPUT",
      "imageWidth must be a positive integer.",
      {
        imageWidth
      }
    );
  }

  if (
    !Number.isInteger(imageHeight) ||
    imageHeight <= 0
  ) {
    return sendError(
      res,
      400,
      "INVALID_INPUT",
      "imageHeight must be a positive integer.",
      {
        imageHeight
      }
    );
  }

  if (
    !Number.isInteger(rows) ||
    rows < 1 ||
    rows > 20
  ) {
    return sendError(
      res,
      400,
      "INVALID_GRID_SIZE",
      "rows must be an integer between 1 and 20.",
      {
        rows
      }
    );
  }

  if (
    !Number.isInteger(cols) ||
    cols < 1 ||
    cols > 20
  ) {
    return sendError(
      res,
      400,
      "INVALID_GRID_SIZE",
      "cols must be an integer between 1 and 20.",
      {
        cols
      }
    );
  }

  const result = calculateGridSplit({
    imageUrl,
    imageWidth,
    imageHeight,
    rows,
    cols
  });

  return sendSuccess(res, result);
});

module.exports = router;