#!/usr/bin/env python3
"""
Export Hebrew verb data from the BHSA (Biblia Hebraica Stuttgartensia
Amstelodamensis) into parsetrainer-data.json format.

Uses the Text-Fabric library to access ETCBC morphological annotations.
On first run, BHSA data is auto-downloaded (~200 MB).

Usage:
    python tools/export_bhsa_data.py
"""

import json
import re
from datetime import datetime, timezone
from pathlib import Path

# ── Text-Fabric bootstrap ──────────────────────────────────────────────
from tf.app import use

print("Loading BHSA data (first run downloads ~200 MB)…")
A = use("ETCBC/bhsa", version="2021", silent="deep")
api = A.api
F = api.F
print("BHSA data loaded.\n")

# ── Mappings (same as the original import_etcbc.py) ────────────────────

STEMS = {
    "qal":  "Qal",
    "hif":  "Hiphil",
    "piel": "Piel",
    "nif":  "Niphal",
    "hit":  "Hitpael",
    "pual": "Pual",
    "hof":  "Hophal",
}

TENSES = {
    "perf": "perfect",
    "impf": "imperfect",
    "wayq": "imperfect",       # wayyiqtol maps to imperfect
    "ptca": "participle",
    "infc": "infinitive construct",
    "impv": "imperative",
    "ptcp": "passive participle (qal)",
    "infa": "infinitive absolute",
}

PERSONS = {"p1": "1", "p2": "2", "p3": "3", "unknown": None, "NA": None}
GENDERS = {"m": "m", "f": "f", "unknown": None, "NA": None}
NUMBERS = {"sg": "s", "pl": "p", "du": "p", "unknown": None, "NA": None}

# Root kinds  (name → id in the output dataset)
ROOT_KINDS = [
    {"id": 1,  "strong": True,  "name": "Strong"},
    {"id": 2,  "strong": False, "name": "I-Guttural"},
    {"id": 3,  "strong": False, "name": "I-Aleph"},
    {"id": 4,  "strong": False, "name": "I-Nun"},
    {"id": 5,  "strong": False, "name": "I-Waw"},
    {"id": 6,  "strong": False, "name": "I-Yod"},
    {"id": 7,  "strong": False, "name": "II-Guttural"},
    {"id": 8,  "strong": False, "name": "III-He"},
    {"id": 9,  "strong": False, "name": "Biconsonantal"},
    {"id": 10, "strong": False, "name": "Geminate"},
    {"id": 11, "strong": False, "name": "Double weak"},
]

# The 20 roots that appear on the live ParseTrainer site.
# Map: unpointed root → (display root, root-kind name, English gloss).
# The display root may include vowel letters / shin/sin dots that appear in
# the live site's UI.
SELECTED_ROOTS = {
    "קטל": ("קטל", "Strong", "kill"),
    "פקד": ("פקד", "Strong", "visit / appoint"),
    "חזק": ("חזק", "I-Guttural", "be strong"),
    "עמד": ("עמד", "I-Guttural", "stand"),
    "אכל": ("אכל", "I-Aleph", "eat"),
    "לקח": ("לקח", "I-Nun", "take"),         # behaves like I-Nun
    "נגשׁ": ("נגשׁ", "I-Nun", "approach"),
    "נפל": ("נפל", "I-Nun", "fall"),
    "נתן": ("נתן", "I-Nun", "give"),
    "ישׁב": ("ישׁב", "I-Waw", "sit / dwell"),
    "יטב": ("יטב", "I-Yod", "be good"),
    "בחר": ("בחר", "II-Guttural", "choose"),
    "ברך": ("ברך", "II-Guttural", "bless"),
    "גלה": ("גלה", "III-He", "uncover / reveal"),
    "בושׁ": ("בוֹשׁ", "Biconsonantal", "be ashamed"),
    "מות": ("מוּת", "Biconsonantal", "die"),
    "קום": ("קוּם", "Biconsonantal", "arise"),
    "שׂים": ("שִׂם", "Biconsonantal", "put / set"),
    "סבב": ("סבב", "Geminate", "surround"),
    "קלל": ("קלל", "Geminate", "be light / curse"),
}

# ── Helpers ─────────────────────────────────────────────────────────────

STRIP_ACCENTS_RE = re.compile(r"[^\u05b0-\u05bc\u05c1\u05c2\u05c7-\u05ea]")
UNPOINT_RE = re.compile(r"[^\u05d0-\u05ea]")

def strip_accents(word: str) -> str:
    """Keep consonants + basic nikud, strip cantillation / meteg / misc."""
    return STRIP_ACCENTS_RE.sub("", word)

def unpoint(word: str) -> str:
    """Remove all pointing, keep only consonants."""
    return UNPOINT_RE.sub("", word)

