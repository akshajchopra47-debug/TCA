---
name: TCA Dashboard setup
description: Architecture decisions for The Climate Architects ESG dashboard on Replit
---

The app is a plain static HTML/vanilla JS site (not React/Next.js) served from Express in `artifacts/api-server/`.

**Architecture:**
- Express serves static files from `artifacts/api-server/public/` via `express.static()`
- API routes mounted at `/api` in `artifacts/api-server/src/routes/`
- Artifact previewPath is `/` (full root) — NOT `/api`; had to change from original `/api` using `verifyAndReplaceArtifactToml`
- JSON body limit raised to 20mb to handle base64 PDF/image uploads

**Why:** The original Vercel import used Cloudflare Pages Functions format (esm `onRequestPost` exports). These were rewritten as Express route handlers in TypeScript.

**Key routes:** `/api/scope3` (PDF/image OCR), `/api/scope3text` (paste text extraction), `/api/chat` (ARIA chatbot), `/api/calculate` (GHG emissions math) — all call OpenRouter.

**Model default:** `meta-llama/llama-3.3-70b-instruct:free` (not gemma, not qwen — those were unreliable).

**How to apply:** Any new API endpoints go in `artifacts/api-server/src/routes/`, registered in `routes/index.ts`. Static HTML/CSS/JS goes in `artifacts/api-server/public/`. Run `pnpm run build` in api-server after TypeScript changes, then restart workflow `artifacts/api-server: API Server`.
