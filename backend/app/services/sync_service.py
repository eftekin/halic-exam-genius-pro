"""
Background sync service: detects Excel file changes and invalidates cache.

Uses HEAD requests to check ETag/Last-Modified. When the remote file changes,
invalidates the in-memory cache so the next request triggers a fresh fetch.
Runs as a non-blocking asyncio task per worker.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

import httpx

from app.config import settings
from app.services.exam_service import get_exam_dataframe, invalidate_cache

logger = logging.getLogger(__name__)

# Per-worker state for change detection
_last_etag: str | None = None
_last_modified: str | None = None


def _fingerprint(headers: dict[str, Any]) -> tuple[str | None, str | None]:
    """Extract ETag and Last-Modified from response headers."""
    etag = headers.get("etag") or headers.get("ETag")
    if etag:
        etag = etag.strip('"')
    last_mod = headers.get("last-modified") or headers.get("Last-Modified")
    return (etag, last_mod)


async def _check_for_updates() -> bool:
    """HEAD the Excel URL; return True if cache was invalidated."""
    global _last_etag, _last_modified

    url = settings.exam_schedule_url
    try:
        async with httpx.AsyncClient(
            verify=False,
            timeout=10.0,
            follow_redirects=True,
        ) as client:
            resp = await client.head(url)
            resp.raise_for_status()
    except Exception as exc:
        logger.warning("Sync check HEAD failed: %s", exc)
        return False

    etag, last_modified = _fingerprint(dict(resp.headers))

    # First run: store fingerprint, no invalidation
    if _last_etag is None and _last_modified is None:
        _last_etag = etag
        _last_modified = last_modified
        logger.info("Sync: initial fingerprint stored (etag=%s)", etag or "none")
        return False

    # Compare: if either changed, invalidate
    changed = (etag is not None and etag != _last_etag) or (
        last_modified is not None and last_modified != _last_modified
    )

    if changed:
        logger.info(
            "Sync: Excel changed (etag %s -> %s, last-modified %s -> %s), invalidating cache",
            _last_etag,
            etag,
            _last_modified,
            last_modified,
        )
        _last_etag = etag
        _last_modified = last_modified
        invalidate_cache()
        return True

    return False


async def run_sync_loop() -> None:
    """Background task: periodically check for Excel updates and invalidate cache."""
    interval = settings.sync_check_interval_seconds
    if interval <= 0:
        logger.info("Sync: disabled (sync_check_interval_seconds=0)")
        return

    logger.info("Sync: starting background checker (interval=%ds)", interval)

    while True:
        try:
            await _check_for_updates()
        except asyncio.CancelledError:
            logger.info("Sync: task cancelled")
            raise
        except Exception as exc:
            logger.exception("Sync: unexpected error: %s", exc)

        await asyncio.sleep(interval)


async def warm_cache() -> None:
    """Preload exam data on startup so first request is instant."""
    import asyncio

    loop = asyncio.get_running_loop()
    try:
        await loop.run_in_executor(None, get_exam_dataframe)
        logger.info("Cache: warmed successfully")
    except Exception as exc:
        logger.warning("Cache warmup failed (will fetch on first request): %s", exc)
