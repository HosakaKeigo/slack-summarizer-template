class API_Error extends Error {
  data: ErrorData;

  constructor(data: ErrorData) {
    super(data.message);
    this.data = data;
  }

  public formatErrorMessage(): string {
    const error = this.data
    const errorMessage = []
    errorMessage.push("[エラーコード]\n" + error.code)
    errorMessage.push("[エラー内容]\n" + error.message)
    errorMessage.push("[詳細]\n" + error.details)
    return errorMessage.join("\n\n")
  }
}

type ErrorType = "INVALID_REQUEST_ARG" | "MISSING_SCRIPT_PROPERTIES" | "SLACK_SEND_MESSAGE_ERROR" | "OPENAI_FUNCTION_CALL_ERROR" | "OPENAI_FUNCTION_CALL_ARGUMENT_ERROR" | "GOOGLE_DOCUMENT_CREATE_ERROR";

const ErrorMap: Record<ErrorType, ErrorData> = {
  INVALID_REQUEST_ARG: {
    code: 400,
    message: "Bad Request",
    details: "Request argument is invalid.",
  },
  MISSING_SCRIPT_PROPERTIES: {
    code: 500,
    message: "Internal Server Error",
    details: "Missing script property.",
  },
  SLACK_SEND_MESSAGE_ERROR: {
    code: 401,
    message: "Slack Error",
    details: "Failed to send message to Slack.",
  },
  OPENAI_FUNCTION_CALL_ERROR: {
    code: 500,
    message: "OpenAI Function call error",
    details: "function_call property not found in the response from OpenAI API.",
  },
  OPENAI_FUNCTION_CALL_ARGUMENT_ERROR: {
    code: 500,
    message: "OpenAI Function call property error",
    details: "expected property not found in the function_call.arguments.",
  },
  GOOGLE_DOCUMENT_CREATE_ERROR: {
    code: 500,
    message: "Google Document Create Error",
    details: "Failed to create Google Document.",
  },
};

function handleError(error: API_Error | Error, request: SlackPostData): GoogleAppsScript.Content.TextOutput {
  console.error(error);

  if (error instanceof API_Error) {
    console.warn("handling API_Error");
    sendAppropriateNotification(error, request);
    return createJsonResponse({ error: error.data }, error.data.code);
  }

  console.warn("handling general Error");
  const internalError = {
    code: 500,
    message: error.message || "Unknown Error",
    details: "Internal Server Error"
  };
  errorNotificationSlack(error.message || "Unknown Error", request);
  return createJsonResponse({ error: internalError }, 500);
}

/**
 * Slackがエラーの場合は、Gmailで通知
 * @param error
 */
function sendAppropriateNotification(error: API_Error, request: SlackPostData): void {
  if (error.data === ErrorMap.SLACK_SEND_MESSAGE_ERROR || error.data === ErrorMap.INVALID_REQUEST_ARG) {
    return errorNotificationMail(error.formatErrorMessage());
  }

  try {
    errorNotificationSlack(error.formatErrorMessage(), request);
  } catch (e) {
    console.error("Slack通知エラー：" + e.message);
    errorNotificationMail(error.formatErrorMessage());
  }
}

function errorNotificationMail(errorMessage: string) {
  const mailConfig = ERROR_MAIL_CONFIG
  mailConfig.body += "\n\n" + errorMessage
  GmailApp.sendEmail(mailConfig.recipient, mailConfig.subject, mailConfig.body);
}

function errorNotificationSlack(errorMessage: string, request: SlackPostData) {
  const { channel, thread_ts } = request
  postSlackMessage({ text: "下記のエラーが発生しました。\n\n" + errorMessage, channel, thread_ts })
}