import * as dotenv from 'dotenv'
import { App, AwsLambdaReceiver } from "@slack/bolt"
import { postGAS } from './postGAS';

const awsLambdaReceiver = new AwsLambdaReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
});

dotenv.config()

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: awsLambdaReceiver,
  processBeforeResponse: true
});
// ======================================
// メッセージ受け取り → ファイル取得 →　テキスト要約（Google Apps Scriptでの実行）

app.message(async ({ message, client, context, payload }) => {
  console.log("message")
  if (context.retryNum) {
    console.log(
      `skipped retry. retryReason: ${context.retryReason}`
    );
    return;
  }

  if (message.subtype === "file_share" && message.files) {
    if (!process.env.GAS_API_URL) {
      await client.chat.postMessage({
        text: "すみません、要約サーバーのURLが設定されていません。",
        channel: message.channel,
        thread_ts: payload.event_ts
      })
      return
    }
    if (message.files.length > 1) {
      await client.chat.postMessage({
        text: "ファイルは一つだけ送信してください。",
        channel: message.channel,
        thread_ts: payload.event_ts
      })
      return
    }

    const file = message.files[0]
    const allowedFileTypes = ["text/plain"]
    if (!allowedFileTypes.includes(file.mimetype)) {
      await client.chat.postMessage({
        text: ".txtファイルを送信してください。",
        channel: message.channel,
        thread_ts: payload.event_ts
      })
      return
    }

    const fileInfo = await client.files.info({ file: file.id })
    if (!fileInfo.content) {
      await client.chat.postMessage({
        text: "すみません、ファイル情報の取得に失敗しました。",
        channel: message.channel,
        thread_ts: payload.event_ts
      })
      return;
    }

    postGAS({ content: fileInfo.content, channel: message.channel, thread_ts: payload.event_ts })
    await client.chat.postMessage({ text: `要約中です...完了したらお知らせします。字数：${fileInfo.content.length}`, channel: message.channel, thread_ts: payload.event_ts })
    return
  }
});

export const handler = async (event, context, callback) => {
  const handler = await awsLambdaReceiver.start();
  return handler(event, context, callback);
}