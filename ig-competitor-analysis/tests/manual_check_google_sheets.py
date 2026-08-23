"""手動確認用スクリプト。Google Sheetsへの接続とスプレッドシートへの書き込み権限をテストする。
Phase 2 PoCの一部。credentials/google-service-account.json と .env の
GOOGLE_SPREADSHEET_ID を使用する。恒久的なパイプラインの一部ではない。
"""
import json
import os

import google.auth.transport.requests
import requests
from dotenv import load_dotenv
from google.oauth2 import service_account

load_dotenv()

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
SPREADSHEET_ID = os.environ["GOOGLE_SPREADSHEET_ID"]
CRED_PATH = "credentials/google-service-account.json"


def get_access_token():
    creds = service_account.Credentials.from_service_account_file(CRED_PATH, scopes=SCOPES)
    creds.refresh(google.auth.transport.requests.Request())
    return creds.token


def main():
    token = get_access_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. 読み取り確認: スプレッドシートのタイトルが取れるか
    r = requests.get(
        f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}",
        headers=headers,
        params={"fields": "properties.title,sheets.properties.title"},
        timeout=15,
    )
    print("READ status:", r.status_code)
    print("READ body:", r.text[:500])
    if r.status_code != 200:
        return

    # 2. 書き込み確認: A1セルにテスト値を書き込む
    r2 = requests.put(
        f"https://sheets.googleapis.com/v4/spreadsheets/{SPREADSHEET_ID}/values/A1",
        headers=headers,
        params={"valueInputOption": "RAW"},
        json={"values": [["接続テストOK"]]},
        timeout=15,
    )
    print("WRITE status:", r2.status_code)
    print("WRITE body:", r2.text[:500])


if __name__ == "__main__":
    main()
