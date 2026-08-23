"""TikTok版 Phase 2 PoC: ハッシュタグ検索で実際の動画データを取得し、
Claude APIで「なぜ伸びているか」を実データベースで言語化するリサーチスクリプト。

Instagram版と同じ理由で、GitHub Actionsから実行する。
出力フィールド名はApifyアクターの実際のレスポンスを見て調整が必要な可能性が高いため、
DEBUG_RAW=1で生データを出力できるようにしてある。
"""
import json
import os
import sys
from datetime import datetime, timezone

import anthropic

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from src.collectors.apify_client import ApifyClient  # noqa: E402

MAX_ITEMS_FOR_ANALYSIS = 25


def pick(d: dict, *keys):
    for k in keys:
        if k in d and d[k] not in (None, ""):
            return d[k]
    return None


def normalize_tiktok_item(raw: dict) -> dict:
    author = raw.get("authorMeta") or raw.get("author") or {}
    hashtags_raw = raw.get("hashtags") or []
    hashtags = []
    for h in hashtags_raw:
        if isinstance(h, dict):
            hashtags.append(h.get("name") or h.get("title") or "")
        elif isinstance(h, str):
            hashtags.append(h)

    return {
        "url": pick(raw, "webVideoUrl", "url"),
        "owner_username": pick(author, "name", "uniqueId", "username") if author else pick(raw, "authorUsername"),
        "owner_followers": pick(author, "fans", "followerCount") if author else None,
        "caption": pick(raw, "text", "desc", "caption"),
        "hashtags": [h for h in hashtags if h],
        "play_count": pick(raw, "playCount", "views"),
        "like_count": pick(raw, "diggCount", "likes"),
        "comment_count": pick(raw, "commentCount", "comments"),
        "share_count": pick(raw, "shareCount", "shares"),
        "video_duration": pick(raw.get("videoMeta") or {}, "duration") if raw.get("videoMeta") else pick(raw, "duration"),
    }


def views_per_follower(item: dict):
    v, f = item.get("play_count"), item.get("owner_followers")
    if v is None or not f:
        return None
    return round(v / f, 3)


def build_analysis_prompt(items: list[dict]) -> str:
    rows = []
    for i, it in enumerate(items, 1):
        vpf = views_per_follower(it)
        rows.append(
            f"{i}. @{it['owner_username']} | フォロワー数:{it['owner_followers']} | "
            f"再生数:{it['play_count']} | いいね:{it['like_count']} | コメント:{it['comment_count']} | "
            f"シェア:{it['share_count']} | 尺:{it['video_duration']} | Views/Followers:{vpf}\n"
            f"   キャプション: {(it['caption'] or '')[:200]}\n"
            f"   ハッシュタグ: {', '.join(it['hashtags'][:10])}\n"
            f"   URL: {it['url']}"
        )
    items_block = "\n".join(rows) if rows else "(データを取得できませんでした)"

    return f"""以下は、TikTokで実際に取得した動画の実データです(ハッシュタグ検索経由、公開情報のみ)。
「彼氏目線Vlog」系フォーマット(一人称視点、恋愛的な疑似体験)を、女子大生・美容ジャンルの
アカウント企画に活かすため、このデータから読み取れることを分析してください。

# 実データ
{items_block}

# 出力ルール(厳守)
- 【実データ】: 上記の数値・キャプション・ハッシュタグから直接読み取れる事実のみ
- 【AI分析】: 実データから推測される構造・パターン
- 【仮説】: データ量が少なく確証がない推測
動画本体(カット割り・話す速度・表情等)はキャプションからは判断できないため、
その点は正直に「動画本体は未取得のため分析対象外」と明記すること。

# 分析してほしい項目
1. 再生数/フォロワー比が高い動画に共通する特徴
2. キャプションの型・Hookの傾向
3. よく使われているハッシュタグの傾向
4. 「難攻不落キャラ×美容×一人称視点」に転用できそうな具体的要素3つ
"""


def main():
    hashtags = [h.strip() for h in os.environ.get("TIKTOK_HASHTAGS", "").split(",") if h.strip()]
    if not hashtags:
        print("TIKTOK_HASHTAGS が指定されていません(カンマ区切りで指定)。", file=sys.stderr)
        sys.exit(1)

    apify = ApifyClient()
    raw_items = []
    errors = []
    for tag in hashtags:
        try:
            items = apify.tiktok_search_by_hashtags([tag], results_per_hashtag=15)
            raw_items.extend(items)
        except Exception as e:  # noqa: BLE001
            errors.append(f"#{tag}: {e}")

    if os.environ.get("DEBUG_RAW") and raw_items:
        print(f"DEBUG tiktok raw_items count: {len(raw_items)}", file=sys.stderr)
        print("DEBUG tiktok raw_items[0]:", json.dumps(raw_items[0], ensure_ascii=False)[:3000], file=sys.stderr)

    items = [normalize_tiktok_item(p) for p in raw_items if p]
    items = [it for it in items if it.get("owner_username")]
    items.sort(key=lambda it: (views_per_follower(it) or -1), reverse=True)
    top_items = items[:MAX_ITEMS_FOR_ANALYSIS]

    os.makedirs("reports", exist_ok=True)
    with open("reports/poc_tiktok_raw.json", "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)

    report_lines = [
        "# Phase 2 PoC: TikTokハッシュタグ検索リサーチレポート",
        f"取得日時(UTC): {datetime.now(timezone.utc).isoformat()}",
        f"検索ハッシュタグ: {', '.join(hashtags)}",
        f"取得件数: {len(items)}件（うち分析対象上位{len(top_items)}件）",
    ]
    if errors:
        report_lines.append(f"取得エラー: {errors}")

    if not top_items:
        report_lines.append("\n分析対象の動画が0件でした。")
    else:
        client = anthropic.Anthropic()
        prompt = build_analysis_prompt(top_items)
        resp = client.messages.create(
            model="claude-sonnet-4-5-20250929",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        analysis_text = "".join(block.text for block in resp.content if hasattr(block, "text"))
        report_lines.append("\n## 【実データ】取得動画一覧(上位)\n")
        for i, it in enumerate(top_items, 1):
            report_lines.append(
                f"{i}. [@{it['owner_username']}]({it['url']}) - "
                f"再生数:{it['play_count']} / いいね:{it['like_count']} / "
                f"Views_per_Follower:{views_per_follower(it)}"
            )
        report_lines.append("\n## Claude分析結果\n")
        report_lines.append(analysis_text)

    with open("reports/poc_tiktok_report.md", "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    print("Report written to reports/poc_tiktok_report.md")


if __name__ == "__main__":
    main()
