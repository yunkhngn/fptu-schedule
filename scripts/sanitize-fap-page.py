#!/usr/bin/env python3
"""
scripts/sanitize-fap-page.py
Sanitizes FAP MHTML snapshot files into clean, structure-only HTML fixtures free of personal data.

Usage:
    python3 scripts/sanitize-fap-page.py <input.mhtml> <output.html>
    python3 scripts/sanitize-fap-page.py [--all]
"""

import sys
import os
import re
import json
import html
from pathlib import Path
import email
from email import policy
from html.parser import HTMLParser
from urllib.parse import urlparse

VOID_ELEMENTS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr"
}

PRESERVED_TAGS = {
    "th", "label", "legend", "button", "h1", "h2", "h3", "h4", "h5", "h6", "option"
}

PRESERVED_CLASSES = {
    "btn", "badge", "card-header", "modal-title", "alert"
}

# Explicit mapping from snapshot route to pattern & slug
PAGE_METADATA = {
    "/Report/Transcript": {"pattern": "report", "slug": "report-transcript"},
    "/Report/Grade": {"pattern": "report", "slug": "report-grade"},
    "/Report/Attendance": {"pattern": "report", "slug": "report-attendance"},
    "/Application/Create": {"pattern": "form", "slug": "application-create"},
    "/StudentProfile": {"pattern": "form", "slug": "student-profile"},
    "/Document/Detail": {"pattern": "detail", "slug": "document-detail"},
    "/News/Detail": {"pattern": "detail", "slug": "news-detail"},
    "/MyCertificates": {"pattern": "list", "slug": "my-certificates"},
    "/Wishlist": {"pattern": "list", "slug": "wishlist"},
    "/FyeCheckInLog": {"pattern": "list", "slug": "fye-check-in-log"},
    "/FyeMentorFeedback": {"pattern": "list", "slug": "fye-mentor-feedback"},
    "/Transaction": {"pattern": "list", "slug": "transaction"},
    "/Application/Catalog": {"pattern": "list", "slug": "application-catalog"},
    "/StartupGroup/Add": {"pattern": "form", "slug": "startup-group-add"},
    "/Curriculum": {"pattern": "list", "slug": "curriculum"},
    "/ExamSchedule": {"pattern": "report", "slug": "exam-schedule"},
    "/Auth/Login": {"pattern": "form", "slug": "auth-login"},
    "/CoursePendingPayment": {"pattern": "cart", "slug": "course-pending-payment"},
    "/Subject": {"pattern": "list", "slug": "subject"},
    "/Document": {"pattern": "list", "slug": "document"},
    "/CrossClassChange/Create": {"pattern": "form", "slug": "cross-class-change-create"},
    "/ShoppingCart": {"pattern": "cart", "slug": "shopping-cart"},
    "/Report/OjtConditions": {"pattern": "report", "slug": "report-ojt-conditions"},
    "/Report/ThesisConditions": {"pattern": "report", "slug": "report-thesis-conditions"},
    "/Account": {"pattern": "profile", "slug": "account"},
    "/WeeklyTimetable": {"pattern": "report", "slug": "weekly-timetable"},
    "/News": {"pattern": "list", "slug": "news"},
    "/": {"pattern": "list", "slug": "home"},
    "/Application": {"pattern": "list", "slug": "application"},
    "/Wishlist/Register": {"pattern": "form", "slug": "wishlist-register"},
    "/StartupGroup": {"pattern": "empty", "slug": "startup-group"},
    "/CrossClassChange": {"pattern": "empty", "slug": "cross-class-change"},
}


class Node:
    def __init__(self, tag=None, attrs=None, text=None):
        self.tag = tag.lower() if tag else None
        self.attrs = attrs or {}
        self.text = text
        self.children = []
        self.parent = None


class HTMLTreeParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node(tag="root")
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        tag_lower = tag.lower()
        node = Node(tag=tag_lower, attrs=dict(attrs))
        node.parent = self.stack[-1]
        self.stack[-1].children.append(node)
        if tag_lower not in VOID_ELEMENTS:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        tag_lower = tag.lower()
        node = Node(tag=tag_lower, attrs=dict(attrs))
        node.parent = self.stack[-1]
        self.stack[-1].children.append(node)

    def handle_endtag(self, tag):
        tag_lower = tag.lower()
        if tag_lower in VOID_ELEMENTS:
            return
        for i in range(len(self.stack) - 1, 0, -1):
            if self.stack[i].tag == tag_lower:
                self.stack = self.stack[:i]
                break

    def handle_data(self, data):
        if self.stack:
            node = Node(text=data)
            node.parent = self.stack[-1]
            self.stack[-1].children.append(node)


def find_node(node, predicate):
    if predicate(node):
        return node
    for ch in node.children:
        res = find_node(ch, predicate)
        if res:
            return res
    return None


