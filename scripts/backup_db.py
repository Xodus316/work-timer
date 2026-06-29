#!/usr/bin/env python3
"""Back up the work-timer SQLite database.

Uses SQLite's online backup API, so the snapshot is consistent even if the app
is writing at the time. Old backups are pruned, keeping the most recent N.

Runs on the host against backend/data/work_timer.db — no Docker needed.

Environment overrides (optional):
  WORKTIMER_BACKUP_DIR   where to write backups (default: <repo>/backups)
  WORKTIMER_BACKUP_KEEP  how many recent backups to keep (default: 14)
"""
import os
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "backend" / "data" / "work_timer.db"
BACKUP_DIR = Path(os.environ.get("WORKTIMER_BACKUP_DIR") or (ROOT / "backups"))
KEEP = int(os.environ.get("WORKTIMER_BACKUP_KEEP") or 14)


def main() -> int:
    if not SRC.exists():
        print(f"[backup] source database not found: {SRC}", file=sys.stderr)
        return 1

    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
    dest = BACKUP_DIR / f"work_timer-{stamp}.db"

    # Read-only source connection + online backup = a safe, consistent copy.
    src = sqlite3.connect(f"file:{SRC}?mode=ro", uri=True, timeout=30)
    try:
        src.execute("PRAGMA busy_timeout = 30000")
        dst = sqlite3.connect(dest)
        try:
            src.backup(dst)
        finally:
            dst.close()
    finally:
        src.close()

    print(f"[backup] {datetime.now():%Y-%m-%d %H:%M:%S} wrote {dest.name} "
          f"({dest.stat().st_size:,} bytes)")

    # Prune oldest, keeping the most recent KEEP (timestamped names sort by age).
    backups = sorted(BACKUP_DIR.glob("work_timer-*.db"))
    for old in backups[:-KEEP] if KEEP > 0 else []:
        old.unlink()
        print(f"[backup] pruned {old.name}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
