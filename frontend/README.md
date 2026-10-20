# AI Interview Preparation — Frontend

This is a Vite + React + TypeScript frontend scaffold for the AI Interview Preparation Platform.

Quick start:

```bash
cd frontend
npm install
npm run dev
```

What I scaffolded:
- Vite + React + TypeScript
- Chakra UI for clean, production-ready components
- `pages/` folder for page-level components
- `components/` folder for reusable UI and layout components

What's included now:
- Framer Motion powered page transitions and animated UI elements
- `VoiceRecorder` component using Web Speech API (falls back to a message if unsupported)
- `FeedbackModal` showing mocked AI feedback for demo/pitch
- Polished Dashboard with animated stats and recommended-card

Next steps: connect to backend APIs, implement LLM feedback pipeline, add JWT auth flows, and CI/CD.

## Run with the FastAPI backend

In one PowerShell terminal, follow the setup instructions in [backend/README.md](../backend/README.md) and keep Uvicorn running. In a second terminal:

```powershell
cd frontend
npm run dev
```

The Vite development server proxies `/api` requests to `http://127.0.0.1:8000`. The backend endpoints are documented at `http://127.0.0.1:8000/docs`.
