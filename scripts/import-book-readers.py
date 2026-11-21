#!/usr/bin/env python3
"""Rebuild the in-app original readers from the inspected Drive ZIPs.

The ZIPs are intentionally not shipped to learners. They must be downloaded to
./google_drive before running this importer. Indexed scans are converted into
local WebP files, verified audio is kept local, and unavailable or unreferenced
pages and outside links are pruned from each learner-facing table of contents.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import subprocess
from contextlib import ExitStack
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
BOOKS = ROOT / "public/materials/books"
OUT = ROOT / "public/materials/readers"
CONFIGS = {
    "A1.1": {
        "archive": "A1.1_v14_PARTE1_LIBRO.zip",
        "audioArchive": "A1.1_v14_PARTE2_AUDIO.zip",
        "root": "",
        "data": "tabs_data.js",
    },
    "A1.2": {
        "archive": "A1.2_TABS_V1_parte1.zip",
        "audioArchive": "A1.2_TABS_V1_parte2.zip",
        "root": "A1.2_TABS_V1/",
        "data": "A1.2_TABS_V1/tabs_data.js",
    },
    "A1.3": {
        "archive": "A1.3_parte1.zip",
        "root": "A1.3_TABS_V1/",
        "data": "A1.3_TABS_V1/tabs_data.js",
    },
    "A2.1": {
        "archive": "A2.1_READY_FOR_WEBSITE_a646862936.zip",
        "root": "A2.1/",
        "data": None,
    },
    "A2.2": {
        "archive": "A2.2_UNITS_5_6_7_8_GRAMMAR_VERBS_V8_3.zip",
        "root": "A2.2/",
        "data": None,
    },
    "A2.3": {
        "archive": "A2.3_COMPLETE_UNITS_9_10_V6_6_NO_EDIT.zip",
        "root": "",
        "data": None,
    },
}
STUDENT_CLEANUP_CSS = "#editBtn,#openAdmin,#adminPanel,#editTray{display:none!important;}"
IMAGE_ARCHIVES = {
    "A1.1": ["A1.1_v14_PARTE1_LIBRO.zip"],
    "A1.2": ["A1.2_TABS_V1_parte1.zip"],
    "A1.3": ["A1.3_parte1.zip", "A1.3_parte2.zip", "A1.3_parte3.zip"],
    "A2.1": ["A2.1_READY_FOR_WEBSITE_a646862936.zip"],
    "A2.2": ["A2.2_UNITS_5_6_7_8_GRAMMAR_VERBS_V8_3.zip"],
    "A2.3": ["A2.3_COMPLETE_UNITS_9_10_V6_6_NO_EDIT.zip"],
}


def read_literal(source: str, name: str) -> tuple[object, int, int]:
    match = re.search(r"\b(?:const|let|var)\s+" + re.escape(name) + r"\s*=\s*", source)
    if not match:
        raise ValueError(f"Missing JavaScript declaration: {name}")
    start = match.end()
    while source[start].isspace():
        start += 1
    if source[start] not in "[{":
        raise ValueError(f"{name} is not a JSON-compatible literal")
    stack: list[str] = []
    quote: str | None = None
    escaped = False
    for position in range(start, len(source)):
        char = source[position]
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            continue
        if char in "\"'":
            quote = char
        elif char in "[{":
            stack.append(char)
        elif char in "]}":
            stack.pop()
            if not stack:
                end = position + 1
                literal_text = re.sub(r",\s*([}\]])", r"\1", source[start:end])
                return json.loads(literal_text), start, end
    raise ValueError(f"Unclosed JavaScript literal: {name}")


def replace_literal(source: str, name: str, value: object) -> str:
    _, start, end = read_literal(source, name)
    rendered = json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    return source[:start] + rendered + source[end:]


def is_external(value: object) -> bool:
    return isinstance(value, str) and value.strip().lower().startswith(("https://", "http://", "//"))


def prune_index(value: object, allowed_pages: set[int], available_audio: set[str]) -> object | None:
    if isinstance(value, dict):
        # Exclude rows that are specifically external video/resource links.
        if any(is_external(value.get(key)) for key in ("url", "href", "src")):
            return None
        result: dict[str, object] = {}
        for key, item in value.items():
            if key in ("url", "href") and is_external(item):
                continue
            if key.isdigit() and int(key) not in allowed_pages:
                continue
            if key == "fl" and isinstance(item, list):
                item = [filename for filename in item if Path(filename).name in available_audio]
                if not item and value.get("k") == "d":
                    continue
            cleaned = prune_index(item, allowed_pages, available_audio)
            if cleaned is not None:
                result[key] = cleaned
        if isinstance(result.get("n"), list):
            result["n"] = [
                row for row in result["n"]
                if not isinstance(row, dict)
                or not isinstance(row.get("p"), int)
                or row["p"] in allowed_pages
            ]
        return result
    if isinstance(value, list):
        result = []
        for item in value:
            if isinstance(item, dict) and isinstance(item.get("p"), int) and item["p"] not in allowed_pages:
                continue
            cleaned = prune_index(item, allowed_pages, available_audio)
            if cleaned is not None:
                result.append(cleaned)
        return result
    return value


def trim_units(units: list[dict], allowed_pages: set[int], include_supplementary: bool = False) -> list[dict]:
    result = []
    for original in units:
        if original.get("k") in ("mg", "me") and not include_supplementary:
            continue
        unit = dict(original)
        for key in ("mg", "tr", "tr2"):
            if isinstance(unit.get(key), list):
                unit[key] = [page for page in unit[key] if page in allowed_pages]
        # Additional-exercise page ranges are not in the site's installed scan set.
        if isinstance(unit.get("me"), list) and len(unit["me"]) == 2:
            if not all(page in allowed_pages for page in unit["me"]):
                unit["me"] = []
        if isinstance(unit.get("met2"), int) and unit["met2"] not in allowed_pages:
            unit["met2"] = None
        result.append(unit)
    return result


def referenced_course_pages(units: list[dict]) -> set[int]:
    pages: set[int] = set()
    for unit in units:
        start, end = unit.get("lo"), unit.get("hi")
        if isinstance(start, int) and isinstance(end, int):
            pages.update(range(start, end + 1))
        for key in ("mg", "tr", "tr2"):
            pages.update(value for value in unit.get(key, []) if isinstance(value, int))
        extra = unit.get("me", [])
        if isinstance(extra, list):
            pages.update(value for value in extra if isinstance(value, int))
            if len(extra) == 2 and all(isinstance(value, int) for value in extra):
                pages.update(range(extra[0], extra[1] + 1))
        for key in ("met", "met2"):
            if isinstance(unit.get(key), int):
                pages.add(unit[key])
    return pages


def a1_audio_level(filename: str) -> str:
    match = re.fullmatch(r"auint_plus_1_(\d+)(?:_alt)?\.mp3", Path(filename).name)
    if not match:
        raise ValueError(f"Unexpected A1 audio filename: {filename}")
    track = int(match.group(1))
    if 13 <= track <= 21:
        return "A1.2"
    if 22 <= track <= 32:
        return "A1.3"
    return "A1.1"


def a1_audio_url_script() -> str:
    return (
        "<script>window.bookAudioUrl=function(file){"
        "const match=/^auint_plus_1_(\\d+)(?:_alt)?\\.mp3$/.exec(String(file||''));"
        "if(!match)return '/materials/books/A1.1/audio/'+encodeURIComponent(file);"
        "const n=Number(match[1]);const level=n>=13&&n<=21?'A1.2':n>=22&&n<=32?'A1.3':'A1.1';"
        "return '/materials/books/'+level+'/audio/'+encodeURIComponent(file);};</script>"
    )


def indexed_page_image_names(html: str) -> dict[int, str]:
    """Map original reader page IDs to the image filenames used by their sections."""
    result: dict[int, str] = {}
    sections = re.finditer(
        r"<section\b[^>]*\bid=[\"']p(\d+)[\"'][^>]*>.*?</section>",
        html,
        re.S | re.I,
    )
    for section in sections:
        image = re.search(r"\bsrc=[\"']pages/([^\"'?]+)", section.group(0), re.I)
        if image:
            result[int(section.group(1))] = image.group(1)
    return result


def install_a1_reader_assets(
    reader_id: str,
    archive: ZipFile,
    source_root: str,
    html: str,
    image_archives: list[ZipFile],
    audio_archive: ZipFile | None = None,
) -> tuple[set[int], set[str], set[int]]:
    """Install every page referenced by the original A1 index, including support pages."""
    converter = shutil.which("magick") or shutil.which("convert")
    if not converter:
        raise RuntimeError(f"{reader_id} page import requires ImageMagick (magick or convert) with WebP support")
    page_numbers, _, _ = read_literal(html, "PAGES")
    indexed_pages = {int(page) for page in page_numbers}
    page_image_names = indexed_page_image_names(html)
    missing_transcript_pages: set[int] = set()
    source_members: dict[str, ZipFile] = {}
    for source_archive in image_archives:
        for name in source_archive.namelist():
            if name.lower().endswith(".jpg"):
                source_members[name] = source_archive
    page_root = BOOKS / reader_id / "pages"
    page_root.mkdir(parents=True, exist_ok=True)
    for page in sorted(indexed_pages):
        is_transcript_page = 1001 <= page <= 1032
        source_scan = page_image_names.get(page, f"p{page:03d}.jpg")
        source_name = f"{source_root}pages/{source_scan}"
        if source_name not in source_members:
            if is_transcript_page:
                missing_transcript_pages.add(page)
                continue
            raise ValueError(f"{reader_id}: indexed page {page} is missing from inspected image archives: {source_name}")
        destination_name = Path(source_scan).with_suffix(".webp").name
        destination = page_root / destination_name
        if is_transcript_page:
            legacy_scan = page_root / f"p{page:03d}.webp"
            if legacy_scan.exists() and legacy_scan != destination:
                legacy_scan.unlink()
        if destination.is_file():
            continue
        command = [converter]
        if Path(converter).name == "magick":
            command.append("convert")
        command += ["jpg:-", "-strip", "-quality", "84", "-define", "webp:method=6", f"webp:{destination}"]
        result = subprocess.run(command, input=source_members[source_name].read(source_name), capture_output=True)
        if result.returncode:
            raise RuntimeError(f"{reader_id}: WebP conversion failed for {source_name}: {result.stderr.decode(errors='replace')[-500:]}")

    available_audio: set[str] = set()
    if audio_archive is not None:
        audio_root = BOOKS / reader_id / "audio"
        audio_root.mkdir(parents=True, exist_ok=True)
        source_audio = {
            Path(name).name: name for name in audio_archive.namelist()
            if name.lower().endswith(".mp3") and Path(name).name.startswith("auint_plus_1_")
        }
        expected_audio_count = {"A1.1": 52, "A1.2": 13}.get(reader_id)
        if expected_audio_count is None or len(source_audio) != expected_audio_count:
            raise ValueError(
                f"{reader_id}: expected {expected_audio_count} source MP3 files, found {len(source_audio)}"
            )
        for filename, member in source_audio.items():
            destination = BOOKS / a1_audio_level(filename) / "audio" / filename
            if not destination.is_file():
                if a1_audio_level(filename) != "A1.1":
                    raise ValueError(f"{reader_id}: shared A1 audio is missing at its mapped level: {destination}")
                destination.parent.mkdir(parents=True, exist_ok=True)
                destination.write_bytes(audio_archive.read(member))
            else:
                source_hash = hashlib.sha256(audio_archive.read(member)).digest()
                local_hash = hashlib.sha256(destination.read_bytes()).digest()
                if source_hash != local_hash:
                    raise ValueError(f"{reader_id}: shared audio differs from the inspected source: {filename}")
            available_audio.add(filename)
    installed_pages = indexed_pages - missing_transcript_pages
    print(
        f"{reader_id}: installed {len(installed_pages)} of {len(indexed_pages)} indexed scans; "
        f"{len(missing_transcript_pages)} transcript-page scans absent from source archives; "
        f"{len(available_audio)} shared A1 audio files verified"
    )
    return installed_pages, available_audio, missing_transcript_pages


def install_a2_assets(reader_id: str, archive: ZipFile, source_root: str, html: str) -> None:
    """Install only scans referenced by the course index plus its packaged audio."""
    converter = shutil.which("magick") or shutil.which("convert")
    if not converter:
        raise RuntimeError("A2.2/A2.3 page import requires ImageMagick (magick or convert) with WebP support")
    units, _, _ = read_literal(html, "UNITS")
    required_pages = referenced_course_pages(units)
    names = set(archive.namelist())
    course_assets = BOOKS / reader_id
    if course_assets.exists():
        shutil.rmtree(course_assets)
    page_root = course_assets / "pages"
    audio_root = course_assets / "audio"
    page_root.mkdir(parents=True, exist_ok=True)
    audio_root.mkdir(parents=True, exist_ok=True)
    for page in sorted(required_pages):
        source_name = f"{source_root}pages/p{page:03d}.jpg"
        if source_name not in names:
            raise ValueError(f"{reader_id}: source scan missing for referenced page {page}: {source_name}")
        destination = page_root / f"p{page:03d}.webp"
        command = [converter]
        if Path(converter).name == "magick":
            command.append("convert")
        command += ["jpg:-", "-strip", "-quality", "84", "-define", "webp:method=6", f"webp:{destination}"]
        result = subprocess.run(command, input=archive.read(source_name), capture_output=True)
        if result.returncode:
            raise RuntimeError(f"{reader_id}: WebP conversion failed for {source_name}: {result.stderr.decode(errors='replace')[-500:]}")
    audio_names = [
        name for name in names
        if name.startswith(source_root + "audio/") and name.lower().endswith(".mp3")
    ]
    for name in audio_names:
        (audio_root / Path(name).name).write_bytes(archive.read(name))
    print(f"{reader_id}: installed {len(required_pages)} referenced scans and {len(audio_names)} local recordings")


def add_lesson_unit_filter(html: str) -> str:
    marker = "const __lessonUnitKeys = new Set(new URLSearchParams(location.search).get('unit')?.split(',').filter(Boolean) || []);"
    if marker in html:
        return html
    pattern = re.compile(r"const PAGES\s*=\s*\[[^\]]*\]\s*;")
    match = pattern.search(html)
    if not match:
        raise ValueError("Reader is missing its PAGES declaration")
    filter_code = "\n" + marker + "\nif (__lessonUnitKeys.size) {\n  UNITS.splice(0, UNITS.length, ...UNITS.filter(unit => __lessonUnitKeys.has(unit.k)));\n  const __lessonPages = new Set();\n  UNITS.forEach(unit => { for (let page = unit.lo; page <= unit.hi; page += 1) __lessonPages.add(page); });\n  PAGES.splice(0, PAGES.length, ...PAGES.filter(page => __lessonPages.has(page)));\n}\n"
    return html[:match.end()] + filter_code + html[match.end():]


def main() -> None:
    parser = argparse.ArgumentParser(description="Import original in-app book readers from inspected ZIPs")
    parser.add_argument("--only", nargs="+", choices=CONFIGS, help="Import selected readers and preserve other manifest entries")
    args = parser.parse_args()
    selected = set(args.only or CONFIGS)
    OUT.mkdir(parents=True, exist_ok=True)
    manifest_path = OUT / "reader-manifest.json"
    if args.only and manifest_path.exists():
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    else:
        manifest = {}
    required_archives = set()
    for reader_id in selected:
        required_archives.add(CONFIGS[reader_id]["archive"])
        required_archives.update(IMAGE_ARCHIVES[reader_id])
        if CONFIGS[reader_id].get("audioArchive"):
            required_archives.add(CONFIGS[reader_id]["audioArchive"])
    missing_archives = [
        str(ROOT / "google_drive" / name)
        for name in sorted(required_archives)
        if not (ROOT / "google_drive" / name).is_file()
    ]
    if missing_archives:
        raise FileNotFoundError("Required source archive(s) not found; no reader files were changed: " + ", ".join(missing_archives))
    for reader_id, config in CONFIGS.items():
        if reader_id not in selected:
            continue
        target = OUT / reader_id
        if target.exists():
            shutil.rmtree(target)
        (target / "pages").mkdir(parents=True)
        archive_path = ROOT / "google_drive" / config["archive"]
        with ZipFile(archive_path) as archive:
            source_root = config["root"]
            html = archive.read(source_root + "index.html").decode("utf-8")
            a1_page_numbers: set[int] = set()
            a1_page_asset_names: dict[int, str] = {}
            a1_shared_audio: set[str] = set()
            a1_missing_transcript_pages: set[int] = set()
            if reader_id in ("A1.1", "A1.2", "A1.3"):
                with ExitStack() as stack:
                    image_archives = [archive]
                    for image_archive_name in IMAGE_ARCHIVES[reader_id]:
                        if image_archive_name == config["archive"]:
                            continue
                        image_archives.append(stack.enter_context(ZipFile(ROOT / "google_drive" / image_archive_name)))
                    audio_archive = None
                    if config.get("audioArchive"):
                        audio_archive = stack.enter_context(ZipFile(ROOT / "google_drive" / config["audioArchive"]))
                    a1_page_numbers, a1_shared_audio, a1_missing_transcript_pages = install_a1_reader_assets(
                        reader_id, archive, source_root, html, image_archives, audio_archive
                    )
                    original_page_images = indexed_page_image_names(html)
                    a1_page_asset_names = {
                        page: Path(original_page_images.get(
                            page,
                            f"t{page - 1000:03d}.jpg" if 1001 <= page <= 1032 else f"p{page:03d}.jpg",
                        )).with_suffix(".webp").name
                        for page in a1_page_numbers
                    }
            elif reader_id in ("A2.2", "A2.3"):
                install_a2_assets(reader_id, archive, source_root, html)
            page_files = sorted((BOOKS / reader_id / "pages").glob("*.webp"))
            allowed_pages = a1_page_numbers or {
                int(page.stem[1:]) for page in page_files
                if page.stem.startswith("p") and page.stem[1:].isdigit()
            }
            allowed_names = (
                {Path(asset).with_suffix(".jpg").name for asset in a1_page_asset_names.values()}
                if reader_id in ("A1.1", "A1.2", "A1.3")
                else {page.stem + ".jpg" for page in page_files}
            )
            audio_names = {page.name for page in (BOOKS / reader_id / "audio").glob("*.mp3")} | a1_shared_audio

            def rewrite_image(match: re.Match) -> str:
                filename = match.group(1)
                if filename in allowed_names:
                    return f'src="/materials/books/{reader_id}/pages/{Path(filename).stem}.webp"'
                return match.group(0)

            # Rewrite the selected-page template before generic markup scanning;
            # otherwise the quote inside this JavaScript string looks like HTML.
            if reader_id in ("A1.1", "A1.2", "A1.3"):
                dynamic_page_asset = (
                    f"src=\"/materials/books/{reader_id}/pages/' + "
                    "((p>=1001&&p<=1032)?'t'+String(p-1000).padStart(3,'0'):"
                    "'p'+String(p).padStart(3,'0')) + '.webp"
                )
                html = html.replace(
                    "src=\"pages/p' + String(p).padStart(3,'0') + '.jpg",
                    dynamic_page_asset,
                )
                html = html.replace(
                    'src="pages/p" + String(p).padStart(3,"0") + ".jpg',
                    f'src="/materials/books/{reader_id}/pages/" + '
                    '((p>=1001&&p<=1032)?"t"+String(p-1000).padStart(3,"0"):"p"+String(p).padStart(3,"0")) + ".webp',
                )
                fallback_asset = a1_page_asset_names[min(allowed_pages)]
                fallback_url = f"/materials/books/{reader_id}/pages/{fallback_asset}"
                html = html.replace('src="pages/p200.jpg?asset=u5-v3"', f'src="{fallback_url}"')
                html = html.replace('src="pages/p200.jpg"', f'src="{fallback_url}"')
            else:
                html = html.replace(
                    "src=\"pages/p' + String(p).padStart(3,'0') + '.jpg",
                    f"src=\"/materials/books/{reader_id}/pages/p' + String(p).padStart(3,'0') + '.webp",
                )
                html = html.replace(
                    'src="pages/p" + String(p).padStart(3,"0") + ".jpg',
                    f'src="/materials/books/{reader_id}/pages/p" + String(p).padStart(3,"0") + ".webp',
                )

            # Hide archive-only scans rather than expose blank or broken pages.
            section_pattern = re.compile(
                r"(<section\b[^>]*\bid=[\"']p(\d+)[\"'][^>]*>.*?</section>)",
                re.S | re.I,
            )
            removed_sections = 0

            def trim_page_section(match: re.Match) -> str:
                nonlocal removed_sections
                section = match.group(1)
                image = re.search(r"\bsrc=[\"']pages/([^\"']+)[\"']", section, re.I)
                if image and image.group(1) not in allowed_names:
                    removed_sections += 1
                    return ""
                return re.sub(
                    r"\bsrc=[\"']pages/([^\"']+)[\"']",
                    rewrite_image,
                    section,
                    flags=re.I,
                )

            html = section_pattern.sub(trim_page_section, html)
            # Replace remaining static image tags outside the page sections.
            html = re.sub(
                r"\bsrc=[\"']pages/([^\"']+)[\"']",
                rewrite_image,
                html,
                flags=re.I,
            )
            if reader_id == "A2.1":
                start = html.find("const PAGES = [];")
                marker = "PAGES.sort((x,y)=>x-y);"
                marker_end = html.find(marker, start)
                end = marker_end + len(marker) if marker_end >= 0 else -1
                if start < 0 or end < 0:
                    raise ValueError("A2.1 generated page list was not found")
                html = html[:start] + "const PAGES = " + json.dumps(sorted(allowed_pages)) + ";\n" + html[end:]
            else:
                html = replace_literal(html, "PAGES", sorted(allowed_pages))
            units, _, _ = read_literal(html, "UNITS")
            html = replace_literal(
                html,
                "UNITS",
                trim_units(units, allowed_pages, include_supplementary=reader_id in ("A1.1", "A1.2", "A1.3")),
            )
            overlay_data, _, _ = read_literal(html, "OV")
            html = replace_literal(html, "OV", prune_index(overlay_data, allowed_pages, audio_names))
            index_data, _, _ = read_literal(html, "IDX")
            html = replace_literal(html, "IDX", prune_index(index_data, allowed_pages, audio_names))
            page_info, _, _ = read_literal(html, "PINFO")
            html = replace_literal(html, "PINFO", prune_index(page_info, allowed_pages, audio_names))
            # Point course audio at verified, in-app files. A1.1's whole-book reader
            # spans tracks whose canonical files are already split across A1.1–A1.3.
            if reader_id == "A1.1":
                html = html.replace("new Audio('audio/' + b.fl[0])", "new Audio(window.bookAudioUrl(b.fl[0]))")
                html = html.replace("$('au').src = 'audio/' + files[0];", "$('au').src = window.bookAudioUrl(files[0]);")
                html = html.replace("$('au').src = 'audio/' + queue[qi];", "$('au').src = window.bookAudioUrl(queue[qi]);")
                html = html.replace("</head>", a1_audio_url_script() + "</head>", 1)
            else:
                html = html.replace("audio/", f"/materials/books/{reader_id}/audio/")
            html = re.sub(r"href=[\"'](?:https?:)?//[^\"']+[\"']", 'href="#"', html, flags=re.I)
            html = html.replace("</head>", f"<style>{STUDENT_CLEANUP_CSS}</style></head>", 1)
            html = add_lesson_unit_filter(html)
            html = "\n".join(line.rstrip() for line in html.splitlines()) + "\n"
            (target / "index.html").write_text(html, encoding="utf-8")

            if reader_id in ("A1.1", "A1.2", "A1.3"):
                data_match = re.search(
                    r"\bvar XD\s*=\s*(\{.*?\})\s*;",
                    archive.read(config["data"]).decode("utf-8"),
                    re.S,
                )
                if not data_match:
                    raise ValueError(f"Original activity data missing for {reader_id}")
                data = json.loads(data_match.group(1))
                data["listen"]["tracks"] = [track for track in data["listen"]["tracks"] if track.get("file") in audio_names]
                data["listen"]["bank"] = [question for question in data["listen"]["bank"] if question.get("file") in audio_names]
                (target / "tabs_data.js").write_text(
                    "var XD = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n",
                    encoding="utf-8",
                )
                for filename in ("tabs_engine.js", "tabs_style.css"):
                    script = archive.read(source_root + filename).decode("utf-8")
                    if filename == "tabs_style.css":
                        script += "\n" + STUDENT_CLEANUP_CSS + "\n"
                    script = script.replace("audio/", f"/materials/books/{reader_id}/audio/")
                    if reader_id == "A1.1" and filename == "tabs_engine.js":
                        script = script.replace(
                            'src="/materials/books/A1.1/audio/\'+t.file+\'"',
                            'src="\'+window.bookAudioUrl(t.file)+\'"',
                        )
                        script = script.replace(
                            "au.src = '/materials/books/A1.1/audio/'+cur.file;",
                            "au.src = window.bookAudioUrl(cur.file);",
                        )
                    (target / filename).write_text(script, encoding="utf-8")
                track_count = len(data["listen"]["tracks"])
                quiz_count = sum(len(items) for items in data["quiz"].values())
            else:
                for name in archive.namelist():
                    if name.startswith(source_root + "fonts/") and not name.endswith("/"):
                        destination = target / Path(name).relative_to(source_root)
                        destination.parent.mkdir(parents=True, exist_ok=True)
                        destination.write_bytes(archive.read(name))
                track_count = 15 if reader_id == "A2.1" else len(audio_names)
                quiz_count = 0

            # Guard actual markup (not source text embedded in scripts) against broken page links.
            from html.parser import HTMLParser

            class ImageAudit(HTMLParser):
                sources: list[str] = []
                in_script = False

                def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
                    attrs_dict = dict(attrs)
                    if tag.lower() == "script":
                        self.in_script = True
                    if tag.lower() == "img" and attrs_dict.get("src"):
                        self.sources.append(attrs_dict["src"] or "")

                def handle_endtag(self, tag: str) -> None:
                    if tag.lower() == "script":
                        self.in_script = False

            audit = ImageAudit()
            audit.feed(html)
            invalid = [src for src in audit.sources if src.startswith("pages/")]
            if invalid:
                raise ValueError(f"{reader_id}: unresolved local page references: {invalid[:4]}")

            core_ranges = {
                "A1.1": (10, 55), "A1.2": (56, 97), "A1.3": (98, 139),
                "A2.1": (10, 65), "A2.2": (66, 121), "A2.3": (122, 149),
            }
            core_start, core_end = core_ranges[reader_id]
            supplementary_pages = sorted(page for page in allowed_pages if not core_start <= page <= core_end)
            manifest[reader_id] = {
                "url": f"/materials/readers/{reader_id}/index.html",
                "sourceArchive": config["archive"],
                "pageNumbers": sorted(allowed_pages),
                "pageAssets": {
                    str(page): a1_page_asset_names.get(page, f"p{page:03d}.webp")
                    for page in sorted(allowed_pages)
                },
                "pageCount": len(allowed_pages),
                "supplementaryPageNumbers": supplementary_pages,
                "supplementaryPageCount": len(supplementary_pages),
                "missingIndexedTranscriptPages": sorted(a1_missing_transcript_pages),
                "interactiveQuizQuestions": quiz_count,
                "audioTracks": track_count,
                "readerAudioFiles": sorted(audio_names),
                "readerAudioFileCount": len(audio_names),
                "removedUnmappedPageSections": removed_sections,
                "sourcePackageRoot": source_root or ".",
                "imageArchives": IMAGE_ARCHIVES[reader_id],
                **({"audioArchive": config["audioArchive"]} if config.get("audioArchive") else {}),
            }
            print(
                f"{reader_id}: {len(allowed_pages)} pages, {quiz_count} interactive quiz questions, "
                f"{track_count} listening tracks; omitted {removed_sections} unavailable/unmapped page sections"
            )

    (OUT / "reader-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
