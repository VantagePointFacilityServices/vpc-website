#!/usr/bin/env python3
"""Check that every "Volume N, Section X.Y" reference in docs/ resolves to a
real heading. Run from the repo root:  python3 scripts/check-crossrefs.py

Written during the August 2026 audit, which found four documents pointing at a
KPI dashboard in Volume 1 that did not exist in any of the three sections cited.
Run it after any edit that moves or renumbers a section.
"""
import re, pathlib, sys, collections

DOCS = pathlib.Path("docs")
VOL = {}          # volume number -> set of section ids
FILES = {}
# The audit report deliberately catalogues broken references as findings; skip it.
# "Commercial Volume N" refers to a suite outside this repo.
SKIP = {"residential-operating-system-audit.md"}
for f in sorted(DOCS.glob("*.md")):
    txt = f.read_text(encoding="utf-8")
    if f.name not in SKIP:
        FILES[f.name] = txt
    m = re.match(r"volume-(\d)-", f.name)
    if m:
        ids = set()
        for h in re.findall(r"^#{2,4}\s+(\d+(?:\.\d+)?[a-z]?)[\s.]", txt, re.M):
            ids.add(h)
            if "." in h: ids.add(h.split(".")[0])   # a section implies its parent
        VOL[m.group(1)] = ids

if len(VOL) != 5:
    sys.exit(f"FAIL: expected 5 volumes, found {len(VOL)}. Run from the repo root.")

# also collect SOP ids that are actually defined
SOPS = set()
for txt in FILES.values():
    SOPS |= set(re.findall(r"\b([A-Z]{2,3}-\d{2})\b", txt))

problems = collections.defaultdict(list)
pat = re.compile(r"(?<!Commercial )Volume\s+(\d)[,\s]+Section[s]?\s+(\d+(?:\.\d+)?[a-z]?)", re.I)
pat2 = re.compile(r"Vol(?:ume)?\.?\s*(\d)\s*§\s*(\d+(?:\.\d+)?[a-z]?)", re.I)

for name, txt in FILES.items():
    for rx in (pat, pat2):
        for mo in rx.finditer(txt):
            vol, sec = mo.group(1), mo.group(2)
            if vol not in VOL:
                problems[name].append(f"Volume {vol} does not exist -> {mo.group(0)!r}")
            elif sec not in VOL[vol]:
                line = txt[:mo.start()].count("\n") + 1
                problems[name].append(f"line {line}: {mo.group(0)!r} -> Volume {vol} has no Section {sec}")

print("=== CROSS-REFERENCE CHECK ===")
total = 0
for name in sorted(problems):
    print(f"\n{name}:")
    for p in sorted(set(problems[name])):
        print("  ", p); total += 1
if total == 0:
    print("All Volume/Section cross-references resolve. ✅")
else:
    print(f"\n{total} unresolved reference(s)")

print("\n=== SECTION INVENTORY ===")
for v in sorted(VOL):
    tops = sorted({s for s in VOL[v] if "." not in s}, key=int)
    print(f"  Volume {v}: top-level sections {', '.join(tops)}")
