"""Apify Instagram Scraper (apify/instagram-scraper) の薄いラッパー。
GitHub Actions実行環境(インターネット制限なし)での実行を想定。
このサンドボックスセッションからは api.apify.com への通信がポリシーでブロックされているため
ローカル実行では検証できない。実行と検証はGitHub Actionsワークフロー経由で行う。
"""
import os
import time

import requests

APIFY_BASE_URL = "https://api.apify.com/v2"
INSTAGRAM_SCRAPER_ACTOR = "apify~instagram-scraper"


class ApifyClient:
    def __init__(self, token: str | None = None):
        self.token = token or os.environ["APIFY_API_TOKEN"]

    def run_actor_sync(self, actor_id: str, run_input: dict, timeout_secs: int = 300) -> list[dict]:
        """Actorを同期実行し、結果アイテムのリストを返す。"""
        url = f"{APIFY_BASE_URL}/acts/{actor_id}/run-sync-get-dataset-items"
        resp = requests.post(
            url,
            params={"token": self.token, "timeout": timeout_secs},
            json=run_input,
            timeout=timeout_secs + 30,
        )
        resp.raise_for_status()
        return resp.json()

    def search_by_hashtags(self, hashtags: list[str], results_per_hashtag: int = 15) -> list[dict]:
        """ハッシュタグ単位でReels/投稿を検索取得する。"""
        run_input = {
            "hashtags": hashtags,
            "resultsType": "posts",
            "resultsLimit": results_per_hashtag,
            "searchType": "hashtag",
        }
        return self.run_actor_sync(INSTAGRAM_SCRAPER_ACTOR, run_input)

    def fetch_profile_posts(self, usernames: list[str], results_per_profile: int = 12) -> list[dict]:
        """ユーザー名指定で投稿を取得する(競合登録済みアカウント用)。"""
        run_input = {
            "usernames": usernames,
            "resultsType": "posts",
            "resultsLimit": results_per_profile,
        }
        return self.run_actor_sync(INSTAGRAM_SCRAPER_ACTOR, run_input)
