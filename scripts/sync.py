"""Build frontend/public/data/exams.json from the university's exam Excel.

Usage: uv run sync.py <xlsx url or path> [--out PATH]

Known format variations are handled explicitly; anything else raises, so a bad
file fails the run and the last good JSON stays deployed. Exam times are kept
exactly as the Excel states them (Istanbul wall clock); nothing converts time zones.
"""

from __future__ import annotations

import argparse
import datetime as dt
import io
import json
import os
import sys
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

import pandas as pd

DATE, START, END = "SINAV GÜNÜ", "BAŞLANGIÇ SAATİ", "BİTİŞ SAATİ"
CODE, NAME, SECTION, PROGRAM, ROOMS = "DERS KODU", "DERS ADI", "ŞUBE", "PROGRAM ADI", "DERSLİK/ODA KODLARI"
REQUIRED = [DATE, START, END, CODE, NAME, SECTION, PROGRAM, ROOMS]
ALIASES = {"DERSLİK KODLARI": ROOMS}  # 2023-24 and 2024 spring files
MIN_EXAMS = 100
DEFAULT_OUT = Path(__file__).resolve().parent.parent / "frontend" / "public" / "data" / "exams.json"
SOURCE_FILE = Path(__file__).resolve().parent / "source.url"
ASCII = str.maketrans("ÇĞİÖŞÜçğıöşü", "CGIOSUcgiosu")


class SyncError(Exception):
    pass


def _blank(value) -> bool:
    return value is None or (isinstance(value, float) and pd.isna(value)) or str(value).strip() == ""


def _split(value) -> list[str]:
    if _blank(value):
        return []
    if isinstance(value, float) and value.is_integer():
        value = int(value)  # ŞUBE becomes float when the column has blanks
    return [p.strip() for p in str(value).split(";") if p.strip()]


def parse_date(value, row: int) -> str:
    if isinstance(value, (dt.datetime, pd.Timestamp)):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, str) and value.strip():
        token = value.strip().split()[0]  # "2025-11-14 Cuma"
        for fmt in ("%Y-%m-%d", "%d.%m.%Y"):
            try:
                return dt.datetime.strptime(token, fmt).strftime("%Y-%m-%d")
            except ValueError:
                pass
    raise SyncError(f"row {row}: unrecognised exam date {value!r}")


def parse_time(value, row: int) -> str:
    if isinstance(value, dt.time):
        return value.strftime("%H:%M")
    if isinstance(value, str):
        for fmt in ("%H:%M", "%H:%M:%S"):
            try:
                return dt.datetime.strptime(value.strip(), fmt).strftime("%H:%M")
            except ValueError:
                pass
    raise SyncError(f"row {row}: unrecognised exam time {value!r}")


def split_names(value, n: int, row: int) -> list[str]:
    """Names are ';'-joined like codes, but a name can contain ';' itself."""
    if _blank(value):
        raise SyncError(f"row {row}: missing course name")
    parts = [p.strip() for p in str(value).split(";")]
    if n == 1 or len(parts) == 1:
        return [str(value).strip()] * n
    if len(parts) == n:
        return parts
    if len(parts) % n == 0:
        k = len(parts) // n
        chunks = ["; ".join(parts[i : i + k]) for i in range(0, len(parts), k)]
        if len(set(chunks)) == 1:
            return chunks
    raise SyncError(f"row {row}: cannot match {n} course codes to names {value!r}")


def _section_key(s: str):
    return (not s.isdigit(), int(s) if s.isdigit() else 0, s)


def read_rows(df: pd.DataFrame) -> list[dict]:
    df = df.rename(columns={k: v for k, v in ALIASES.items() if v not in df.columns})
    missing = [c for c in REQUIRED if c not in df.columns]
    if missing:
        raise SyncError(f"missing columns {missing}; got {list(df.columns)}")
    rows = []
    for i, r in enumerate(df.to_dict("records")):
        row = i + 2  # Excel row number, header is row 1
        codes = list(dict.fromkeys(c.upper() for c in _split(r[CODE])))
        if not codes:
            raise SyncError(f"row {row}: missing course code")
        names = split_names(r[NAME], len(_split(r[CODE])), row)
        slot = (parse_date(r[DATE], row), parse_time(r[START], row), parse_time(r[END], row))
        for code in codes:
            rows.append(
                {
                    "code": code,
                    "name": names[[c.upper() for c in _split(r[CODE])].index(code)],
                    "slot": slot,
                    "group": (frozenset(_split(r[PROGRAM])), frozenset(_split(r[SECTION]))),
                    "programs": _split(r[PROGRAM]),
                    "sections": _split(r[SECTION]),
                    "rooms": _split(r[ROOMS]),
                }
            )
    return rows


