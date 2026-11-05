#!/usr/bin/env python3
"""
scripts/preview-fap-skin.py - FAP Skin Preview and Headless Screenshot Tool

Renders saved FAP MHTML snapshots with or without the custom modern skin and
generates rendered HTML and viewport screenshots using headless Chrome.

Usage:
  python3 scripts/preview-fap-skin.py <file.mhtml> --out <dir> [options]

Options:
  --out <dir>           Directory to write preview.html and preview.png (REQUIRED, must be outside repo)
  --skin {on,off}       Enable or disable custom FAP skin (default: on)
  --accent <id>         Accent color preset ID (blue, indigo, violet, pink, orange, teal, green, graphite)
  --theme {light,dark}  Color theme mode (default: light)
  --width <px>          Viewport width in pixels (default: 1440)
  --sidenav {default,condensed,sm-hover}
                        Sidebar navigation layout size (default: default)
"""

import argparse
import base64
import email
from email import policy
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
from typing import Dict, List, Optional, Tuple


def find_chrome() -> str:
    """Finds Google Chrome or Chromium executable on the system."""
    env_bin = os.environ.get("CHROME_BIN") or os.environ.get("GOOGLE_CHROME_BIN")
    if env_bin and os.path.isfile(env_bin) and os.access(env_bin, os.X_OK):
        return env_bin

    candidates = [
        "google-chrome",
        "google-chrome-stable",
        "chromium",
        "chromium-browser",
        "chrome",
    ]
    for c in candidates:
        found = shutil.which(c)
        if found:
            return found

    mac_paths = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
        os.path.expanduser("~/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
    ]
    for p in mac_paths:
        if os.path.isfile(p) and os.access(p, os.X_OK):
            return p

    linux_paths = [
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/snap/bin/chromium",
    ]
    for p in linux_paths:
        if os.path.isfile(p) and os.access(p, os.X_OK):
            return p

    for env_var in ("PROGRAMFILES", "PROGRAMFILES(X86)", "LOCALAPPDATA"):
        base_dir = os.environ.get(env_var)
        if base_dir:
            win_path = os.path.join(base_dir, "Google", "Chrome", "Application", "chrome.exe")
            if os.path.isfile(win_path):
                return win_path

    raise RuntimeError(
        "Google Chrome or Chromium executable not found. "
        "Please install Google Chrome or set the CHROME_BIN environment variable."
    )


def build_accent_css(repo_root: Path, accent_id: Optional[str]) -> str:
    """Invokes lib/fap-skin.js buildFapAccentCss via node to get CSS rules for the accent."""
    if not accent_id:
        return ""
    node_bin = shutil.which("node") or "node"
    code = (
        "const { buildFapAccentCss } = require('./lib/fap-skin.js'); "
        "process.stdout.write(buildFapAccentCss(process.argv[1] || ''));"
    )
    try:
        res = subprocess.run(
            [node_bin, "-e", code, accent_id],
            cwd=str(repo_root),
            capture_output=True,
            text=True,
            check=True
        )
        return res.stdout
    except Exception as exc:
        sys.stderr.write(f"Warning: Failed to build accent CSS with node: {exc}\n")
        return ""


def update_html_attributes(html: str, theme: str, sidenav: str, skin_off: bool) -> str:
    """Updates attributes on <html> tag: data-bs-theme, data-sidenav-size, and data-fptu-skin."""
    m = re.search(r"<html\b([^>]*)>", html, re.IGNORECASE)
    if not m:
        return html

    attrs = m.group(1)

    # data-bs-theme
    if re.search(r'\bdata-bs-theme=["\'][^"\']*["\']', attrs):
        attrs = re.sub(r'\bdata-bs-theme=["\'][^"\']*["\']', f'data-bs-theme="{theme}"', attrs)
    else:
        attrs += f' data-bs-theme="{theme}"'

    # data-sidenav-size
    if re.search(r'\bdata-sidenav-size=["\'][^"\']*["\']', attrs):
        attrs = re.sub(r'\bdata-sidenav-size=["\'][^"\']*["\']', f'data-sidenav-size="{sidenav}"', attrs)
    else:
        attrs += f' data-sidenav-size="{sidenav}"'

    # data-fptu-skin
    attrs = re.sub(r'\s*\bdata-fptu-skin(=["\'][^"\']*["\'])?', '', attrs)
    if skin_off:
        attrs += ' data-fptu-skin="off"'

    return html[:m.start()] + f"<html{attrs}>" + html[m.end():]


def strip_scripts(html: str) -> str:
    """Removes all <script>...</script> and self-closing <script/> elements."""
    html = re.sub(r"<script\b[^>]*>.*?</script\s*>", "", html, flags=re.DOTALL | re.IGNORECASE)
    html = re.sub(r"<script\b[^>]*/>", "", html, flags=re.IGNORECASE)
    return html


