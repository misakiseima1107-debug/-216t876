"""Phase 2/4 PoC: 指定したInstagramアカウント(ユーザー名)の実際の投稿データを取得し、
Claude APIで「なぜ伸びているか」「TTP(徹底的にパクる)できるポイント」を実データベースで
言語化するリサーチスクリプト。

このサンドボックスからはApifyへの通信がブロックされているため、
GitHub Actions (.github/workflows/poc_research.yml) から実行して検証する。

出力は reports/poc_account_report.md に保存する。
"""
import json
import os
import sys
from datetime import datetime, timezone

import anthropic

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from src.collectors.apify_client import ApifyClient  # noqa: E402
from src.pipeline.poc_hashtag_research import normalize_post, views_per_follower  # noqa: E402

MAX_POSTS_PER_ACCOUNT = 12


def build_analysis_prompt(username: str, posts: list[dict]) -> str:
    rows = []
    for i, p in enumerate(posts, 1):
        vpf = views_per_follower(p)
        rows.append(
            f"{i}. 投稿タイプ:{p['type']} | 再生数:{p['video_view_count']} | いいね:{p['like_count']} | "
            f"コメント:{p['comment_count']} | Views/Followers:{vpf} | 動画尺:{p['video_duration']}\n"
            f"   キャプション: {(p['caption'] or '')[:250]}\n"
            f"   ハッシュタグ: {', '.join(p['hashtags'][:10])}\n"
            f"   URL: {p['url']}"
        )
    posts_block = "\n".join(rows) if rows else "(投稿データを取得できませんでした)"
    followers = posts[0]["owner_followers"] if posts else None

    return f"""以下は、Instagramアカウント @{username} (フォロワー数:{followers}) から実際に取得した
投稿の実データです(公開情報のみ、本人アカウントの投稿一覧から取得)。

このアカウントを「TTP(徹底的にパクる)」して、こちらの新規アカウント
(コンセプト: 難攻不落系キャラクター×美容ルーティン×キャンパスファッション、女子大生ジャンル、
案件獲得が目的、週3〜5投稿)に活かすため分析してください。

# 実データ
{posts_block}

# 出力ルール(厳守)
- 【実データ】: 上記の数値・キャプション・ハッシュタグから直接読み取れる事実のみ
- 【AI分析】: 実データから推測される構造・パターン(あなたの解釈)
- 【仮説】: データ量が少なく確証がない推測
以上の3種類を必ず明示的に分けて記述すること。動画本体(カット割り・話す速度・表情等)は
キャプションからは判断できないため、その点は正直に「動画本体は未取得のため分析対象外」と明記すること。

# 分析してほしい項目
1. このアカウントの投稿の中で、Views/Followersが高い投稿に共通する特徴(あれば)
2. キャプションの型・Hookの傾向
3. 投稿頻度・投稿タイプの傾向(取得できた範囲で)
4. このアカウントから「TTPできる」具体的な要素を3つ(構成・言葉選び・世界観など、映像そのものの模倣ではなく構造の抽出)
5. このアカウントの弱点・伸び悩みポイントがあれば(Content Gapの仮説)
"""


def main():
    usernames = [u.strip() for u in os.environ.get("RESEARCH_ACCOUNTS", "").split(",") if u.strip()]
    if not usernames:
        print("RESEARCH_ACCOUNTS が指定されていません(カンマ区切りで指定)。", file=sys.stderr)
        sys.exit(1)

    apify = ApifyClient()
    client = anthropic.Anthropic()

    os.makedirs("reports", exist_ok=True)
    report_lines = [
        "# Phase 2/4 PoC: 指定アカウント リサーチレポート",
        f"取得日時(UTC): {datetime.now(timezone.utc).isoformat()}",
        f"対象アカウント: {', '.join('@' + u for u in usernames)}",
        "",
    ]
    all_raw = {}

    for username in usernames:
        report_lines.append(f"\n## @{username}\n")
        try:
            raw_items = apify.fetch_profile_posts([username], results_per_profile=MAX_POSTS_PER_ACCOUNT)
        except Exception as e:  # noqa: BLE001
            report_lines.append(f"取得エラー: {e}")
            continue

        posts = [normalize_post(p) for p in raw_items if p]
        all_raw[username] = posts

        if not posts:
            report_lines.append("投稿データを取得できませんでした(非公開アカウント/削除/取得制限の可能性)。")
            continue

        report_lines.append("### 【実データ】取得投稿一覧\n")
        for i, p in enumerate(posts, 1):
            report_lines.append(
                f"{i}. [{p['type']}]({p['url']}) - 再生数:{p['video_view_count']} / "
                f"いいね:{p['like_count']} / コメント:{p['comment_count']} / "
                f"Views_per_Follower:{views_per_follower(p)}"
            )

        prompt = build_analysis_prompt(username, posts)
        resp = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        )
        analysis_text = "".join(block.text for block in resp.content if hasattr(block, "text"))
        report_lines.append("\n### Claude分析結果\n")
        report_lines.append(analysis_text)

    with open("reports/poc_account_raw.json", "w", encoding="utf-8") as f:
        json.dump(all_raw, f, ensure_ascii=False, indent=2)

    report_path = "reports/poc_account_report.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    print(f"Report written to {report_path}")


if __name__ == "__main__":
    main()
