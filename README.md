# 21CSC403T Virtual Lab

Interactive Software Metrics & Measurement lab in the browser: write Python, **statically** analyze it, inspect a control-flow graph, refactor, and compare before/after. Student Python is **never** executed (`eval` / `exec` / `subprocess` are not used).

## Stack

- React, TypeScript, Vite, Tailwind, Monaco, React Flow, Recharts
- Experiment 1 metrics and CFG are computed in the browser
- Experiment 3 Function Point / COCOMO state is stored in `localStorage`

## Run the app

Prerequisite: **Node.js 20+** on your `PATH`. The same commands work on Windows, macOS, and Linux.

```bash
cd frontend
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173). Press **Ctrl+C** in the terminal to stop.

`npm install` is only needed on a fresh clone or after dependency changes. After that, `cd frontend && npm run dev` is enough.

## Docker

```bash
docker compose up --build
```

Then open [http://localhost:5173](http://localhost:5173).

## Architecture

```
Browser
 └── Python static analyzer (tokenize / indent parse)
       ├── LOC, cyclomatic complexity, Halstead, MI
       ├── CFG builder (ENTRY / decision / loop / EXIT)
       └── Insight rules
```

All other experiments (test management, size estimation, surveys, CK metrics, requirement review) also run entirely in the frontend.

## Learning loop

Write → Analyze → Visualize CFG → Understand metrics → Identify hotspots → Refactor → Re-analyze → Compare baseline → Report.

## Deploy

This is a static SPA. Build with `cd frontend && npm run build` and host the `frontend/dist` folder (for example on Vercel).