def lex_to_root(lex: str) -> str:
    """Normalize a BHSA lexeme string to a consonantal root key."""
    # BHSA lexemes may contain trailing = or [ or other markers
    cleaned = re.sub(r"[=/\[\]<>]", "", lex)
    return unpoint(cleaned)

# Build a quick lookup:  consonantal root → SELECTED_ROOTS key
ROOT_LOOKUP: dict[str, str] = {}
for key in SELECTED_ROOTS:
    ROOT_LOOKUP[unpoint(key)] = key

# ── Extract verbs ──────────────────────────────────────────────────────

Verb = tuple  # (verb, root_key, stem, tense, person, gender, number)
seen: set[tuple] = set()
verb_list: list[dict] = []

for n in F.otype.s("word"):
    if F.language.v(n) != "Hebrew":
        continue
    if F.sp.v(n) != "verb":
        continue

    vs_raw = F.vs.v(n)
    vt_raw = F.vt.v(n)

    if vs_raw not in STEMS or vt_raw not in TENSES:
        continue

    lex = F.lex_utf8.v(n)
    root_consonants = lex_to_root(lex)

    if root_consonants not in ROOT_LOOKUP:
        continue

    root_key = ROOT_LOOKUP[root_consonants]

    word = F.g_word_utf8.v(n)
    if word is None:
        continue
    # Skip words with sof-pasuq or maqaf (compound forms)
    if "\u05c3" in word or "\u05be" in word:
        continue

    verb_str = strip_accents(word)
    stem = STEMS[vs_raw]
    tense = TENSES[vt_raw]
    person = PERSONS.get(F.ps.v(n))
    gender = GENDERS.get(F.gn.v(n))
    number = NUMBERS.get(F.nu.v(n))

    # For passive participle, only keep qal forms
    if tense == "passive participle (qal)" and stem != "Qal":
        continue

    dedup_key = (unpoint(verb_str), root_key, stem, tense, person, gender, number)
    if dedup_key in seen:
        continue
    seen.add(dedup_key)

    verb_list.append({
        "verb": verb_str,
        "root": SELECTED_ROOTS[root_key][0],
        "stem": stem,
        "tense": tense,
        "person": person,
        "gender": gender,
        "number": number,
    })

# Assign stable IDs after collecting
verb_list.sort(key=lambda v: (v["root"], v["stem"], v["tense"], str(v["person"] or ""), str(v["gender"] or ""), str(v["number"] or "")))
for idx, v in enumerate(verb_list, start=1):
    v["id"] = idx

# ── Build roots list ────────────────────────────────────────────────────

root_kind_by_name = {rk["name"]: rk["id"] for rk in ROOT_KINDS}
roots_with_verbs = {v["root"] for v in verb_list}

roots_list = []
for key, (display, kind_name, translation) in SELECTED_ROOTS.items():
    if display not in roots_with_verbs:
        continue
    roots_list.append({
        "root": display,
        "rootKindId": root_kind_by_name[kind_name],
        "rootKindName": kind_name,
        "translation": translation,
    })
roots_list.sort(key=lambda r: (r["rootKindId"], r["root"]))

# ── Assemble dataset ───────────────────────────────────────────────────

STEMS_LIST = [
    {"name": "Qal"},
    {"name": "Niphal"},
    {"name": "Piel"},
    {"name": "Pual"},
    {"name": "Hiphil"},
    {"name": "Hophal"},
    {"name": "Hitpael"},
]

TENSES_LIST = [
    {"name": "perfect",                  "abbreviation": "pf"},
    {"name": "imperfect",                "abbreviation": "ipf"},
    {"name": "cohortative",              "abbreviation": "coh"},
    {"name": "imperative",               "abbreviation": "imp"},
    {"name": "jussive",                  "abbreviation": "jus"},
    {"name": "infinitive construct",     "abbreviation": "infcs"},
    {"name": "infinitive absolute",      "abbreviation": "infabs"},
    {"name": "participle",               "abbreviation": "ptc"},
    {"name": "passive participle (qal)", "abbreviation": "ptcp"},
]

dataset = {
    "meta": {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "BHSA/ETCBC",
        "version": 1,
    },
    "stems": STEMS_LIST,
    "tenses": TENSES_LIST,
    "rootKinds": ROOT_KINDS,
    "roots": roots_list,
    "verbs": verb_list,
}

# ── Write output ────────────────────────────────────────────────────────

out_path = Path(__file__).resolve().parent.parent / "src" / "data" / "parsetrainer-data.json"
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text(
    json.dumps(dataset, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8",
)

print(f"Exported {len(verb_list)} verbs across {len(roots_list)} roots")
print(f"Output: {out_path}")
