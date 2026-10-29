import datetime as dt
import json

import pandas as pd
import pytest

import sync


def row(
    code="AAA101",
    name="Course",
    date="2025-11-14 Cuma",
    start: str | dt.time = "09:00",
    end="10:00",
    section=1,
    program="Prog",
    rooms="101",
):
    return {
        sync.DATE: date,
        sync.START: start,
        sync.END: end,
        sync.CODE: code,
        sync.NAME: name,
        sync.SECTION: section,
        sync.PROGRAM: program,
        sync.ROOMS: rooms,
    }


def build(*rows):
    filler = [row(code=f"ZZZ{i:03}") for i in range(sync.MIN_EXAMS)]
    exams, stats = sync.build_exams(pd.DataFrame([*rows, *filler]))
    return [e for e in exams if not e["code"].startswith("ZZZ")], stats


def test_single_session_has_no_section_or_program():
    (e,), _ = build(row())
    assert (e["date"], e["start"], e["end"], e["rooms"]) == ("2025-11-14", "09:00", "10:00", ["101"])
    assert "section" not in e and "program" not in e


@pytest.mark.parametrize("cell", ["09:00", "09:00:00", dt.time(9, 0)])
def test_time_is_kept_as_written(cell):
    (e,), _ = build(row(start=cell))
    assert e["start"] == "09:00"


def test_dotted_date_format():
    (e,), _ = build(row(date="14.11.2025 Cuma"))
    assert e["date"] == "2025-11-14"


def test_sections_at_different_times_are_separate_and_labelled():
    exams, _ = build(row(section=1), row(section=2, date="2025-11-15 Cumartesi", rooms="202"))
    assert [(e["section"], e["date"], e["rooms"]) for e in exams] == [
        ("1", "2025-11-14", ["101"]),
        ("2", "2025-11-15", ["202"]),
    ]
    assert all("program" not in e for e in exams)


def test_section_clash_adds_program():
    exams, _ = build(row(program="Aşçılık"), row(program="Aşçılık (İ.Ö)", start="18:00", end="19:00"))
    assert [(e["section"], e["program"]) for e in exams] == [("1", "Aşçılık"), ("1", "Aşçılık (İ.Ö)")]


def test_sections_with_same_start_but_different_end_get_unique_ids():
    exams, _ = build(row(section=2, end="12:00"), row(section=4, end="11:00"))
    assert len({e["id"] for e in exams}) == 2


def test_same_group_in_two_slots_keeps_earliest_only():
    exams, stats = build(row(start="10:00", end="18:00", rooms="B"), row(start="09:00", end="10:00", rooms="A"))
    assert [(e["start"], e["rooms"]) for e in exams] == [("09:00", ["A"])]
    assert "section" not in exams[0]
    assert stats["hidden_later_slots"] == 1


def test_every_code_in_a_joined_row_is_searchable():
    exams, _ = build(row(code="BİM121; BİY203", name="Biyoloji; Kimya"))
    assert {(e["code"], e["name"], e["search_code"]) for e in exams} == {
        ("BİM121", "Biyoloji", "bim121"),
        ("BİY203", "Kimya", "biy203"),
    }


def test_name_containing_semicolon_is_not_truncated():
    full = "Sürdürülebilirlik: Toplum; Çevre ve Değişim"
    (e,), _ = build(row(code="HLÜ0019; HLÜ0019", name=f"{full}; {full}"))
    assert e["name"] == full


def test_unknown_time_format_fails():
    with pytest.raises(sync.SyncError, match="unrecognised exam time"):
        build(row(start="9.00"))


def test_missing_column_fails():
    with pytest.raises(sync.SyncError, match="missing columns"):
        sync.build_exams(pd.DataFrame([row()]).drop(columns=[sync.SECTION]))


def test_old_room_column_name_is_accepted():
    df = pd.DataFrame([row(code=f"C{i:03}") for i in range(sync.MIN_EXAMS)]).rename(
        columns={sync.ROOMS: "DERSLİK KODLARI"}
    )
    exams, _ = sync.build_exams(df)
    assert exams[0]["rooms"] == ["101"]


def test_too_few_exams_fails():
    with pytest.raises(sync.SyncError, match="expected at least"):
        sync.build_exams(pd.DataFrame([row()]))


def test_excel_roundtrip_and_unchanged_run_does_not_rewrite(tmp_path):
    rows = [row(code=f"C{i:03}", start=dt.time(9, 0) if i == 0 else "09:00") for i in range(sync.MIN_EXAMS)]
    xlsx = tmp_path / "in.xlsx"
    pd.DataFrame(rows).to_excel(xlsx, index=False)
    out = tmp_path / "exams.json"

    assert sync.main([str(xlsx), "--out", str(out)]) == 0
    data = json.loads(out.read_text(encoding="utf-8"))
    assert data["exams"][0]["start"] == "09:00" and len(data["exams"]) == sync.MIN_EXAMS
    first = out.read_text(encoding="utf-8")
    assert sync.main([str(xlsx), "--out", str(out)]) == 0
    assert out.read_text(encoding="utf-8") == first


def test_bad_file_writes_nothing(tmp_path):
    bad = tmp_path / "bad.xlsx"
    bad.write_text("<html>403</html>")
    out = tmp_path / "exams.json"
    assert sync.main([str(bad), "--out", str(out)]) == 1
    assert not out.exists()


def test_download_failure_is_a_clean_error(tmp_path):
    out = tmp_path / "exams.json"
    assert sync.main(["http://127.0.0.1:9/missing.xlsx", "--out", str(out)]) == 1
    assert not out.exists()
