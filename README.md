# Slack Meeting Summary Bot（サンプルリポジトリ）
```mermaid
graph TB
    style User fill:#f9d5e5,stroke:#333,stroke-width:2px
    style Slack fill:#e2e2e2,stroke:#333,stroke-width:2px
    style AWS fill:#d5f9e3,stroke:#333,stroke-width:2px
    style SF fill:#d5f9e3,stroke:#333,stroke-width:2px
    style LC fill:#d5f9e3,stroke:#333,stroke-width:2px
    style GW fill:#f9e5d5,stroke:#333,stroke-width:2px
    style CL fill:#f9e5d5,stroke:#333,stroke-width:2px

    subgraph "User"
        LC["CLOVA Note"]
    end

    subgraph "Slack"
        SL["Slack Channel"]
    end

    subgraph AWS["Slack App / Amazon Web Service"]
        AS["Amazon S3"]
        CF["Cloud Formation"]
        AG["API Gateway"]
        LA["Lambda"]
    end


    subgraph GW["Google Workspace"]
        GS["Google Apps Script"]
        GD["Google Docs"]
    end

    subgraph LD["Local Development"]
        subgraph SF["Serverless Framework"]
            BL["Bolt / TypeScript"]
        end
        subgraph CL["Clasp"]
            LGS["Google Apps Script"]
        end
    end
    LC -->|1. send .txt file| SL
    CF --> AS
    CF --> AG
    SL -->|2. send file_shared events| AG
    AG -->|3. route request| LA
    LA -->|4. send reply| SL
    GS -->|7. send summary| SL
    GS -->|6. create docs| GD
    SL -->|reply/summary| User
    CL -->|deploy| GS
    LA -->|5.post| GS
    SF -->|deploy| CF
```

## AWS
Slack botをServerless Frameworkを使ってデプロイ。
時間のかかるOpenAIの処理はLambda上で処理せず、Google Apps Scriptに委譲している。

- Slackからのイベント受け取り
- Google Apps ScriptへのPOST


## Google Apps Script
Webアプリとしてデプロイ。

- OpenAI APIを使って要約
- Slack投稿

# Setup
## Slack
アプリの設定。

- アプリの作成
  - https://api.slack.com/apps
- Event Subscriptionsの設定
  - AWSにデプロイしたURLをRequest　URLに設定。
  - bot eventsを設定
 
|  |  |
|:-:|:-:|
|<img width="698" alt="image" src="https://github.com/HosakaKeigo/slack_summarize/assets/74914629/3ec903da-7176-43cc-9330-1babaae6f535">|<img width="661" alt="254448335-1e8b1d6a-c280-446e-a8e3-e2eaae29b6d7" src="https://github.com/HosakaKeigo/slack-summarizer/assets/74914629/820abe1b-34fe-4a36-bf57-a799db1ec331">|

- App Homeの設定
  - App Display Name等を設定 
  - Show Tabsから、*Allow users to send Slash commands and messages from the messages tab*を有効化。
<img width="665" alt="image" src="https://github.com/HosakaKeigo/slack_summarize/assets/74914629/5e8f40d3-0a3a-4504-90f5-ddd94b9f90ea">

- OAuth & Permissionsの設定
  - Bot Token Scopesを設定
    - channels:read / channels:history / chat:write / files:read  

- Workspaceへのインストール
  - Install Appからインストール
  - **Bot User OAuth Token**を取得

- Basic Information > App Credentialsから**Signing Secret**を取得

## Google Apps Script
OpenAI APIにアクセスする処理を担う。

- Google Apps Scriptを作成。
- `appsscript.json`に作成したScript IDを指定
- スクリプトプロパティに下記を指定
  - OPENAI_API_KEY
  - SLACK_BOT_TOKEN
    - Bot User OAuth Token
  - ERROR_MAIL_ADDRESS 
- `clasp push`
- `clasp deploy`
  - Webアプリとしてデプロイ。デプロイしたURLはSlack Appの環境変数に指定する。

## Slack App（AWS）
- IAMの設定
  - Serverless Frameworkを用いたデプロイで必要 
    - S3
    - IAM
    - Lambda
    - API Gateway
    - Cloudwatch Logs
    - Cloud Formation

>**Note**
>
>https://zenn.dev/peg/articles/93d844f6dd11c9

- aws cliのconfigyre
- Slack Appの`.env`の設定
```.env
SLACK_BOT_TOKEN=<xoxb-...>
SLACK_SIGNING_SECRET=<Your Secret>
GAS_API_URL=https://script.google.com/macros/s/<Script ID>/exec
```

デプロイ方法は以下。
```
serverless deploy
```

環境は、`--stage prod`など`--stage`フラグで分けられる。

# Usage
- Clova Noteで録音・文字起こし
- 文字起こしを修正
  - 参加者名の入力など
- 右上のメニューから「音声記録のダウンロード」
- Slackで共有。アプリをインストールしたチャンネルに投稿

|  |  |
|:-:|:-:|
|![image1](https://github.com/HosakaKeigo/slack_summarize/assets/74914629/4002ebed-5f31-4823-b312-63ddf2c42c5f)|![image2](https://github.com/HosakaKeigo/slack_summarize/assets/74914629/801365d1-f0d6-4123-bb80-269b300017b5)|

- しばらくすると要約が送信されます。
