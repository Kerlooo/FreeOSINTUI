"""Refreshes data/wmn-data.json from the WhatsMyName repository.

Run from backend/: uv run python scripts/update_wmn.py
"""

import json
import sys
from pathlib import Path

import httpx

URL = "https://raw.githubusercontent.com/WebBreacher/WhatsMyName/main/wmn-data.json"
TARGET = Path(__file__).resolve().parent.parent / "data" / "wmn-data.json"


def main() -> int:
    response = httpx.get(URL, timeout=30, follow_redirects=True)
    response.raise_for_status()
    data = response.json()
    sites = data.get("sites")
    if not isinstance(sites, list) or not sites:
        print("Downloaded file has no sites; keeping the current copy.", file=sys.stderr)
        return 1
    TARGET.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Saved {len(sites)} sites to {TARGET}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
