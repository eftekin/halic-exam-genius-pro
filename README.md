# 🎓 Haliç Exam Genius Pro

A production-grade, mobile-first exam schedule viewer for **Haliç University** students. Search courses, view exam dates and classrooms, export to calendar (.ics), and share as an image — all from a single, polished interface.

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-3776AB?logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)

---

## ✨ Features

| Feature                    | Description                                                          |
| -------------------------- | -------------------------------------------------------------------- |
| **Smart Course Search**    | Fuzzy match by course code, name, acronym, or multi-word prefix      |
| **Exam Cards**             | Clean, accessible cards showing date, time, and classroom info       |
| **Calendar Export (.ics)** | One-tap export of all exams to Apple Calendar, Google Calendar, etc. |
| **Image Export (PNG)**     | Share your schedule as a high-DPI image via native share or download |
| **Dark Mode**              | Automatic dark theme following system preferences                    |
| **Mobile-First**           | iOS-quality UX with safe-area inset support                          |
| **Bilingual (TR / EN)**    | Auto-detects browser locale; full Turkish and English support        |

## 🛠️ Tech Stack

| Layer              | Technology                                                      |
| ------------------ | --------------------------------------------------------------- |
| **Frontend**       | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4 |
| **Backend**        | FastAPI 0.115, Pydantic v2, Pandas, OpenPyXL                    |
| **Database**       | PostgreSQL 15 (analytics & search logs)                         |
| **Infrastructure** | Docker, Docker Compose, Nginx reverse proxy                     |
| **Export**         | html-to-image (PNG), RFC 5545 ICS generation                    |
| **Icons**          | Lucide React                                                    |

## 🏗️ Architecture

```
halic-exam-genius-pro/
├── backend/                    # FastAPI (Python 3.11)
│   ├── main.py                 # ASGI entry point, CORS, router mount
│   ├── Dockerfile              # Multi-stage build, non-root user
│   ├── docker-compose.yml      # API + PostgreSQL + Nginx
│   ├── nginx.conf              # Reverse proxy with security headers
│   ├── .env.example            # Environment variable template
│   └── app/
│       ├── config.py           # Pydantic Settings (env-driven)
│       ├── models/exam.py      # Request / response schemas
│       ├── routes/exam.py      # API endpoints
│       └── services/           # Excel parsing, schedule builder,
│           └── exam_service.py #   ICS generation, image export
│
├── frontend/                   # Next.js 16 (App Router)
│   └── src/
│       ├── app/                # Root layout, main page, global CSS
│       ├── components/         # CourseSelector, ExamCard, ExportBar,
│       │                       #   ExportView, States
│       ├── config/constants.ts # Semester & exam-type config
│       └── lib/                # API client, i18n, calendar helpers
│
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Python** 3.11+
- **Node.js** 20+
- **npm** (or yarn / pnpm)

### Backend

```bash
cd backend

# Create & activate virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload --port 8000
```

API available at **http://localhost:8000** — visit `/docs` for interactive Swagger UI.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

App available at **http://localhost:3000**.

## 🐳 Docker Deployment

For production deployment with Docker Compose (API + PostgreSQL + Nginx):

```bash
cd backend

# 1. Create your environment file from the template
cp .env.example .env
# Edit .env with your real values (SECRET_KEY, CORS_ORIGINS, DB password)

# 2. Build and start all services
docker compose up -d --build

# 3. Verify
curl http://localhost/health
# → {"status":"healthy"}
```

This spins up three containers:

- **api** — FastAPI with 4 Uvicorn workers (non-root user)
- **db** — PostgreSQL 15 with persistent volume
- **nginx** — Reverse proxy with security headers

## ⚙️ Configuration

### Environment Variables

All backend settings are driven by environment variables prefixed with `EXAM_GENIUS_`.
Copy `.env.example` → `.env` and fill in real values. **Never commit `.env`.**

| Variable                        | Description                        | Default                    |
| ------------------------------- | ---------------------------------- | -------------------------- |
| `EXAM_GENIUS_SECRET_KEY`        | Random secret for internal signing | — (required in production) |
| `EXAM_GENIUS_CORS_ORIGINS`      | Allowed origins, comma-separated   | `http://localhost:3000`    |
| `EXAM_GENIUS_EXAM_SCHEDULE_URL` | URL to the `.xlsx` schedule file   | Haliç CDN URL              |
| `EXAM_GENIUS_DATABASE_URL`      | PostgreSQL connection string       | —                          |
| `EXAM_GENIUS_CACHE_TTL_SECONDS` | In-memory cache TTL                | `3600`                     |

The frontend uses one optional variable (via `.env.local`):

| Variable              | Description      | Default                 |
| --------------------- | ---------------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | Backend base URL | `http://localhost:8000` |

### Semester Update

Each semester, update two files:

1. **Backend** — `exam_schedule_url` in [`backend/app/config.py`](backend/app/config.py) (or via `EXAM_GENIUS_EXAM_SCHEDULE_URL`)
2. **Frontend** — Academic year, semester, and exam type in [`frontend/src/config/constants.ts`](frontend/src/config/constants.ts)

## 📡 API Endpoints

| Method | Path                    | Description                            |
| ------ | ----------------------- | -------------------------------------- |
| `GET`  | `/api/courses`          | List all available courses             |
| `POST` | `/api/schedule`         | Get exam schedule for selected courses |
| `POST` | `/api/export/ics`       | Download ICS calendar file             |
| `POST` | `/api/export/image`     | Download PNG schedule image            |
| `POST` | `/api/cache/invalidate` | Force-refresh cached exam data         |
| `GET`  | `/health`               | Health check                           |

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 👤 Author

**Mustafa Eftekin** — [GitHub](https://github.com/eftekin)
