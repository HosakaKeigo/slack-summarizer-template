function processRequest(data: SlackPostData): API_SUCCESS {
  const { content, channel, thread_ts } = data

  // シート記録
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("log") ?? SpreadsheetApp.getActiveSpreadsheet().insertSheet("log")
  sheet.appendRow([new Date(), content, channel, thread_ts])

  // 要約
  const chunks = chunkText(content, CHUNK_SIZE);
  const summary: Summary = {
    title: "",
    body: ""
  }

  const summaries: Summary[] = []
  let googleDocument: GoogleAppsScript.Document.Document

  // 文字数が多い場合は分割して要約する
  chunks.forEach((chunk, index) => {
    const part = chunks.length > 1 ? `(${index + 1} of ${chunks.length})` : ""

    const isSequel = index !== 0 // 2回目以降の場合は、先行する要約を踏まえるように処理を変える。
    const openaiSummary = summarize("[draft of a meeting]\n" + chunk, isSequel);

    summary.title = openaiSummary.title
    summary.body = openaiSummary.body
    summaries.push(openaiSummary)

    // Google Document作成
    // 2回目以降は同じドキュメントに追記する
    try {
      if (!googleDocument) {
        googleDocument = createDocument(summary);
      }
      else {
        appendToDocument(part + "\n\n" + summary.body, googleDocument);
      }

      if (index === chunks.length - 1) { // 末尾に文字起こし原文を追記する。
        appendToDocument("【文字起こし原文】\n" + content, googleDocument);
      }
    } catch (e) {
      const error = ErrorMap.GOOGLE_DOCUMENT_CREATE_ERROR
      error.details += e.message
      throw new API_Error(error)
    }

    const googleDocumentUrl = "\n\n[Google Document]\n" + `https://docs.google.com/document/d/${googleDocument.getId()}/edit?usp=sharing`
    const text = [part, "---", summary.body, googleDocumentUrl].join("\n\n")

    // Slack送信
    postSlackMessage({ text, channel, thread_ts })
  })

  const result: API_SUCCESS = {
    summaries: [summary]
  }
  console.log("success: " + JSON.stringify(result))

  return result
}

function parseRequest(e: GoogleAppsScript.Events.DoPost): SlackPostData {
  const data = e.postData.contents;
  const json = JSON.parse(data) as SlackPostData;

  const { content, channel, thread_ts } = json;
  if (!content || !channel || !thread_ts) {
    throw new API_Error(ErrorMap.INVALID_REQUEST_ARG);
  }
  return json
}