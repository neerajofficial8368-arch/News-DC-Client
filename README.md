# NewsDC web client

Responsive Next.js interface for the NewsDC FastAPI backend. It includes a
personalized briefing, trending feed, topic discovery, article summaries and
related discussions, full-text search, saved articles, a personal dashboard,
emerging-trend analysis, and source-linked AI research answers.

## Run locally

Run the backend first. From the `server/` directory, follow its README to
configure `ADMIN_API_KEY` and optional AI/RSS settings, then start:

```bash
uv sync
uv run uvicorn app.main:app --reload --env-file .env
```

In another terminal:

```bash
cd client
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Set
`NEXT_PUBLIC_NEWSDC_API_URL` in `.env.local` if the backend is hosted somewhere
other than `http://localhost:8000/api/v1`. The backend must include the client
origin in `CORS_ORIGINS` (for local development, `http://localhost:3000`).

## Load the first stories

For safety, the frontend never exposes or stores the administrative ingestion
secret. Run an initial refresh from a trusted terminal after configuring the
backend's private `ADMIN_API_KEY`:

```bash
curl -X POST http://localhost:8000/api/v1/admin/ingest \
  -H "X-Admin-Key: REPLACE_WITH_YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source":"all","max_items":100,"enrich_with_ai":true}'
```

This collects publicly available Hacker News stories and any RSS feeds configured
on the backend. Scheduled refresh is optional. The number of relevant articles
depends on the upstream sources; sample records are not presented as live news.

## Features

- **For you, trending and search:** API-backed feeds with category, content-type,
  relevance and pagination filters.
- **Topics:** browse all fourteen assignment categories and jump to their articles.
- **Article detail:** AI summaries and insights, original source, supporting
  discussion, related articles and external links.
- **Private reading list:** browser-generated anonymous profile ID, synchronized
  bookmarks, reading events, and saved preferences. No registration is needed.
- **Dashboard:** article counts, recent coverage, category distribution and
  content-type mix.
- **AI research assistant and emerging trends:** submit a question, see an answer
  grounded in collected articles, and follow its linked citations. Trend analysis
  likewise links back to its source stories.
- **Responsive and accessible UI:** desktop sidebar and context rail, mobile
  navigation, dark/light themes, labeled controls, keyboard `/` search and `Esc`
  close/back shortcuts.

The theme preference and anonymous profile ID are stored in browser local storage.
The server stores topic preferences, bookmarks and reading activity under that
anonymous profile ID. AI-dependent views report when the server has no AI provider
configured instead of showing invented answers.

## Checks

```bash
npm run lint
npm run build
```
