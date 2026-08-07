import type { ApiResult } from "../types/api";

/**
 * unknown が普通のオブジェクトか確認する
 */
function isObject(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/**
 * APIから返ってきたJSONが
 * ApiResultの形式になっているか実行時に確認する
 */
function isApiResult<T>(
  value: unknown
): value is ApiResult<T> {
  if (!isObject(value)) {
    return false;
  }

  if (typeof value.success !== "boolean") {
    return false;
  }

  // 成功レスポンス
  if (value.success === true) {
    return (
      "data" in value &&
      value.error === null
    );
  }

  // 失敗レスポンス
  if (
    value.success === false &&
    value.data === null &&
    isObject(value.error)
  ) {
    return (
      typeof value.error.code === "string" &&
      typeof value.error.message === "string"
    );
  }

  return false;
}

/**
 * APIレスポンスをJSONとして読み込む
 *
 * 1. JSONとして読めるか
 * 2. ApiResult形式になっているか
 * 3. HTTPステータスとsuccessが矛盾していないか
 *
 * を確認する
 */
export async function readJsonResponse<T>(
  response: Response
): Promise<ApiResult<T>> {
  const text = await response.text();

  let parsed: unknown;

  // まずJSONとして解析
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      `API did not return JSON. Status: ${
        response.status
      }. Response preview: ${text.slice(0, 200)}`
    );
  }

  // JSONではあるが、
  // 自分たちのAPI形式ではない場合
  if (!isApiResult<T>(parsed)) {
    throw new Error(
      `API returned an invalid JSON structure. Status: ${
        response.status
      }. Response preview: ${text.slice(0, 200)}`
    );
  }

  /*
   * HTTP的には失敗なのに、
   * JSONが success: true になっていた場合。
   *
   * 例:
   * HTTP 500
   * {
   *   "success": true,
   *   "data": {}
   * }
   */
  if (!response.ok && parsed.success) {
    throw new Error(
      `API returned HTTP ${response.status} but marked the response as successful.`
    );
  }

  /*
   * HTTP 400や404で、
   * 正しく success: false が返っている場合は
   * そのまま返す。
   *
   * 呼び出し元が
   * getApiErrorMessage()で内容を表示できる。
   */
  return parsed;
}

/**
 * APIのエラーレスポンスから、
 * ユーザーへ表示するメッセージを取り出す
 */
export function getApiErrorMessage(
  result: ApiResult<unknown>,
  fallbackMessage: string
): string {
  if (result.success) {
    return fallbackMessage;
  }

  const details = result.error.details;

  if (
    details &&
    typeof details === "object"
  ) {
    const body = details.body;

    if (
      typeof body === "string" &&
      body.trim()
    ) {
      return body;
    }

    const message = details.message;

    if (
      typeof message === "string" &&
      message.trim()
    ) {
      return message;
    }
  }

  return (
    result.error.message ||
    fallbackMessage
  );
}