def prune_node(node):
    new_children = []
    tr_count = 0
    is_tbody = (node.tag == "tbody")

    for ch in node.children:
        if ch.tag:
            # 1. Strip script, style, link, iframe
            if ch.tag in {"script", "style", "link", "iframe"}:
                continue
            # 2. Strip hidden inputs
            if ch.tag == "input" and ch.attrs.get("type", "").lower() == "hidden":
                continue
            # 3. Strip extension-injected nodes
            node_id = ch.attrs.get("id", "")
            classes = ch.attrs.get("class", "").split()
            href = ch.attrs.get("href", "")
            src = ch.attrs.get("src", "")
            if (node_id.startswith("jpenglishdictionary") or
                node_id.startswith("englishjp") or
                node_id in ("mttContainer", "gpa-main-btn") or
                "ezse.net" in href or
                "ezse.net" in src or
                "bootstrapiso" in classes or
                any(c.startswith("jpenglishdictionary") for c in classes)):
                continue
            # 4. Limit tbody tr to max 3
            if is_tbody and ch.tag == "tr":
                tr_count += 1
                if tr_count > 3:
                    continue
            prune_node(ch)
        new_children.append(ch)
    node.children = new_children


def sanitize_attributes(node):
    if not node.tag:
        return

    # Clear value on inputs (except checkbox and radio)
    if node.tag == "input":
        inp_type = node.attrs.get("type", "text").lower()
        if inp_type not in ("checkbox", "radio"):
            node.attrs.pop("value", None)

    # Clear textarea contents and value
    if node.tag == "textarea":
        node.children = []
        node.attrs.pop("value", None)

    # href and src sanitization
    for attr in ("href", "src"):
        if attr in node.attrs:
            val = node.attrs[attr]
            if val.startswith("data:"):
                node.attrs[attr] = ""
            elif val.startswith("mailto:") or val.startswith("tel:"):
                node.attrs[attr] = "#"
            else:
                val = val.split("?")[0]
                val = re.sub(r"/[0-9a-fA-F-]{32,36}", "", val)
                if "#" in val and val != "#":
                    val = val.split("#")[0]
                node.attrs[attr] = val

    # Remove data-order
    node.attrs.pop("data-order", None)

    # General attribute personal data protection
    for k, v in list(node.attrs.items()):
        if isinstance(v, str):
            if "@" in v:
                v = re.sub(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", "user-masked", v)
            if re.search(r"\b[A-Z]{2}\d{5,}\b", v):
                v = re.sub(r"\b([A-Z]{2})(\d{5,})\b", r"\1 \2", v)
            if re.search(r"(?:\+84|\b0)\d{8,10}\b|\b\d{9,}\b", v):
                v = re.sub(r"(?:\+84|\b0)\d{8,10}\b|\b\d{9,}\b", "0000", v)
            node.attrs[k] = v

    for ch in node.children:
        sanitize_attributes(ch)


def is_preserved_node(node):
    if not node.tag:
        return False
    classes = node.attrs.get("class", "").split()
    # Explicitly do NOT preserve student names
    if "student-profile-name" in classes or "fap-home-student-card__name" in classes:
        return False
    if node.tag in PRESERVED_TAGS:
        return True
    for c in classes:
        if (c in PRESERVED_CLASSES or
            c.startswith("btn-") or
            c.startswith("badge-") or
            c.startswith("fap-page-title") or
            c.startswith("alert-")):
            return True
    return False


def sanitize_preserved_text(text):
    text = re.sub(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", lambda m: m.group(0).replace("@", "-"), text)
    text = re.sub(r"Nguyễn Đăng Khoa", "Nguyễn Văn A", text)
    text = re.sub(r"KhoaND", "SV000000", text)
    text = re.sub(r"\b[A-Z]{2}\s*\d{5,}\b", "SV-0000", text)
    text = re.sub(r"\b([A-Z]{2})(\d{5,})\b", r"\1 \2", text)
    text = re.sub(r"(?:\+84|\b0)\d{8,10}\b|\b\d{9,}\b", lambda m: " ".join(re.findall(r"\d{1,4}", m.group(0))), text)
    return text


def mask_char(ch):
    if ch.isalpha():
        return "a" if ch.islower() else "A"
    elif ch.isdigit():
        return "0"
    return ch


def mask_text(text):
    masked = "".join(mask_char(c) for c in text)
    masked = re.sub(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+", lambda m: m.group(0).replace("@", "-"), masked)
    masked = re.sub(r"\b([A-Z]{2})(\d{5,})\b", r"\1 \2", masked)
    masked = re.sub(r"(?:\+84|\b0)\d{8,10}\b|\b\d{9,}\b", lambda m: " ".join(re.findall(r"\d{1,4}", m.group(0))), masked)
    return masked


def mask_tree_text(node, preserved=False):
    is_pres = preserved or is_preserved_node(node)
    for ch in node.children:
        if ch.text is not None:
            if is_pres:
                ch.text = sanitize_preserved_text(ch.text)
            else:
                classes = node.attrs.get("class", "").split()
                if "student-profile-name" in classes:
                    ch.text = "Nguyễn Văn A"
                else:
                    ch.text = mask_text(ch.text)
        else:
            mask_tree_text(ch, is_pres)


def serialize(node):
    if node.text is not None:
        return html.escape(node.text, quote=False)
    if not node.tag or node.tag == "root":
        return "".join(serialize(ch) for ch in node.children)
    attrs_str = ""
    for k, v in node.attrs.items():
        if v is None or v == "":
            attrs_str += f" {k}" if v is None else f' {k}=""'
        else:
            attrs_str += f' {k}="{html.escape(str(v), quote=True)}"'
    if node.tag in VOID_ELEMENTS and not node.children:
        return f"<{node.tag}{attrs_str}/>"
    children_str = "".join(serialize(ch) for ch in node.children)
    return f"<{node.tag}{attrs_str}>{children_str}</{node.tag}>"


def extract_html_and_location(mhtml_path):
    with open(mhtml_path, "rb") as fp:
        msg = email.message_from_binary_file(fp, policy=policy.default)
        location = msg.get("Snapshot-Content-Location", "")
        raw_html = ""
        for part in msg.walk():
            if part.get_content_type() == "text/html":
                raw_html = part.get_payload(decode=True).decode(
                    part.get_content_charset() or "utf-8", errors="replace"
                )
                break
    return raw_html, location


def resolve_metadata_from_location(location):
    parsed = urlparse(location)
    path = parsed.path or "/"
    normalized_path = re.sub(r"/[0-9a-fA-F-]{32,36}$", "", path)
    if normalized_path in PAGE_METADATA:
        meta = PAGE_METADATA[normalized_path].copy()
        meta["route"] = normalized_path
        return meta

    slug = normalized_path.strip("/").replace("/", "-").lower() or "home"
    return {"slug": slug, "route": normalized_path, "pattern": "list"}


def sanitize_mhtml_content(raw_html):
    parser = HTMLTreeParser()
    parser.feed(raw_html)

    cp = find_node(
        parser.root,
        lambda n: n.tag == "div" and "content-page" in n.attrs.get("class", "").split(),
    )
    if not cp:
        body = find_node(parser.root, lambda n: n.tag == "body") or parser.root
        cp = Node(tag="div", attrs={"class": "content-page"})
        cp.children = body.children

    prune_node(cp)
    sanitize_attributes(cp)
    mask_tree_text(cp)
    return serialize(cp)


def sanitize_mhtml_file(mhtml_path, out_path=None):
    raw_html, location = extract_html_and_location(mhtml_path)
    output_html = sanitize_mhtml_content(raw_html)
    if out_path:
        os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as fp:
            fp.write(output_html)
    return output_html, location


def run_batch():
    repo_root = Path(__file__).resolve().parent.parent
    page_fap_dir = repo_root / "page-fap"
    out_dir = repo_root / "tests" / "fixtures" / "pages"
    out_dir.mkdir(parents=True, exist_ok=True)

    mhtml_files = sorted(page_fap_dir.glob("*.mhtml"))
    if not mhtml_files:
        print(f"No MHTML files found in {page_fap_dir}", file=sys.stderr)
        sys.exit(1)

    index_entries = []

    for fpath in mhtml_files:
        raw_html, location = extract_html_and_location(fpath)
        meta = resolve_metadata_from_location(location)
        slug = meta["slug"]
        route = meta["route"]
        pattern = meta["pattern"]

        out_file = out_dir / f"{slug}.html"
        sanitized_html = sanitize_mhtml_content(raw_html)
        out_file.write_text(sanitized_html, encoding="utf-8")

        index_entries.append({
            "slug": slug,
            "route": route,
            "pattern": pattern
        })
        print(f"Sanitized: {fpath.name} -> {slug}.html (pattern: {pattern})")

    index_file = out_dir / "index.json"
    index_file.write_text(json.dumps(index_entries, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\nGenerated {len(index_entries)} fixtures and index.json at {index_file}")


def main():
    if len(sys.argv) == 3:
        input_mhtml = sys.argv[1]
        output_html = sys.argv[2]
        sanitize_mhtml_file(input_mhtml, output_html)
        print(f"Sanitized {input_mhtml} -> {output_html}")
    elif len(sys.argv) == 1 or (len(sys.argv) == 2 and sys.argv[1] in ("--all", "-a")):
        run_batch()
    else:
        print("Usage:", file=sys.stderr)
        print("  python3 scripts/sanitize-fap-page.py <input.mhtml> <output.html>", file=sys.stderr)
        print("  python3 scripts/sanitize-fap-page.py [--all]", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
