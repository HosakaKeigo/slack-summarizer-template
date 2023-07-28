import * as dotenv from 'dotenv'

dotenv.config()

/**
 * Google Apps Scriptへアクセス。
 * 1. 要約
 * 2. Slackへ投稿
 */
async function postGAS({ content, channel, thread_ts }: {
  content: string;
  channel: string;
  thread_ts: string
}) {
  if (!process.env.GAS_API_URL) {
    throw new Error("GAS_API_URL is not defined")
  }
  const response = await fetch(process.env.GAS_API_URL,
    {
      method: "post",
      body: JSON.stringify({
        content,
        channel,
        thread_ts
      }),
    })
  return response.json()
}

export { postGAS }