function mockPost() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        "content": "Hello World!",
        "channel": "111111111",
        "thread_ts": "111111111.111111"
      })
    }
  } as GoogleAppsScript.Events.DoPost

  doPost(mockEvent)
}
