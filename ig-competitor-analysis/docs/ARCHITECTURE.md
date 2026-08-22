# アーキテクチャ概要

## 目的
競合Instagramアカウントを登録するだけで、投稿・Reelsを継続的に収集し、伸びている投稿の特徴を分析し、自分たちが投稿すべき企画まで自動生成する。

## 全体フロー

```
[Google Sheets: 01_Competitors / 10_Settings]  ← 人間が編集
              │ (読み込み)
              ▼
     collectors/competitors.py ── 競合マスタをSupabaseへ同期
              │
              ▼
     collectors/posts.py ── Apifyで新規投稿/Reelsを差分取得
              │
              ▼
     collectors/performance_tracker.py ── 既存投稿の数値を
         first_seen / 24h / 72h / 7d の近似タイミングで再取得
              │
              ▼
        Supabase (Postgres) に保存
              │
              ▼
     analysis/buzz_score.py ── 全投稿にバズスコアを計算
              │  (閾値を超えた投稿だけ次へ。コスト最適化)
              ▼
     analysis/{hook,structure,caption,comment}_analyzer.py
         ── Claude APIで構造化分析、DBへ保存（同じ投稿は再分析しない）
              │
              ▼
     analysis/pattern_extractor.py / trend_detector.py / content_gap.py
         ── 蓄積データを横断分析
              │
              ▼
     analysis/idea_generator.py
         ── 自社アカウント情報(09_Settingsの自社情報)と掛け合わせ企画生成
              │
              ▼
     reports/daily_report.py / weekly_report.py
              │
              ▼
     sheets/sheets_sync.py ── Google Sheetsへ書き出し
              │
              ▼
[Google Sheets: 02〜09シート]  ← 人間が確認
```

## 実行トリガー
- `.github/workflows/daily.yml`: 毎日1回、新規投稿取得→数値更新→分析→企画→Daily Report
- `.github/workflows/weekly.yml`: 週1回、直近7日横断分析→Weekly Report

## データの信頼度区分
すべての分析結果は次のいずれかのラベルを付けて保存・表示する。
- `data`: Apify等から直接取得した実測値
- `ai_analysis`: Claude APIによる構造化分析結果
- `hypothesis`: 相関や傾向からの推測・仮説

## コスト最適化方針
1. 新規投稿はまず基本データ（数値・メタ情報）のみ取得
2. バズスコアが閾値以上の投稿のみClaude APIで詳細分析
3. 分析結果はDBに保存し、同一投稿・同一分析種別は再実行しない
4. 一次選別にはHaiku、深掘り分析にはSonnetを使い分ける

## エラー処理方針
各ステージ（取得/分析/出力）はtry-exceptで独立させ、1件の失敗が
パイプライン全体を止めないようにする。失敗は `error_logs` テーブルと
実行ログに記録し、`pipeline_runs` に実行サマリを残す。
