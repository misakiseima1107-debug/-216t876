# バズスコア設計ドキュメント

「それっぽい謎スコア」にしないため、計算式とロジックをすべてここに明文化する。
実装は `src/analysis/buzz_score.py`。数値の妥当性はPhase 5のテストで検証し、
必要に応じて重みを調整する（調整履歴も本ファイルに追記する）。

## 前提: ピアグループ（比較対象グループ）
単純な全体ランキングは意味を持たない（フォロワー100万人の10万再生と
フォロワー5,000人の10万再生は意味が違う）ため、必ず「同規模帯」で比較する。

フォロワー規模バケット:
- `~1000` / `1000-5000` / `5000-10000` / `10000-50000` / `50000-100000` / `100000~`

ピアグループ = 「同じ規模バケット」かつ「直近30〜60日以内に取得した投稿」の集合。

## 基礎指標（実測値ベース、%表記も可）

| 指標 | 計算式 | 意味 |
|---|---|---|
| Views per Follower (VPF) | `views / followers_count` | フォロワーの何倍観られたか |
| Engagement Rate (ER) | `(likes + comments * 3) / views` | 視聴に対する反応の濃さ（コメントは獲得難度が高いため重み3倍。この重み自体は要調整・要検証の暫定値と明記する） |
| Velocity | `views_at_checkpoint / hours_since_posted` | 単位時間あたりの伸び速度 |

## コンポーネントスコア（すべて0〜100のパーセンタイル）

すべて「ピアグループ内で何%位につけているか」で算出する。恣意的な重み付け加算ではなく、
percentile rank（順位のパーセンタイル）を採用することで説明可能性を担保する。

1. **Engagement Score** = ピアグループ内でのER percentile rank
   → 「反応の濃さ」が同規模帯の中でどの位置か

2. **Velocity Score** = 自アカウントの過去投稿のVelocity分布内でのpercentile rank
   （自アカウントの投稿数が少ない場合はピアグループのVelocity分布で代用）
   → 「伸びるスピード」がそのアカウントの平常時と比べて異常か

3. **Relative Performance Score** = 自アカウントの過去投稿のVPF中央値と比較した比率を
   ピアグループ内でpercentile rank化したもの
   → 「そのアカウントの平常時と比べてどれだけ良いか」

4. **Virality Score** = ピアグループ内でのVPF percentile rank
   → 「フォロワーの外にどれだけ拡散したか」

## 最終スコア（Final Buzz Score, 0〜100）

```
Final Buzz Score =
    0.25 * Engagement Score
  + 0.25 * Velocity Score
  + 0.25 * Relative Performance Score
  + 0.25 * Virality Score
```

初期値は等重み（4分割）とする。Phase 5のテストで実データを見て、
「体感で伸びている投稿」と乖離があれば重みを調整し、変更理由をここに追記する。

## Breakout Candidate（小規模アカウント異常伸び検知）

メインスコアとは別フラグとして算出する（スコアをいじって無理に反映しない）。

条件（すべて満たす場合に `is_breakout_candidate = true`）:
- フォロワー規模バケットが `~1000` 〜 `10000-50000` のいずれか
- Virality Score ≥ 90
- Relative Performance Score ≥ 90

## データ不足時の扱い
- shares_count 等、Instagram側から取得できない項目はNULLのまま保持し、
  推測値で埋めない（要求仕様どおり）。
- NULLの指標はスコア計算から除外し、除外した旨を `buzz_scores.notes` に記録する。
