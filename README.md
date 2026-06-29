# Work Timer

A small personal app for timing work across projects.

**Company → Project → Task.** Tasks are the timed unit — start/stop a timer on each one and it
accumulates a running total. Companies are an extensible dropdown you add to inline while creating
a project.

- **Frontend:** React + Vite + TypeScript
- **Backend:** Python + FastAPI (SQLModel)
- **Storage:** local SQLite file (`backend/data/work_timer.db`), persisted on the host
- **Run:** Docker Compose (both services, with hot reload)
- **Backups:** daily SQLite snapshots (see [Backups](#backups))

## Features

- **Projects & companies** — add and delete projects; each belongs to a company picked from a
  dropdown you can extend inline while creating a project.
- **Tasks** — add, edit, and delete tasks within a project. Tasks are what you time.
- **Timer** — start/stop a timer on any task; it accumulates a running total. Only one task runs
  at a time (starting one stops any other), so you never double-count.
- **Complete / reopen** — mark a task complete to lock its timer and edit controls; an
  *Add more time* button reopens it. Accumulated time is preserved.
- **Live tab title** — while a timer runs, the browser tab shows the elapsed time, so you can
  keep an eye on it from another tab.
- **Project calendar** — a monthly view on each project page showing hours worked per day.
- **Daily backups** — automatic, consistent SQLite snapshots (see [Backups](#backups)).

## Running the app

You need Docker + Docker Compose. From the project root:

```bash
docker compose up            # add --build the first time, or after changing dependencies
```

- **Frontend:** http://localhost:5173
- **API + interactive docs:** http://localhost:8000 / http://localhost:8000/docs

Editing files in `frontend/src` or `backend/app` hot-reloads automatically — no rebuild needed.

Stop with `Ctrl+C`. To remove the containers (your data is kept on disk):

```bash
docker compose down
```

Your data lives in `backend/data/work_timer.db` on your machine, so it survives restarts and
rebuilds. Delete that file to start fresh.

## How it works

- **Timer model:** each task stores an accumulated `total_seconds` plus a `running_since`
  timestamp. The server is the source of truth; the UI ticks a local clock once per second for the
  live display. This means the timer keeps counting even if you reload or close the browser.
- **One timer at a time:** starting a task's timer automatically stops any other running task, so
  you never double-count time.
- **Completing a task** stops its timer and hides its Start/Edit controls; reopening with *Add
  more time* brings them back. The accumulated total is kept.
- **Per-day history & calendar:** whenever a timer stops, a `TimeEntry` (task, project, seconds,
  start/end) is written. The project calendar aggregates these into hours-per-day, bucketed into
  your browser's local timezone. In-progress time appears once you stop, and time accumulated
  before this feature existed has no daily breakdown.
- **Tab title:** a small global component polls the running task and updates the browser tab
  title every second, so the live timer is visible from any tab.

## Backups

A daily snapshot of the SQLite database is taken by [`scripts/backup_db.py`](scripts/backup_db.py),
which uses SQLite's online backup API — safe to run even while the app is writing. Snapshots are
written to `backups/` (gitignored) as `work_timer-<date>_<time>.db`, keeping the most recent **14**
and pruning older ones.

**Back up right now:**

```bash
python3 scripts/backup_db.py
```

**Schedule it daily at 2 AM (macOS)** — install the included LaunchAgent:

```bash
cp scripts/com.worktimer.backup.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.worktimer.backup.plist
```

The plist uses placeholder paths (`/path/to/work-timer/…`) — replace them with your clone's
absolute path before installing (launchd requires absolute paths). If the Mac is asleep at 2 AM,
the job runs at next wake. Output is logged to `backups/backup.log`.

**Restore from a backup** — stop the app so nothing's writing, swap the file in, restart:

```bash
docker compose down
cp backups/work_timer-2026-06-29_132535.db backend/data/work_timer.db   # pick the snapshot you want
docker compose up -d
```

**Manage the schedule:**

```bash
launchctl kickstart -k gui/$(id -u)/com.worktimer.backup     # run on demand
launchctl bootout gui/$(id -u)/com.worktimer.backup          # turn it off
rm ~/Library/LaunchAgents/com.worktimer.backup.plist
```

Two optional environment variables tune the script: `WORKTIMER_BACKUP_DIR` (where snapshots go —
e.g. point it at an iCloud Drive folder for off-machine safety) and `WORKTIMER_BACKUP_KEEP` (how
many snapshots to retain).

## Project structure

```
docker-compose.yml      # orchestrates both services
backend/                # FastAPI app (app/), Dockerfile, requirements.txt
  app/
    main.py             # app + CORS + routers
    database.py         # SQLModel engine (DB path from DATABASE_URL)
    models.py           # Company, Project, Task, TimeEntry
    routers/            # companies, projects, tasks (+ start/stop/complete), time-entries
  data/                 # SQLite file lives here (bind-mounted, gitignored)
frontend/               # Vite React-TS app, Dockerfile
  src/
    api.ts, types.ts
    pages/              # ProjectsPage, ProjectDetailPage
    components/         # AddProjectForm, TaskForm, TaskRow, ProjectCalendar, TabTimer
scripts/                # backup_db.py + LaunchAgent plist (daily DB backups)
backups/                # daily SQLite snapshots (gitignored)
```

## Running without Docker (optional)

If you'd rather run the pieces directly:

```bash
# Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload          # http://localhost:8000

# Frontend (in another terminal)
cd frontend
npm install
npm run dev                            # http://localhost:5173
```
