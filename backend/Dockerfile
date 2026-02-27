# ── Stage 1: Build dependencies ──────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build tools needed for compiled packages (pandas, kaleido, etc.)
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Stage 2: Production runtime ─────────────────────────────────────────────
FROM python:3.11-slim AS runtime

# Runtime-only system deps (libpq for psycopg2, chromium libs for kaleido)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Copy pre-built Python packages from builder
COPY --from=builder /install /usr/local

# ── Non-root user ────────────────────────────────────────────────────────────
RUN groupadd --gid 1000 appuser && \
    useradd  --uid 1000 --gid appuser --shell /bin/sh --create-home appuser

WORKDIR /home/appuser/app
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 8000

# Uvicorn production settings:
#   --workers 4          → handle concurrent load for 3000+ users
#   --proxy-headers      → trust X-Forwarded-* from Nginx
#   --forwarded-allow-ips → only trust the Docker network proxy
CMD ["python", "-m", "uvicorn", "main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "4", \
     "--proxy-headers", \
     "--forwarded-allow-ips", "*"]
