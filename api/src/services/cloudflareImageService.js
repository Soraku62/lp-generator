const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");

const { GENERATED_DIR } = require("../config/paths");

/**
 * ルートへ渡すための、情報付きエラーを作る
 */
function createServiceError(
  code,
  httpStatus,
  message,
  details = null
) {
  const error = new Error(message);

  error.code = code;
  error.httpStatus = httpStatus;
  error.details = details;

  return error;
}

/**
 * Cloudflareの環境変数を確認する
 */
function validateCloudflareConfig() {
  if (
    !process.env.CLOUDFLARE_API_TOKEN ||
    !process.env.CLOUDFLARE_ACCOUNT_ID
  ) {
    throw createServiceError(
      "CONFIG_ERROR",
      500,
      "Cloudflare API token or Account ID is missing."
    );
  }
}

/**
 * Cloudflareのレスポンスを画像ファイルとして保存する
 */
async function saveCloudflareImageResponse(
  response,
  filePrefix
) {
  await fs.mkdir(GENERATED_DIR, {
    recursive: true
  });

  const contentType =
    response.headers.get("content-type") || "";

  console.log(
    "Cloudflare response content-type:",
    contentType
  );

  // 画像データが直接返された場合
  if (contentType.startsWith("image/")) {
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extension = "jpg";

    if (contentType.includes("png")) {
      extension = "png";
    }

    if (contentType.includes("webp")) {
      extension = "webp";
    }

    const fileName =
      `${filePrefix}-${Date.now()}-` +
      `${randomUUID()}.${extension}`;

    const filePath = path.join(
      GENERATED_DIR,
      fileName
    );

    await fs.writeFile(filePath, buffer);

    return fileName;
  }

  // JSONが返された場合
  const text = await response.text();

  console.log("Cloudflare raw response:", text);

  let json;

  try {
    json = JSON.parse(text);
  } catch (error) {
    throw createServiceError(
      "CLOUDFLARE_RESPONSE_ERROR",
      502,
      "Cloudflare response was neither an image nor valid JSON.",
      {
        preview: text.slice(0, 500)
      }
    );
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
    throw createServiceError(
      "CLOUDFLARE_RESPONSE_ERROR",
      502,
      "Cloudflare returned an unsupported response format.",
      {
        response: json
      }
    );
  }

  const cleanedBase64 = maybeBase64.replace(
    /^data:image\/\w+;base64,/,
    ""
  );

  const buffer = Buffer.from(
    cleanedBase64,
    "base64"
  );

  const fileName =
    `${filePrefix}-${Date.now()}-` +
    `${randomUUID()}.png`;

  const filePath = path.join(
    GENERATED_DIR,
    fileName
  );

  await fs.writeFile(filePath, buffer);

  return fileName;
}

/**
 * Cloudflareへプロンプトを送り、画像を保存する
 */
async function generateCloudflareImage({
  prompt,
  steps,
  filePrefix
}) {
  validateCloudflareConfig();

  const model =
    process.env.CF_IMAGE_MODEL ||
    "@cf/black-forest-labs/flux-2-klein-9b";

  const cloudflareUrl =
    `https://api.cloudflare.com/client/v4/accounts/` +
    `${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`;

  const form = new FormData();

  form.append("prompt", prompt);
  form.append("width", "1024");
  form.append("height", "1024");
  form.append("steps", String(steps));

  console.log("Cloudflare URL:", cloudflareUrl);
  console.log("Cloudflare model:", model);

  let response;

  try {
    response = await fetch(cloudflareUrl, {
      method: "POST",
      headers: {
        Authorization:
          `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
      },
      body: form
    });
  } catch (error) {
    throw createServiceError(
      "CLOUDFLARE_AI_ERROR",
      502,
      "Could not connect to Cloudflare Workers AI.",
      {
        message: error.message
      }
    );
  }

  if (!response.ok) {
    const errorText = await response.text();

    throw createServiceError(
      "CLOUDFLARE_AI_ERROR",
      502,
      "Cloudflare Workers AI request failed.",
      {
        status: response.status,
        body: errorText
      }
    );
  }

  const fileName =
    await saveCloudflareImageResponse(
      response,
      filePrefix
    );

  return {
    fileName,
    model
  };
}

module.exports = {
  generateCloudflareImage
};