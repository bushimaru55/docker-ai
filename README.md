# ローカルLLM分析システム

Excel営業データをローカル環境で分析するWebアプリケーションです。Ollamaを使用したローカルLLMによる分析機能を提供します。

## 機能

- Excelデータのアップロードと分析
- プロンプトによる柔軟な分析指示
- 分析結果のテキスト＆グラフ表示
- 結果データの保存と履歴管理
- ローカルLLM（Ollama）による分析

## 技術スタック

- フロントエンド: Next.js, React, Material-UI, Chart.js
- バックエンド: Node.js, Express, TypeScript
- データベース: SQLite
- LLM: Ollama
- コンテナ化: Docker

## セットアップ

1. リポジトリのクローン:
```bash
git clone [repository-url]
cd local-llm-analysis
```

2. 環境の起動:
```bash
docker-compose up --build
```

3. アプリケーションへのアクセス:
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:3001
- Ollama API: http://localhost:11434

## 開発

### フロントエンド開発
```bash
cd frontend
npm install
npm run dev
```

### バックエンド開発
```bash
cd backend
npm install
npm run dev
```

## ライセンス

MIT License 