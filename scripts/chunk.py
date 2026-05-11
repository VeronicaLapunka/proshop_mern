#!/usr/bin/env python3
"""
scripts/chunk.py — Semantic markdown chunker for ProShop docs.

Splits markdown files from docs/project-data/ into semantically meaningful
chunks for vector DB ingestion. Respects heading structure (H2/H3), never
splits code blocks or tables, adds overlap only when cutting long paragraphs.

Usage:
    python scripts/chunk.py                          # process all docs/project-data/**/*.md
    python scripts/chunk.py file1.md file2.md ...   # process specific files

Output: JSONL to stdout, progress to stderr.
Each line: {"text": "...", "metadata": {...}}
"""

import sys
import re
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
DOCS_DIR = PROJECT_ROOT / "docs" / "project-data"

# ~4 chars per token (English prose)
TARGET_TOKENS = 400
MAX_TOKENS = 600


def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)


def clean_for_summary(text: str) -> str:
    """Strip markdown formatting to get plain text for summary extraction."""
    s = re.sub(r"```.*?```", " ", text, flags=re.DOTALL)
    s = re.sub(r"`([^`\n]+)`", r"\1", s)
    s = re.sub(r"\*\*([^*]+)\*\*", r"\1", s)
    s = re.sub(r"\*([^*]+)\*", r"\1", s)
    s = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", s)
    s = re.sub(r"^#{1,6}\s+", "", s, flags=re.MULTILINE)
    s = re.sub(r"^\|.*\|$", "", s, flags=re.MULTILINE)
    s = re.sub(r"^[-*>]\s+", "", s, flags=re.MULTILINE)
    s = " ".join(s.split())
    return s


def extract_summary(text: str) -> str:
    """First complete sentence of the chunk (plain text)."""
    clean = clean_for_summary(text)
    # Match first sentence: at least 15 chars, ends with . ! or ?
    m = re.search(r"[A-Z][^.!?]{14,}[.!?]", clean)
    if m:
        return m.group(0).strip()
    # Fallback: first 180 chars
    snippet = clean[:180].strip()
    return snippet + ("\u2026" if len(clean) > 180 else "")


def extract_keywords(text: str, parent_headings: list) -> list:
    """
    Heuristic keyword extraction:
    - Heading words (stripped of numbering)
    - **bold** terms
    - `code` spans (short, not shell commands)
    """
    kws = set()

    for h in parent_headings:
        stripped = re.sub(r"^\d+[\d.]*\s+", "", h).strip()
        if stripped:
            kws.add(stripped)

    for m in re.finditer(r"\*\*([^*\n]{2,60})\*\*", text):
        kws.add(m.group(1).strip())

    skip_prefixes = ("npm ", "cd ", "git ", "curl ", "docker ", "mkdir ", "./")
    for m in re.finditer(r"`([^`\n]{2,40})`", text):
        kw = m.group(1).strip()
        if not any(kw.startswith(p) for p in skip_prefixes):
            kws.add(kw)

    # Remove items that are substrings of other items
    result = sorted(kws)
    filtered = []
    for kw in result:
        if not any(kw != other and kw in other for other in result):
            filtered.append(kw)

    return filtered[:12]


# ---------------------------------------------------------------------------
# Markdown parser
# ---------------------------------------------------------------------------

def parse_frontmatter(lines):
    """Extract YAML-lite frontmatter if present. Returns (meta, remaining_lines)."""
    if not lines or lines[0].strip() != "---":
        return {}, lines
    end = 1
    while end < len(lines) and lines[end].strip() != "---":
        end += 1
    fm = {}
    for line in lines[1:end]:
        if ":" in line:
            k, _, v = line.partition(":")
            fm[k.strip()] = v.strip()
    return fm, lines[end + 1:]


def heading_level(line, in_code):
    """Return (level, text) if line is a heading outside a code block."""
    if in_code:
        return None
    m = re.match(r"^(#{1,4})\s+(.*)", line)
    if m:
        return len(m.group(1)), m.group(2).strip()
    return None


def split_into_sections(lines):
    """
    Split lines into sections: list of (heading_level, heading_text, body_lines).
    Heading level 0 = preamble before first heading.
    Never splits inside a code block.
    """
    sections = []
    cur_level = 0
    cur_heading = ""
    cur_body = []
    in_code = False

    for line in lines:
        if re.match(r"^```", line.rstrip()):
            in_code = not in_code

        info = heading_level(line, in_code)
        if info:
            if cur_heading or cur_body:
                sections.append((cur_level, cur_heading, cur_body))
            cur_level, cur_heading = info
            cur_body = []
        else:
            cur_body.append(line)

    if cur_heading or cur_body:
        sections.append((cur_level, cur_heading, cur_body))

    return sections


