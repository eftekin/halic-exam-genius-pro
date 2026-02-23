# 🎓 Haliç Exam Genius Pro

A premium, mobile-first web application for **Haliç University** students to view, search, and export their exam schedules. Built with a decoupled architecture — FastAPI backend + Next.js frontend.

![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-3776AB?logo=python&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

---

## ✨ Features

- **Smart Course Search** — Fuzzy search by course code, name, or acronym
- **Beautiful Exam Cards** — Elegant, color-coded cards with date, time, and classroom info
- **Calendar Export (.ics)** — One-tap export of all exams to Apple Calendar, Google Calendar, etc.
- **Image Export (PNG)** — Share your schedule as a crisp image via native share or download
- **Dark Mode** — Premium zinc/charcoal dark theme with glass morphism effects
- **Mobile-First** — Designed for iOS-quality experience with safe area support
- **Bilingual (TR/EN)** — Automatic language detection based on browser locale

## 🏗️ Architecture

```
halic-exam-genius-pro/
├── backend/          # FastAPI (Python)
│   ├── main.py       # App entry point
│   └── app/
│       ├── config.py       # Settings & exam URL
│       ├── models/         # Pydantic schemas
│       ├── routes/         # API endpoints
│       └── services/       # Business logic & data fetching
│
├── frontend/         # Next.js 16 (App Router) + Tailwind CSS 4
│   └── src/
│       ├── app/            # Pages & global styles
│       ├── components/     # UI components
│       ├── config/         # Semester constants
│       └── lib/            # API client, i18n, calendar utils
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Python** 3.11+
- **Node.js** 20+
- **npm** (or yarn/pnpm)

### Backend

```bash
cd backend

# Create & activate virtual environment
python -m venv .venv
source .venv/bin/activate    # macOS/Linux
# .venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Run the API server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Visit `/docs` for the interactive Swagger UI.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run the dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

## ⚙️ Configuration

### Semester Update

Each semester, update the exam schedule URL in [backend/app/config.py](backend/app/config.py):

```python
exam_schedule_url: str = "https://halic.edu.tr/wp-content/uploads/..."
```

And update the semester constants in [frontend/src/config/constants.ts](frontend/src/config/constants.ts):

```typescript
export const ACADEMIC_YEAR = "2025-2026";
export const SEMESTER_TR = "Güz";
export const EXAM_TYPE_TR = "Final";
```

### Environment Variables

The backend supports configuration via environment variables prefixed with `EXAM_GENIUS_`:

| Variable                        | Description                       | Default       |
| ------------------------------- | --------------------------------- | ------------- |
| `EXAM_GENIUS_EXAM_SCHEDULE_URL` | URL to the .xlsx schedule file    | Haliç CDN URL |
| `EXAM_GENIUS_CORS_ORIGINS`      | Allowed CORS origins (JSON array) | `["*"]`       |
| `EXAM_GENIUS_CACHE_TTL_SECONDS` | Data cache TTL in seconds         | `3600`        |

## 🛠️ Tech Stack

| Layer        | Technology                                        |
| ------------ | ------------------------------------------------- |
| **Backend**  | FastAPI, Pydantic, Pandas, OpenPyXL               |
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| **UI**       | Lucide Icons, html-to-image                       |
| **Export**   | ICS calendar generation, PNG image capture        |

## 📄 License

This project is licensed under the [MIT License](LICENSE).

## 👤 Author

**Mustafa Eftekin** — [GitHub](https://github.com/eftekin)
