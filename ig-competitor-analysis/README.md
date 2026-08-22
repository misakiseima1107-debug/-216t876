# Instagram競合分析AI

競合Instagramアカウントを登録しておくだけで、投稿・Reelsを継続的に収集し、
伸びている投稿の特徴を分析し、自分たちが次に投稿すべき企画まで自動生成するシステム。

設計の詳細は `docs/ARCHITECTURE.md`、バズスコアの計算式は `docs/SCORING.md` を参照。

> **状態: 構築中（Phase 1完了、Phase 2着手待ち）**
> このREADMEの運用手順は実装が進み次第、随時更新します。

---

## あなたがやること（運用開始後は基本これだけ）

1. **競合アカウントを登録する** → Googleスプレッドシート `01_Competitors` に行を追加
2. **自社アカウント情報を入力する** → スプレッドシート `10_Settings`
3. **毎日レポートを見る** → スプレッドシート `09_Daily_Report`
4. **良い企画を選んで撮影する** → スプレッドシート `08_Ideas`

それ以外（データ取得・分析・企画生成・レポート作成）はすべて自動で毎日実行されます。

---

## セットアップ（初回のみ、エンジニアが実施）

### 1. 必要なAPIキーを揃える
`.env.example` をコピーして `.env` を作成し、値を埋める。

```
cp .env.example .env
```

必要な値の取得手順は `docs/ARCHITECTURE.md` および開発チャット履歴を参照。

### 2. 依存関係のインストール
```
pip install -r requirements.txt
```

### 3. データベースの初期化
Supabaseプロジェクトの SQL Editor で `db/schema.sql` を実行する。

### 4. GitHub Actionsへの登録
リポジトリの `Settings → Secrets and variables → Actions` で以下を登録:
- `APIFY_API_TOKEN`
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_SERVICE_ACCOUNT_JSON`（JSONファイルの中身をそのまま貼る）
- `GOOGLE_SPREADSHEET_ID`

---

## 困ったときは

- **エラーが出た**: `error_logs` テーブル、または各GitHub Actionsの実行ログを確認
- **APIキーを変更したい**: 上記「GitHub Actionsへの登録」と同じ場所で値を更新するだけ
- **競合を止めたい（削除はしない）**: `01_Competitors` シートの「分析対象ON/OFF」列をOFFにする
