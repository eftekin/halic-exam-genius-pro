# ── Stage 1: Build dependencies with uv (10× faster than pip) ─────────────────
# Uses pre-built manylinux wheels to avoid compilation on resource-constrained VPS.
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS builder

WORKDIR /build

# Layer 1: Dependencies only — cached until requirements.txt changes
COPY requirements.txt .

# Prefer pre-compiled wheels; avoid building from source (saves CPU/memory on low-resource VPS).
# If build fails on ARM/other platforms, remove --only-binary :all:
# Cache mount speeds repeated builds (e.g. CI retries); requires BuildKit (default in Docker 23+)
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install \
    --prefix /install \
    --only-binary :all: \
    -r requirements.txt

# Layer 2: Application code — invalidates when app changes
COPY . .

# ── Stage 2: Production runtime (minimal image) ──────────────────────────────
FROM python:3.11-slim-bookworm AS runtime

# Runtime-only: libpq for asyncpg, no build tools
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Copy pre-built Python packages from builder (no uv in final image)
COPY --from=builder /install /usr/local

# Non-root user
RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid appuser --shell /bin/sh --create-home appuser

WORKDIR /home/appuser/app
COPY --from=builder --chown=appuser:appuser /build .

USER appuser

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "4", \
     "--proxy-headers", \
     "--forwarded-allow-ips", "*"]
