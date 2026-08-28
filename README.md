# SMM Virtual Lab — Exercise 1

Interactive Software Metrics & Measurement lab: write Python, **statically** analyze it with [Radon](https://radon.readthedocs.io/), inspect a control-flow graph, refactor, and compare before/after. User code is **never** executed (`eval` / `exec` / `subprocess` are forbidden).

## Stack

- Frontend: React, TypeScript, Vite, Tailwind, Monaco, React Flow, Recharts
- Backend: Python, FastAPI, Radon, Python AST

## Quick start

```bash
# Backend (from repo root)
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --reload --port 8000

# Frontend (Node 20+)
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Vite proxies `/api` → FastAPI `:8000`.

## Tests

```bash
source .venv/bin/activate
pytest backend/tests -q
```

## Docker

```bash
docker compose up --build
```

## Architecture

```
CodeAnalyzer
 └── PythonAnalyzer
       ├── RadonEngine   (LOC, CC, Halstead, MI)
       ├── CfgBuilder    (AST → ENTRY/decision/loop/EXIT)
       └── InsightEngine (deterministic rules)
```

`LizardEngine` and Java/C++/JS analyzers are stubs for later exercises.

## Learning loop

Write → Analyze → Visualize CFG → Understand metrics → Identify hotspots → Refactor → Re-analyze → Compare baseline → Report.
