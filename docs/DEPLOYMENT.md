# Deployment Guide — Vercel + Render

The recommended test deployment keeps the frontend and API separate:

- Frontend/PWA: Vercel
- API: Render Web Service
- PostgreSQL with pgvector: a managed PostgreSQL provider with the `vector` extension enabled

> Important: do not put `OPENAI_API_KEY` in Vercel frontend variables. It belongs only on the Render API.

## Before deploying

You need:

1. The GitHub repository merged to `main`.
2. An OpenAI API key.
3. A PostgreSQL connection string for a database that supports pgvector.

The database must allow these extensions:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

The application's migration command creates the required tables/extensions.

## Step 1 — Deploy API on Render

1. Sign in to Render from your mobile browser.
2. Create a new Blueprint/Web Service from the GitHub repository.
3. Render can read the root `render.yaml` configuration.
4. Add these secret environment variables:

   - `DATABASE_URL` = your production PostgreSQL connection string.
   - `OPENAI_API_KEY` = your OpenAI API key.
   - `WEB_ORIGIN` = temporarily use your future Vercel URL if known; otherwise deploy once, then update it after Vercel gives you the frontend URL.

5. Keep the model variables from the Blueprint unless you want to change models.
6. Deploy.
7. Copy the Render API URL, for example `https://your-api.onrender.com`.
8. Open `<API URL>/health`; it should return `{ "ok": true }`.

The Render start command runs the database migration before starting the API.

## Step 2 — Deploy frontend on Vercel

1. Sign in to Vercel from your mobile browser.
2. Add New Project -> Import the `ai-companion` GitHub repository.
3. Keep the repository root as the project root. The root `vercel.json` contains the monorepo build/output configuration.
4. Add one environment variable:

   - `VITE_API_URL` = the Render API URL with no trailing slash.

5. Deploy.
6. Copy the generated Vercel URL.

## Step 3 — Connect CORS

Return to the Render service and set:

- `WEB_ORIGIN` = your exact Vercel production origin, e.g. `https://your-project.vercel.app`

Redeploy/restart the Render service after changing it.

Then reload the Vercel app and send a test message.

## Step 4 — PWA test

On Android Chrome:

1. Open the Vercel URL.
2. Open the browser menu.
3. Choose `Install app` or `Add to Home screen` when offered.
4. Launch Companion from the home screen.

## Deployment environment summary

### Render API

Required:
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `WEB_ORIGIN`

Provided/defaulted by configuration:
- `NODE_VERSION`
- `OPENAI_CHAT_MODEL`
- `OPENAI_EMBEDDING_MODEL`
- `PORT` is supplied by Render and read by the server configuration.

### Vercel frontend

Required:
- `VITE_API_URL`

Never add the OpenAI secret to the frontend.

## Troubleshooting

### API deploy fails during migration

Confirm the database connection string is correct and that the provider supports the `vector` extension.

### Frontend opens but messages fail

Check:
1. `VITE_API_URL` points to the deployed Render API.
2. Render `WEB_ORIGIN` exactly matches the Vercel URL.
3. `<Render URL>/health` works.

### Render free service sleeps

If using a free/sleeping service tier, the first request after inactivity can be slow. This is expected for testing but is not suitable for realtime voice later.

### Database persistence

Do not use an ephemeral local database inside the web service. Use managed PostgreSQL so conversations and memories survive service restarts/redeployments.
