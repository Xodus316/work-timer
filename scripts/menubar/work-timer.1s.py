#!/usr/bin/env python3
# <xbar.title>Work Timer</xbar.title>
# <xbar.version>v1.1</xbar.version>
# <xbar.author>Work Timer</xbar.author>
# <xbar.desc>Shows the currently running Work Timer task in the macOS menu bar.</xbar.desc>
# <xbar.dependencies>python3</xbar.dependencies>
# <swiftbar.hideAbout>true</swiftbar.hideAbout>
# <swiftbar.hideRunInTerminal>true</swiftbar.hideRunInTerminal>
# <swiftbar.hideLastUpdated>true</swiftbar.hideLastUpdated>
# <swiftbar.hideDisablePlugin>true</swiftbar.hideDisablePlugin>
"""
SwiftBar / xbar plugin: show the running Work Timer task in the macOS menu bar.

SwiftBar re-runs this on the interval in the filename (work-timer.1s.py = every
second) and shows the output. Each run reads the live elapsed time from the
backend, so the menu bar reflects the server's value.

Install: point SwiftBar's plugin folder at this "scripts/menubar" folder (or
symlink this file into your existing one), keep it executable, and Refresh All /
relaunch SwiftBar. Needs the backend running (http://127.0.0.1:8000 by default).
Standard library only, so the system python3 works.
"""
import json
import os
import urllib.request

API = os.environ.get("WORKTIMER_API", "http://127.0.0.1:8000").rstrip("/")
APP_URL = os.environ.get("WORKTIMER_APP_URL", "http://127.0.0.1:5173").rstrip("/")


def fmt(total: int) -> str:
    total = max(0, int(total))
    return f"{total // 3600:02d}:{(total % 3600) // 60:02d}:{total % 60:02d}"


def running_task():
    """Return the running task dict, None if idle, or 'unreachable' on error."""
    try:
        with urllib.request.urlopen(f"{API}/api/tasks/running", timeout=2) as resp:
            raw = resp.read().decode().strip()
    except Exception:
        return "unreachable"
    if not raw or raw == "null":
        return None
    return json.loads(raw)


def main() -> None:
    task = running_task()

    if task == "unreachable":
        print("⏱ –")
        print("---")
        print("Work Timer backend not reachable | color=gray")
        print(f"Open Work Timer | href={APP_URL}")
        return

    if task is None:
        print("⏱")
        print("---")
        print("No timer running | color=gray")
        print(f"Open Work Timer | href={APP_URL}")
        return

    elapsed = task["elapsed_seconds"]
    print(f"⏱ {fmt(elapsed)}")
    print("---")
    print(task["name"])
    print(f"Running for {fmt(elapsed)} | color=gray")
    print("---")
    print(
        "■ Stop timer | "
        f"bash=/usr/bin/curl param1=-s param2=-X param3=POST "
        f"param4={API}/api/tasks/{task['id']}/stop "
        "terminal=false refresh=true"
    )
    print(f"Open Work Timer | href={APP_URL}")


if __name__ == "__main__":
    main()
