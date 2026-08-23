"""Phase 2 PoC: ハッシュタグから実際のReels/投稿データを取得し、
Claude APIで「なぜ伸びているか」を実データベースで言語化するリサーチスクリプト。

このサンドボックスからはApifyへの通信がブロックされているため、
GitHub Actions (.github/workflows/poc_research.yml) から実行して検証する。

出力は reports/poc_research_report.md に保存する。
"""
import json
import os
import sys
from datetime import datetime, timezone

import anthropic

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from src.collectors.apify_client import ApifyClient  # noqa: E402

MAX_POSTS_FOR_ANALYSIS = 25


def normalize_post(raw: dict) -> dict:
    """apify/instagram-scraperの出力スキーマは項目により表記ゆれがあるため、
    複数の想定フィールド名をフォールバックしながら正規化する。
    取得できない項目はNoneのまま保持し、推測値で埋めない。
    """
    def pick(*keys):
        for k in keys:
            if k in raw and raw[k] not in (None, ""):
                return raw[k]
        return None

    return {
        "url": pick("url", "postUrl"),
        "owner_username": pick("ownerUsername", "username"),
        "owner_followers": pick("ownerFollowersCount", "followersCount"),
        "caption": pick("caption"),
        "hashtags": pick("hashtags") or [],
        "type": pick("type", "productType"),
        "video_view_count": pick("videoViewCount", "videoPlayCount", "playsCount"),
        "like_count": pick("likesCount"),
        "comment_count": pick("commentsCount"),
        "video_duration": pick("videoDuration"),
        "timestamp": pick("timestamp"),
    }


def views_per_follower(post: dict):
    v, f = post.get("video_view_count"), post.get("owner_followers")
    if v is None or not f:
        return None
    return round(v / f, 3)


def build_analysis_prompt(posts: list[dict]) -> str:
    rows = []
    for i, p in enumerate(posts, 1):
        vpf = views_per_follower(p)
        rows.append(
            f"{i}. @{p['owner_username']} | フォロワー数:{p['owner_followers']} | "
            f"再生数:{p['video_view_count']} | いいね:{p['like_count']} | コメント:{p['comment_count']} | "
            f"Views/Followers:{vpf} | 投稿タイプ:{p['type']}\n"
            f"   キャプション: {(p['caption'] or '')[:200]}\n"
            f"   ハッシュタグ: {', '.join(p['hashtags'][:10])}\n"
            f"   URL: {p['url']}"
        )
    posts_block = "\n".join(rows)

    return f"""以下は、Instagramで実際に取得した投稿の実データです(ハッシュタグ検索経由、公開情報のみ)。
「女子大生・美容・キャンパスファッション」ジャンルで案件獲得を目指すアカウントの企画に活かすため、
このデータから読み取れることを分析してください。

# 実データ
{posts_block}

# 出力ルール(厳守)
- 【実データ】: 上記の数値・キャプション・ハッシュタグから直接読み取れる事実のみ
- 【AI分析】: 実データから推測される構造・パターン(あなたの解釈)
- 【仮説】: データ量が少なく確証がない推測
以上の3種類を必ず明示的に分けて記述すること。動画の中身(カット割り・話す速度等)は
キャプションからは判断できないため、その点は正直に「動画本体は未取得のため分析対象外」と明記すること。

# 分析してほしい項目
1. Views/Followersが高い投稿に共通する特徴(あれば)
2. キャプションの冒頭(Hook)によく使われている型・言葉
3. よく使われているハッシュタグの傾向
4. 投稿タイプ(Reel/写真/カルーセル)別の傾向
5. 「女子大生・難攻不落キャラ・美容」という今回の企画コンセプトに転用できそうなポイント3つ
6. 逆に、このジャンルでまだ手薄に見える切り口(Content Gapの仮説)
"""


def main():
    hashtags = [h.strip() for h in os.environ.get("RESEARCH_HASHTAGS", "").split(",") if h.strip()]
    if not hashtags:
        print("RESEARCH_HASHTAGS が指定されていません(カンマ区切りで指定)。", file=sys.stderr)
        sys.exit(1)

    apify = ApifyClient()
    raw_posts = []
    errors = []
    for tag in hashtags:
        try:
            items = apify.search_by_hashtags([tag], results_per_hashtag=15)
            raw_posts.extend(items)
        except Exception as e:  # noqa: BLE001
            errors.append(f"#{tag}: {e}")

    posts = [normalize_post(p) for p in raw_posts if p]
    posts = [p for p in posts if p.get("owner_username")]

    posts.sort(key=lambda p: (views_per_follower(p) or -1), reverse=True)
    top_posts = posts[:MAX_POSTS_FOR_ANALYSIS]

    os.makedirs("reports", exist_ok=True)
    raw_dump_path = "reports/poc_research_raw.json"
    with open(raw_dump_path, "w", encoding="utf-8") as f:
        json.dump(posts, f, ensure_ascii=False, indent=2)

    report_lines = [
        "# Phase 2 PoC: ハッシュタグ検索リサーチレポート",
        f"取得日時(UTC): {datetime.now(timezone.utc).isoformat()}",
        f"検索ハッシュタグ: {', '.join(hashtags)}",
        f"取得件数: {len(posts)}件（うち分析対象上位{len(top_posts)}件）",
    ]
    if errors:
        report_lines.append(f"取得エラー: {errors}")

    if not top_posts:
        report_lines.append("\n分析対象の投稿が0件でした。ハッシュタグや取得条件を見直してください。")
    else:
        client = anthropic.Anthropic()
        prompt = build_analysis_prompt(top_posts)
        resp = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        analysis_text = "".join(block.text for block in resp.content if hasattr(block, "text"))
        report_lines.append("\n## 【実データ】取得投稿一覧(上位)\n")
        for i, p in enumerate(top_posts, 1):
            report_lines.append(
                f"{i}. [@{p['owner_username']}]({p['url']}) - "
                f"再生数:{p['video_view_count']} / いいね:{p['like_count']} / "
                f"コメント:{p['comment_count']} / Views_per_Follower:{views_per_follower(p)}"
            )
        report_lines.append("\n## Claude分析結果\n")
        report_lines.append(analysis_text)

    report_path = "reports/poc_research_report.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    print(f"Report written to {report_path}")
    print(f"Raw data written to {raw_dump_path}")


if __name__ == "__main__":
    main()
