const {
  findProjectAccessById
} = require("../store/projectStore");

const {
  verifyProjectToken
} = require("../security/projectToken");

const {
  sendError
} = require("../utils/apiResponse");

/**
 * IDとアクセストークンが一致するか確認する
 */
function requireProjectAccess(
  req,
  res,
  next
) {
  const token = req.get(
    "X-Project-Token"
  );

  if (!token) {
    return sendError(
      res,
      401,
      "PROJECT_TOKEN_REQUIRED",
      "X-Project-Token header is required."
    );
  }

  const accessRecord =
    findProjectAccessById(req.params.id);

  const isValid =
    accessRecord &&
    accessRecord.accessTokenHash &&
    verifyProjectToken(
      token,
      accessRecord.accessTokenHash
    );

  if (!isValid) {
    // トークンが違う場合も、
    // プロジェクトの存在を教えない
    return sendError(
      res,
      404,
      "PROJECT_NOT_FOUND",
      "Project not found."
    );
  }

  // 後続のルートから使えるようにする
  req.project = accessRecord.project;

  return next();
}

module.exports = {
  requireProjectAccess
};