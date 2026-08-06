const {
  randomBytes,
  createHash,
  timingSafeEqual
} = require("node:crypto");

/**
 * ユーザーへ渡す秘密トークンを生成する
 */
function generateProjectToken() {
  return randomBytes(32).toString("base64url");
}

/**
 * トークンをSHA-256でハッシュ化する
 *
 * DBには元のトークンではなく、
 * このハッシュ値だけを保存する
 */
function hashProjectToken(token) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

/**
 * 受け取ったトークンと、
 * DBに保存したハッシュを比較する
 */
function verifyProjectToken(
  token,
  expectedTokenHash
) {
  if (
    typeof token !== "string" ||
    typeof expectedTokenHash !== "string"
  ) {
    return false;
  }

  const actualHash = Buffer.from(
    hashProjectToken(token),
    "hex"
  );

  const expectedHash = Buffer.from(
    expectedTokenHash,
    "hex"
  );

  if (actualHash.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(
    actualHash,
    expectedHash
  );
}

module.exports = {
  generateProjectToken,
  hashProjectToken,
  verifyProjectToken
};