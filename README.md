# Haliç Exam Genius Pro

Exam schedule app for Haliç University: search courses, see exam dates and rooms, export to calendar (ICS) or image (PNG). Turkish and English.

Live: https://www.halicexamgenius.app

## How it works

```
halic.edu.tr exam Excel ──► scripts/sync.py ──► frontend/public/data/exams.json ──► Vercel (Next.js, static)
```

No server. The university's Excel is turned into one JSON file, committed to the repo and served by Vercel.
Exam times are kept exactly as the Excel states them (Istanbul time).

| Folder | What |
|---|---|
| `frontend/` | Next.js app, deployed by Vercel |
| `scripts/` | Excel → `exams.json` sync (Python, uv) |

## Local development

```bash
cd frontend && npm install && npm run dev   # http://localhost:3000
```

## New exam period

1. Download the "tüm liste" Excel from the announcement on halic.edu.tr.
2. `cd scripts && uv run sync.py <xlsx path or url>`
3. Update the labels in `frontend/src/config/constants.ts`.
4. Open a PR.

`sync.py` fails and writes nothing if the Excel has an unknown format, so the last good data stays live.

## Checks

CI runs on every PR: `biome ci`, `npm test` (with `TZ=America/Los_Angeles`), `next build`, and `pytest` in `scripts/`.

## License

[MIT](LICENSE)
