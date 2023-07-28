/**
 * 必要なスクリプトプロパティ名
 */
const ScriptPropertyKeysMap = {
  SLACK_TOKEN: "SLACK_BOT_TOKEN",
  OPENAI_API_KEY: "OPENAI_API_KEY",
  ERROR_MAIL_ADDRESS: "ERROR_MAIL_ADDRESS",
}

const SLACK_URL = "https://slack.com/api/chat.postMessage"

// エラー通知メールアドレス（Slackエラーの場合）
const ERROR_MAIL_CONFIG = {
  recipient: getScriptProperty("ERROR_MAIL_ADDRESS"),
  subject: "エラー通知(議事録要約bot)",
  body: "エラーが発生しました。"
}

// Google Documentsの共有設定
const FILE_PERMISSION = DriveApp.Access.DOMAIN_WITH_LINK
const FILE_PERMISSION_TYPE = DriveApp.Permission.VIEW

// 議事録保管場所のフォルダ名
const DIRECTORY_PATH = `議事録/${new Date().getFullYear()}/${new Date().getMonth() + 1}月`

// OpenAI関連
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const CHUNK_SIZE = 10000; // 16kを想定
const DEFAULT_MODEL = "gpt-3.5-turbo-16k-0613"
// Function calling用関数スキーマ
const GPT_FUNCTION = [
  {
    "name": "createGoogleDocument",
    "description": "useful when create a summarized document",
    "parameters": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "A title of document"
        },
        "body": {
          "type": "string",
          "description": "A summary of document"
        }
      },
      "required": ["title", "body"]
    }
  }]