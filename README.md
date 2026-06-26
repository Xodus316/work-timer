# Work Timer

A small personal app for timing work across projects.

**Company → Project → Task.** Tasks are the timed unit — start/stop a timer on each one and it
accumulates a running total. Companies are an extensible dropdown you add to inline while creating
a project.

- **Frontend:** React + Vite + TypeScript
- **Backend:** Python + FastAPI (SQLModel)
- **Storage:** local SQLite file (`backend/data/work_timer.db`), persisted on the host
- **Run:** Docker Compose (both services, with hot reload)

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

## Project structure

```
docker-compose.yml      # orchestrates both services
backend/                # FastAPI app (app/), Dockerfile, requirements.txt
  app/
    main.py             # app + CORS + routers
    database.py         # SQLModel engine (DB path from DATABASE_URL)
    models.py           # Company, Project, Task
    routers/            # companies, projects, tasks (+ start/stop)
  data/                 # SQLite file lives here (bind-mounted, gitignored)
frontend/               # Vite React-TS app, Dockerfile
  src/
    api.ts, types.ts
    pages/              # ProjectsPage, ProjectDetailPage
    components/         # AddProjectForm, TaskForm, TaskRow
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
