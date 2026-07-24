function sendSuccess(res, data, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    error: null
  });
}

function sendError(res, status, code, message, details = null) {
  return res.status(status).json({
    success: false,
    data: null,
    error: {
      code,
      message,
      details
    }
  });
}

function sendCaughtError(res, error, fallbackMessage) {
  // サービス側が意図的に作ったエラー
  if (error.httpStatus && error.code) {
    return sendError(
      res,
      error.httpStatus,
      error.code,
      error.message,
      error.details || null
    );
  }

  // 想定していなかったエラー
  return sendError(
    res,
    500,
    "INTERNAL_SERVER_ERROR",
    fallbackMessage,
    {
      message: error.message
    }
  );
}

module.exports = {
  sendSuccess,
  sendError,
  sendCaughtError
};