def capture_screenshot(chrome_bin: str, html_path: Path, png_path: Path, width: int) -> None:
    """Uses headless Chrome to take a screenshot of html_path."""
    profile_dir = tempfile.mkdtemp(prefix="fap-preview-chrome-")
    try:
        cmd_args = [
            "--no-sandbox",
            "--disable-gpu",
            "--disable-crash-reporter",
            "--hide-scrollbars",
            "--allow-file-access-from-files",
            f"--user-data-dir={profile_dir}",
            f"--screenshot={png_path.resolve()}",
            f"--window-size={width},1000",
            "--virtual-time-budget=3000",
            html_path.resolve().as_uri(),
        ]

        res = subprocess.run(
            [chrome_bin, "--headless=new"] + cmd_args,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        if not png_path.exists() or png_path.stat().st_size == 0:
            res = subprocess.run(
                [chrome_bin, "--headless"] + cmd_args,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

        if not png_path.exists() or png_path.stat().st_size == 0:
            err = res.stderr.strip() or "Unknown error"
            raise RuntimeError(f"Headless Chrome failed to capture screenshot: {err}")
    finally:
        shutil.rmtree(profile_dir, ignore_errors=True)


def process_mhtml(
    mhtml_file: Path,
    out_dir: Path,
    skin: str,
    accent: Optional[str],
    theme: str,
    width: int,
    sidenav: str,
    repo_root: Path,
    chrome_bin: str
) -> Tuple[Path, Path]:
    """Extracts MHTML, transforms HTML and CSS, and captures a screenshot."""
    out_dir.mkdir(parents=True, exist_ok=True)
    css_dir = out_dir / "css"
    css_dir.mkdir(parents=True, exist_ok=True)

    with open(mhtml_file, "rb") as f:
        msg = email.message_from_binary_file(f, policy=policy.default)

    html_content: Optional[str] = None
    css_map: Dict[str, str] = {}
    css_files_content: Dict[str, str] = {}
    image_map: Dict[str, str] = {}

    css_index = 0
    for part in msg.walk():
        ct = part.get_content_type()
        loc = part.get("Content-Location")
        cid = part.get("Content-ID")
        raw = part.get_payload(decode=True)
        if not raw:
            continue

        if ct == "text/html" and html_content is None:
            charset = part.get_content_charset() or "utf-8"
            try:
                html_content = raw.decode(charset, errors="replace")
            except Exception:
                html_content = raw.decode("utf-8", errors="replace")

        elif ct == "text/css":
            css_index += 1
            name = "style"
            if loc:
                clean_loc = loc.split("?")[0].rstrip("/")
                base = os.path.basename(clean_loc)
                if base:
                    name = base
            if not name.endswith(".css"):
                name += ".css"

            clean_name = re.sub(r"[^a-zA-Z0-9_.-]", "_", name)
            safe_name = f"{css_index:02d}_{clean_name}"

            charset = part.get_content_charset() or "utf-8"
            try:
                css_text = raw.decode(charset, errors="replace")
            except Exception:
                css_text = raw.decode("utf-8", errors="replace")

            css_files_content[safe_name] = css_text
            rel_path = f"css/{safe_name}"

            if loc:
                css_map[loc] = rel_path
                css_map[loc.split("?")[0]] = rel_path
            if cid:
                clean_cid = cid.strip("<>")
                css_map[clean_cid] = rel_path
                css_map[f"cid:{clean_cid}"] = rel_path

        elif ct.startswith("image/"):
            b64 = base64.b64encode(raw).decode("ascii")
            data_uri = f"data:{ct};base64,{b64}"
            if loc:
                image_map[loc] = data_uri
                image_map[loc.split("?")[0]] = data_uri
            if cid:
                clean_cid = cid.strip("<>")
                image_map[clean_cid] = data_uri
                image_map[f"cid:{clean_cid}"] = data_uri

    if html_content is None:
        raise ValueError(f"No HTML content found in MHTML archive: {mhtml_file}")

    # Write CSS files, updating internal @import / url references
    for safe_name, css_text in css_files_content.items():
        for loc, rel in css_map.items():
            base_rel = os.path.basename(rel)
            if loc in css_text:
                css_text = css_text.replace(loc, base_rel)
        for img_loc, img_uri in image_map.items():
            if img_loc in css_text:
                css_text = css_text.replace(img_loc, img_uri)
        (css_dir / safe_name).write_text(css_text, encoding="utf-8")

    # Replace <link rel="stylesheet"> in HTML
    def link_replacer(match: re.Match) -> str:
        tag = match.group(0)
        if not re.search(r'\brel\s*=\s*["\']?stylesheet["\']?', tag, re.IGNORECASE):
            return tag
        hm = re.search(r'\bhref\s*=\s*(["\'])(.*?)\1', tag, re.IGNORECASE)
        if not hm:
            return tag
        href = hm.group(2)
        if href in css_map:
            return tag[:hm.start(2)] + css_map[href] + tag[hm.end(2):]
        href_clean = href.split("?")[0]
        if href_clean in css_map:
            return tag[:hm.start(2)] + css_map[href_clean] + tag[hm.end(2):]
        return tag

    html = re.sub(r"<link\b[^>]*>", link_replacer, html_content, flags=re.IGNORECASE)

    # In HTML, replace image URLs with data URIs
    for img_url, data_uri in image_map.items():
        html = html.replace(img_url, data_uri)

    # Remove all scripts
    html = strip_scripts(html)

    # Update <html> attributes
    html = update_html_attributes(
        html,
        theme=theme,
        sidenav=sidenav,
        skin_off=(skin == "off")
    )

    # Inject skin CSS and accent style
    skin_css_file = repo_root / "lib" / "fap-skin.css"
    skin_css_href = skin_css_file.resolve().as_uri()

    accent_css = build_accent_css(repo_root, accent)

    injection = f'\n  <link rel="stylesheet" href="{skin_css_href}" id="fptu-skin-css">\n'
    if accent_css:
        injection += f'  <style id="fptu-skin-accent">{accent_css}</style>\n'
    else:
        injection += f'  <style id="fptu-skin-accent"></style>\n'

    if re.search(r"</head>", html, re.IGNORECASE):
        html = re.sub(r"</head>", injection + "</head>", html, count=1, flags=re.IGNORECASE)
    elif re.search(r"<head\b[^>]*>", html, re.IGNORECASE):
        html = re.sub(r"(<head\b[^>]*>)", r"\1" + injection, html, count=1, flags=re.IGNORECASE)
    else:
        html = injection + html

    preview_html_path = out_dir / "preview.html"
    preview_html_path.write_text(html, encoding="utf-8")

    preview_png_path = out_dir / "preview.png"
    capture_screenshot(chrome_bin, preview_html_path, preview_png_path, width)

    return preview_html_path, preview_png_path


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent

    parser = argparse.ArgumentParser(
        description="FAP Skin Preview and Headless Screenshot Tool"
    )
    parser.add_argument(
        "mhtml",
        nargs="+",
        help="Path to MHTML file(s)"
    )
    parser.add_argument(
        "--out",
        required=True,
        help="Output directory (must be outside the repository)"
    )
    parser.add_argument(
        "--skin",
        choices=["on", "off"],
        default="on",
        help="Enable or disable FAP skin (default: on)"
    )
    parser.add_argument(
        "--accent",
        default=None,
        help="Accent color preset ID (e.g. blue, indigo, violet, pink, orange, teal, green, graphite)"
    )
    parser.add_argument(
        "--theme",
        choices=["light", "dark"],
        default="light",
        help="Color theme mode (default: light)"
    )
    parser.add_argument(
        "--width",
        type=int,
        default=1440,
        help="Viewport width in pixels (default: 1440)"
    )
    parser.add_argument(
        "--sidenav",
        choices=["default", "condensed", "sm-hover"],
        default="default",
        help="Sidebar layout mode (default: default)"
    )

    args = parser.parse_args()

    out_dir = Path(args.out).resolve()

    # Verify that --out is outside the repository
    try:
        out_dir.relative_to(repo_root)
        is_inside_repo = True
    except ValueError:
        is_inside_repo = False

    if is_inside_repo:
        sys.stderr.write(
            f"Error: --out directory must be outside the repository (found: {out_dir}).\n"
            "MHTML preview artifacts contain personal student data and must never be stored inside the repository.\n"
        )
        sys.exit(1)

    chrome_bin = find_chrome()

    mhtml_files = [Path(p) for p in args.mhtml]
    for mf in mhtml_files:
        if not mf.is_file():
            sys.stderr.write(f"Error: MHTML file not found: {mf}\n")
            sys.exit(1)

    if len(mhtml_files) == 1:
        mf = mhtml_files[0]
        html_path, png_path = process_mhtml(
            mhtml_file=mf,
            out_dir=out_dir,
            skin=args.skin,
            accent=args.accent,
            theme=args.theme,
            width=args.width,
            sidenav=args.sidenav,
            repo_root=repo_root,
            chrome_bin=chrome_bin,
        )
        print(html_path)
        print(png_path)
    else:
        primary_html: Optional[Path] = None
        primary_png: Optional[Path] = None

        for idx, mf in enumerate(mhtml_files):
            stem = mf.stem
            safe_stem = re.sub(r"[^a-zA-Z0-9_.-]", "_", stem)[:50]
            sub_dir = out_dir / safe_stem
            sub_html, sub_png = process_mhtml(
                mhtml_file=mf,
                out_dir=sub_dir,
                skin=args.skin,
                accent=args.accent,
                theme=args.theme,
                width=args.width,
                sidenav=args.sidenav,
                repo_root=repo_root,
                chrome_bin=chrome_bin,
            )
            print(sub_html)
            print(sub_png)

            if idx == 0:
                primary_html = out_dir / "preview.html"
                primary_png = out_dir / "preview.png"
                shutil.copy2(sub_html, primary_html)
                shutil.copy2(sub_png, primary_png)

        if primary_html and primary_png:
            print(primary_html)
            print(primary_png)


if __name__ == "__main__":
    main()
