# AI Interview Coach

AI-powered interview practice platform with a React frontend and Express backend.

## Tech Stack
- Frontend: React 19, TypeScript, Vite, Tailwind CSS
- Backend: Node.js, Express, TypeScript
- Deployment: GitHub Pages (frontend) + Render (backend)

## Project Structure
```text
Interview-Website/
|-- backend/
|   |-- src/
|   |-- .env.example
|   `-- package.json
|-- frontend/
|   |-- src/
|   |-- .env.example
|   `-- package.json
|-- .github/workflows/deploy.yml
|-- render.yaml
`-- README.md
```

## Local Development

### Prerequisites
- Node.js 18+
- npm

### 1) Install dependencies
```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2) Configure environment variables
Backend (`backend/.env`):
```env
PORT=3001
CORS_ALLOWED_ORIGIN=http://localhost:5173
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Frontend (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3001/api
```

### 3) Run
```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

App URL: `http://localhost:5173`

## Production Deployment

### Backend on Render
1. In Render, create a new **Blueprint** service from this repo root so Render reads `render.yaml`.
2. Confirm service settings:
- Root directory: `backend`
- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Health check path: `/api/health`
3. Set environment variables in Render:
- `NODE_ENV=production`
- `CORS_ALLOWED_ORIGIN=https://griffin-hall.github.io`
- `OPENAI_API_KEY=<your-key>`
- `OPENAI_MODEL=gpt-4o-mini` (optional override)
4. Deploy and copy the service URL, for example:
- `https://interview-coach-api.onrender.com`

### Frontend on GitHub Pages
1. In GitHub repo settings, go to **Settings > Secrets and variables > Actions > Variables**.
2. Create repository variable:
- `VITE_API_URL=https://<your-render-service>.onrender.com/api`
3. In **Settings > Pages**, set Source to **GitHub Actions**.
4. Push to `master` (or `main`) to trigger `.github/workflows/deploy.yml`.
5. Frontend will be available at:
- `https://griffin-hall.github.io/interview-coach/`

## OpenAI Behavior
- If `OPENAI_API_KEY` is set, backend attempts real OpenAI analysis.
- Output is validated against `{ strengths, gaps, followUp }`.
- If OpenAI fails (network/auth/shape), backend falls back to mock analysis.

## API Endpoints
- `GET /api/health`
- `GET /api/questions?category=<cs_ops|tech_support|behavioral>&lastId=<optional>`
- `GET /api/questions/categories`
- `POST /api/analyze-answer`
- `GET /api/sessions`
- `POST /api/sessions`
- `GET /api/sessions/:id`
- `DELETE /api/sessions/:id`

## Troubleshooting

### GitHub Pages deploy fails with missing API URL
- Symptom: workflow build step errors with `VITE_API_URL repository variable is not set`.
- Fix: set repository variable `VITE_API_URL` to your Render API URL ending in `/api`.

### Browser gets CORS errors from backend
- Symptom: requests blocked from `griffin-hall.github.io`.
- Fix: in Render, set `CORS_ALLOWED_ORIGIN=https://griffin-hall.github.io`.
- Note: production backend intentionally rejects other origins.

### OpenAI key set but responses still look mock-like
- Symptom: generic fallback-style responses.
- Fixes:
  - Verify Render has valid `OPENAI_API_KEY`.
  - Check Render logs for OpenAI request/auth errors.
  - Confirm `OPENAI_MODEL` is valid for your account.

### Sessions disappear after some time
- Expected behavior for current architecture.
- Sessions are stored in-memory and reset on restart/sleep/redeploy.

## Scripts

Backend:
```bash
npm run dev
npm run build
npm start
```

Frontend:
```bash
npm run dev
npm run build
npm run preview
```
