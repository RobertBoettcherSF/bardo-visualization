#!/usr/bin/env python3
"""Inline the wasm module and the page scripts into index.html."""
import base64
import pathlib
import sys

root = pathlib.Path(__file__).resolve().parent.parent
wasm_path, stamp = sys.argv[1], sys.argv[2]
asset = stamp.split()[-1].rstrip("+")
js = "\n".join(
    (root / "web" / name).read_text()
    for name in ("strings.js", "rain.js", "page.js")
)
js = 'const WASM_BASE64 = "%s";\n%s' % (base64.b64encode(pathlib.Path(wasm_path).read_bytes()).decode("ascii"), js)
html = (root / "web" / "template.html").read_text()
html = html.replace("__JS__", js).replace("__STAMP__", stamp).replace("__ASSET__", asset)
if "__JS__" in html or "__STAMP__" in html or "__ASSET__" in html or "__WASM" in html:
    raise SystemExit("template placeholders left unreplaced")
(root / "index.html").write_text(html)
(root / "version.txt").write_text(stamp + "\n")
print("stamp", stamp)
print("index.html", (root / "index.html").stat().st_size, "bytes")