def split_long_text(text):
    """
    Split text exceeding MAX_TOKENS at paragraph boundaries.
    Carries the last sentence of the previous paragraph as overlap.
    Code blocks and tables are never split.
    """
    paragraphs = []
    current_lines = []
    in_code = False

    for line in text.splitlines():
        if re.match(r"^```", line.rstrip()):
            in_code = not in_code
        if not in_code and line.strip() == "" and current_lines:
            paragraphs.append("\n".join(current_lines))
            current_lines = []
        else:
            current_lines.append(line)
    if current_lines:
        paragraphs.append("\n".join(current_lines))

    chunks = []
    current_parts = []
    current_tokens = 0
    overlap = ""

    for para in paragraphs:
        para_tokens = estimate_tokens(para)
        if current_tokens + para_tokens > MAX_TOKENS and current_parts:
            prefix = (overlap + "\n\n") if overlap else ""
            chunks.append((prefix + "\n\n".join(current_parts)).strip())
            sentences = re.split(r"(?<=[.!?])\s+", current_parts[-1])
            overlap = sentences[-1].strip() if len(sentences) > 1 else ""
            current_parts = [para]
            current_tokens = para_tokens + estimate_tokens(overlap)
        else:
            current_parts.append(para)
            current_tokens += para_tokens

    if current_parts:
        prefix = (overlap + "\n\n") if overlap else ""
        chunks.append((prefix + "\n\n".join(current_parts)).strip())

    return chunks if chunks else [text.strip()]


# ---------------------------------------------------------------------------
# Main processing
# ---------------------------------------------------------------------------

def process_file(path):
    content = path.read_text(encoding="utf-8")
    raw_lines = content.splitlines()

    frontmatter, lines = parse_frontmatter(raw_lines)
    rel_path = path.relative_to(PROJECT_ROOT)

    # Document title: frontmatter > H1 > filename
    doc_title = frontmatter.get("title", "")
    if not doc_title:
        for line in lines[:15]:
            m = re.match(r"^#\s+(.*)", line)
            if m:
                doc_title = m.group(1).strip()
                break
    if not doc_title:
        doc_title = path.stem.replace("-", " ").title()

    sections = split_into_sections(lines)

    chunks = []
    heading_stack = []  # list of (level, text)

    for level, heading, body_lines in sections:
        body = "\n".join(body_lines).strip()

        # Update breadcrumb stack
        if level > 0:
            heading_stack = [(lvl, txt) for lvl, txt in heading_stack if lvl < level]
            heading_stack.append((level, heading))

        parent_headings = [txt for _, txt in heading_stack]

        chunk_text = ("{}  {}\n\n{}".format("#" * level, heading, body)).strip() if heading else body
        if not chunk_text:
            continue

        token_count = estimate_tokens(chunk_text)

        if token_count <= MAX_TOKENS:
            chunks.append(_make_chunk(chunk_text, rel_path, path.name, doc_title, parent_headings, token_count))
        else:
            for sub_text in split_long_text(chunk_text):
                if sub_text.strip():
                    chunks.append(_make_chunk(sub_text, rel_path, path.name, doc_title, parent_headings, estimate_tokens(sub_text)))

    for i, ch in enumerate(chunks):
        ch["metadata"]["chunk_index"] = i

    return chunks


def _make_chunk(text, rel_path, source_file, title, parent_headings, token_count):
    return {
        "text": text,
        "metadata": {
            "source_file": source_file,
            "file_path": str(rel_path),
            "title": title,
            "parent_headings": parent_headings,
            "keywords": extract_keywords(text, parent_headings),
            "summary": extract_summary(text),
            "language": "en",
            "chunk_index": -1,
            "token_count": token_count,
        },
    }


def main():
    if len(sys.argv) > 1:
        files = [Path(f) for f in sys.argv[1:]]
    else:
        files = sorted(DOCS_DIR.rglob("*.md"))

    all_chunks = []
    for f in files:
        try:
            file_chunks = process_file(f)
            all_chunks.extend(file_chunks)
            print("[chunk.py] {}: {} chunks".format(f.relative_to(PROJECT_ROOT), len(file_chunks)), file=sys.stderr)
        except Exception as exc:
            print("[chunk.py] ERROR {}: {}".format(f, exc), file=sys.stderr)
            raise

    for chunk in all_chunks:
        sys.stdout.write(json.dumps(chunk, ensure_ascii=False) + "\n")

    print("[chunk.py] Total: {} chunks from {} files".format(len(all_chunks), len(files)), file=sys.stderr)


if __name__ == "__main__":
    main()
