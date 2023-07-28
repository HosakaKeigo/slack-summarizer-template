/**
 * Slack botからのリクエストを処理
 * 1. GPTで受け取った文字起こしテキストを要約
 * 2. Googleドキュメントに保存
 * 3. 要約／原文／GoogleドキュメントのURLをSlackに送信
 *
 * スクリプトプロパティ
 * SLACK_BOT_TOKEN: Slack: Bot tokens
 * OPENAI_API_KEY
 */
function doPost(e: GoogleAppsScript.Events.DoPost) {
  let request: SlackPostData;

  try {
    request = parseRequest(e);
    const responseData = processRequest(request);
    return createJsonResponse(responseData);
  } catch (error) {
    return handleError(error, request);
  }
}
