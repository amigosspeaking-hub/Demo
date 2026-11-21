#!/usr/bin/env python3
"""Rebuild the in-app original readers from the inspected Drive ZIPs.

The ZIPs are intentionally not shipped to learners. They must be downloaded to
./google_drive before running this importer. Only reader code/data is copied;
book scans and audio continue to use the already-vetted public/materials/books
files. Unmapped archive-only pages and outside links are pruned from each TOC.
"""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
BOOKS = ROOT / "public/materials/books"
OUT = ROOT / "public/materials/readers"
CONFIGS = {
    "A1.1": {
        "archive": "A1.1_v14_PARTE1_LIBRO.zip",
        "root": "",
        "data": "tabs_data.js",
    },
    "A1.2": {
        "archive": "A1.2_TABS_V1_parte1.zip",
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
}
STUDENT_CLEANUP_CSS = "#editBtn,#openAdmin,#adminPanel,#editTray{display:none!important;}"
IMAGE_ARCHIVES = {
    "A1.1": ["A1.1_v14_PARTE1_LIBRO.zip"],
    "A1.2": ["A1.2_TABS_V1_parte1.zip"],
    "A1.3": ["A1.3_parte1.zip", "A1.3_parte2.zip", "A1.3_parte3.zip"],
    "A2.1": ["A2.1_READY_FOR_WEBSITE_a646862936.zip"],
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


def trim_units(units: list[dict], allowed_pages: set[int]) -> list[dict]:
    result = []
    for original in units:
        if original.get("k") in ("mg", "me"):
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


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest: dict[str, dict] = {}
    for reader_id, config in CONFIGS.items():
        target = OUT / reader_id
        if target.exists():
            shutil.rmtree(target)
        (target / "pages").mkdir(parents=True)
        archive_path = ROOT / "google_drive" / config["archive"]
        with ZipFile(archive_path) as archive:
            source_root = config["root"]
            html = archive.read(source_root + "index.html").decode("utf-8")
            page_files = sorted((BOOKS / reader_id / "pages").glob("p*.webp"))
            allowed_names = {page.stem + ".jpg" for page in page_files}
            allowed_pages = {int(page.stem[1:]) for page in page_files if page.stem[1:].isdigit()}
            audio_names = {page.name for page in (BOOKS / reader_id / "audio").glob("*.mp3")}

            def rewrite_image(match: re.Match) -> str:
                filename = match.group(1)
                if filename in allowed_names:
                    return f'src="/materials/books/{reader_id}/pages/{Path(filename).stem}.webp"'
                return match.group(0)

            # Rewrite the selected-page template before generic markup scanning;
            # otherwise the quote inside this JavaScript string looks like HTML.
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
            html = replace_literal(html, "UNITS", trim_units(units, allowed_pages))
            overlay_data, _, _ = read_literal(html, "OV")
            html = replace_literal(html, "OV", prune_index(overlay_data, allowed_pages, audio_names))
            index_data, _, _ = read_literal(html, "IDX")
            html = replace_literal(html, "IDX", prune_index(index_data, allowed_pages, audio_names))
            page_info, _, _ = read_literal(html, "PINFO")
            html = replace_literal(html, "PINFO", prune_index(page_info, allowed_pages, audio_names))
            # Point course audio at the verified, in-app files already installed for these levels.
            html = html.replace("audio/", f"/materials/books/{reader_id}/audio/")
            html = re.sub(r"href=[\"'](?:https?:)?//[^\"']+[\"']", 'href="#"', html, flags=re.I)
            if reader_id == "A2.1":
                html = html.replace("</head>", f"<style>{STUDENT_CLEANUP_CSS}</style></head>", 1)
            html = "\n".join(line.rstrip() for line in html.splitlines()) + "\n"
            (target / "index.html").write_text(html, encoding="utf-8")

            if reader_id != "A2.1":
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
                    (target / filename).write_text(script, encoding="utf-8")
                track_count = len(data["listen"]["tracks"])
                quiz_count = sum(len(items) for items in data["quiz"].values())
            else:
                for name in archive.namelist():
                    if name.startswith(source_root + "fonts/") and not name.endswith("/"):
                        destination = target / Path(name).relative_to(source_root)
                        destination.parent.mkdir(parents=True, exist_ok=True)
                        destination.write_bytes(archive.read(name))
                track_count = 15
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

            manifest[reader_id] = {
                "url": f"/materials/readers/{reader_id}/index.html",
                "sourceArchive": config["archive"],
                "pageNumbers": sorted(allowed_pages),
                "pageCount": len(allowed_pages),
                "interactiveQuizQuestions": quiz_count,
                "audioTracks": track_count,
                "removedUnmappedPageSections": removed_sections,
                "sourcePackageRoot": source_root or ".",
                "imageArchives": IMAGE_ARCHIVES[reader_id],
            }
            print(
                f"{reader_id}: {len(allowed_pages)} pages, {quiz_count} interactive quiz questions, "
                f"{track_count} listening tracks; omitted {removed_sections} unmapped page scans"
            )

    (OUT / "reader-manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