def build_exams(df: pd.DataFrame) -> tuple[list[dict], Counter]:
    stats: Counter = Counter()
    by_code: dict[str, list[dict]] = defaultdict(list)
    for r in read_rows(df):
        by_code[r["code"]].append(r)

    exams = []
    for code, rows in by_code.items():
        # B: the same program+section group in several slots -> keep only its earliest slot
        earliest: dict = {}
        for r in rows:
            earliest[r["group"]] = min(earliest.get(r["group"], r["slot"]), r["slot"])
        kept = [r for r in rows if r["slot"] == earliest[r["group"]]]
        stats["hidden_later_slots"] += len({(r["group"], r["slot"]) for r in rows}) - len(earliest)

        slots: dict[tuple, list[dict]] = defaultdict(list)
        for r in kept:
            slots[r["slot"]].append(r)
        name = Counter(r["name"] for r in rows).most_common(1)[0][0]

        entries = []
        for slot, srows in sorted(slots.items()):
            entry = {
                "id": f"{code}-{slot[0]}-{slot[1]}-{slot[2]}",
                "code": code,
                "name": name,
                "search_code": code.translate(ASCII).lower(),
                "date": slot[0],
                "start": slot[1],
                "end": slot[2],
                "rooms": list(dict.fromkeys(room for r in srows for room in r["rooms"])),
            }
            if len(slots) > 1:  # A: sessions differ by section -> show which one
                entry["section"] = "; ".join(sorted({s for r in srows for s in r["sections"]}, key=_section_key))
                entry["_programs"] = "; ".join(sorted({p for r in srows for p in r["programs"]}))
            entries.append(entry)

        if len(entries) > 1:
            stats["multi_session_courses"] += 1
            clashing = {s for s, n in Counter(e["section"] for e in entries).items() if n > 1}
            for e in entries:
                if e["section"] in clashing:
                    e["program"] = e["_programs"]
                    stats["section_clashes"] += 1
            labels = Counter((e["section"], e.get("program")) for e in entries)
            if any(n > 1 for n in labels.values()):
                raise SyncError(f"{code}: sessions cannot be told apart: {[(e['date'], e['start']) for e in entries]}")
        for e in entries:
            e.pop("_programs", None)
        exams.extend(entries)

    exams.sort(key=lambda e: (e["date"], e["start"], e["code"], e.get("section", "")))
    if len(exams) < MIN_EXAMS:
        raise SyncError(f"only {len(exams)} exams parsed, expected at least {MIN_EXAMS}")
    dup_ids = [i for i, n in Counter(e["id"] for e in exams).items() if n > 1]
    if dup_ids:
        raise SyncError(f"duplicate exam ids: {dup_ids[:5]}")
    stats["exams"], stats["courses"] = len(exams), len(by_code)
    return exams, stats


def load(source: str) -> pd.DataFrame:
    if source.startswith(("http://", "https://")):
        req = urllib.request.Request(
            source, headers={"User-Agent": "halic-exam-genius-sync (+https://github.com/eftekin/halic-exam-genius-pro)"}
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = resp.read()
        except OSError as exc:  # URLError, HTTPError and timeouts
            raise SyncError(f"cannot download {source}: {exc}") from exc
    else:
        data = Path(source).read_bytes()
    try:
        return pd.read_excel(io.BytesIO(data), engine="openpyxl")
    except Exception as exc:
        raise SyncError(f"cannot read Excel from {source}: {exc}") from exc


def render(exams: list[dict], source: str, updated_at: str) -> str:
    # One exam per line keeps git diffs readable when the university edits a row
    lines = ",\n".join(json.dumps(e, ensure_ascii=False, separators=(",", ":")) for e in exams)
    head = json.dumps({"updated_at": updated_at, "source": source}, ensure_ascii=False)[:-1]
    return f'{head},"exams":[\n{lines}\n]}}\n'


def write_if_changed(out: Path, exams: list[dict], source: str) -> bool:
    if out.exists():
        old = json.loads(out.read_text(encoding="utf-8"))
        if old.get("exams") == exams and old.get("source") == source:
            return False
    now = dt.datetime.now(dt.timezone(dt.timedelta(hours=3))).isoformat(timespec="seconds")  # Istanbul, no DST
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix(".tmp")
    tmp.write_text(render(exams, source, now), encoding="utf-8")
    os.replace(tmp, out)
    return True


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Build exams.json from the exam Excel")
    ap.add_argument("source", nargs="?", help=f"xlsx URL or local path (default: {SOURCE_FILE.name})")
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    args = ap.parse_args(argv)
    src = args.source or SOURCE_FILE.read_text(encoding="utf-8").strip()
    try:
        exams, stats = build_exams(load(src))
    except SyncError as exc:
        print(f"sync failed: {exc}", file=sys.stderr)
        return 1
    source = src if src.startswith("http") else Path(src).name
    changed = write_if_changed(args.out, exams, source)
    print(f"**{'updated' if changed else 'unchanged'}**: {source}\n")
    print(f"- {stats['exams']} exams, {stats['courses']} courses")
    print(f"- {exams[0]['date']} → {exams[-1]['date']}")
    print(f"- {stats['multi_session_courses']} multi-session courses, {stats['hidden_later_slots']} later slots hidden")
    return 0


if __name__ == "__main__":
    sys.exit(main())
