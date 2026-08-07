const express = require("express");
const cors = require("cors");

const {
  GENERATED_DIR,
  ASSETS_DIR,
  EXPORTS_DIR
} = require("./config/paths");

const projectRoutes =
  require("./routes/projectRoutes");

const gridRoutes =
  require("./routes/gridRoutes");

const devRoutes =
  require("./routes/devRoutes");

const app = express();

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  "http://localhost:3000,http://localhost:3001"
)
  .split(",")
  .map((origin) => origin.trim());

  const {
  sendError
} = require("./utils/apiResponse");

app.use(
  cors({
    origin(origin, callback) {
      // curlやPostmanなど、
      // Originがないリクエストも許可
      if (
        !origin ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      console.warn(
        "Blocked by CORS:",
        origin
      );

      console.warn(
        "Allowed origins:",
        allowedOrigins
      );

      return callback(null, false);
    },

    methods: [
      "GET",
      "POST",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Project-Token"
    ]
  })
);

app.use(express.json());

// 生成ファイルの公開
app.use(
  "/generated",
  express.static(GENERATED_DIR)
);

app.use(
  "/assets",
  express.static(ASSETS_DIR)
);

app.use(
  "/exports",
  express.static(EXPORTS_DIR)
);

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

// ルートを接続
app.use("/projects", projectRoutes);
app.use("/grid-splits", gridRoutes);
app.use("/dev", devRoutes);

// 存在しないAPIへの共通404レスポンス
app.use((req, res) => {
  return sendError(
    res,
    404,
    "ROUTE_NOT_FOUND",
    "Route not found.",
    {
      method: req.method,
      path: req.originalUrl
    }
  );
});

module.exports = app;