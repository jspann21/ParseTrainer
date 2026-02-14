#!/usr/bin/env python3
"""
Generate ParseTrainer dataset JSON directly from BHSA via Text-Fabric.

By default, verb tokens with pronominal suffixes are excluded (BHSA `prs`).

Usage:
  python scripts/generate_bhsa_dataset.py
  python scripts/generate_bhsa_dataset.py --dry-run
  python scripts/generate_bhsa_dataset.py --include-pronominal-suffixes
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from tf.app import use

STEMS = {
    "qal": "Qal",
    "hif": "Hiphil",
    "piel": "Piel",
    "nif": "Niphal",
    "hit": "Hitpael",
    "pual": "Pual",
    "hof": "Hophal",
}

TENSES = {
    "perf": "perfect",
    "impf": "imperfect",
    "wayq": "imperfect",
    "ptca": "participle",
    "infc": "infinitive construct",
    "impv": "imperative",
    "ptcp": "passive participle (qal)",
    "infa": "infinitive absolute",
}

PERSONS = {
    "p1": "1",
    "p2": "2",
    "p3": "3",
    "unknown": None,
    "NA": None,
    "absent": None,
}
GENDERS = {"m": "m", "f": "f", "unknown": None, "NA": None, "absent": None}
NUMBERS = {"sg": "s", "pl": "p", "du": "p", "unknown": None, "NA": None, "absent": None}

ABSENT_VALUES = {None, "NA", "absent"}

ROOT_KINDS = [
    {"id": 1, "strong": True, "name": "Strong"},
    {"id": 2, "strong": False, "name": "I-Guttural"},
    {"id": 3, "strong": False, "name": "I-Aleph"},
    {"id": 4, "strong": False, "name": "I-Nun"},
    {"id": 5, "strong": False, "name": "I-Waw"},
    {"id": 6, "strong": False, "name": "I-Yod"},
    {"id": 7, "strong": False, "name": "II-Guttural"},
    {"id": 8, "strong": False, "name": "III-He"},
    {"id": 9, "strong": False, "name": "Biconsonantal"},
    {"id": 10, "strong": False, "name": "Geminate"},
    {"id": 11, "strong": False, "name": "Double weak"},
]

SELECTED_ROOTS = {
    "קטל": ("קטל", "Strong", "kill"),
    "פקד": ("פקד", "Strong", "visit / appoint"),
    "חזק": ("חזק", "I-Guttural", "be strong"),
    "עמד": ("עמד", "I-Guttural", "stand"),
    "אכל": ("אכל", "I-Aleph", "eat"),
    "לקח": ("לקח", "I-Nun", "take"),
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
    {"name": "perfect", "abbreviation": "pf"},
    {"name": "imperfect", "abbreviation": "ipf"},
    {"name": "cohortative", "abbreviation": "coh"},
    {"name": "imperative", "abbreviation": "imp"},
    {"name": "jussive", "abbreviation": "jus"},
    {"name": "infinitive construct", "abbreviation": "infcs"},
    {"name": "infinitive absolute", "abbreviation": "infabs"},
    {"name": "participle", "abbreviation": "ptc"},
    {"name": "passive participle (qal)", "abbreviation": "ptcp"},
]

STRIP_ACCENTS_RE = re.compile(r"[^\u05b0-\u05bc\u05c1\u05c2\u05c7-\u05ea]")
UNPOINT_RE = re.compile(r"[^\u05d0-\u05ea]")
LEX_CLEAN_RE = re.compile(r"[=/\[\]<>]")


def strip_accents(word: str) -> str:
    return STRIP_ACCENTS_RE.sub("", word)


def unpoint(word: str) -> str:
    return UNPOINT_RE.sub("", word)


def lex_to_root(lex: str) -> str:
    return unpoint(LEX_CLEAN_RE.sub("", lex))


def infer_version(out_path: Path, explicit_version: int | None) -> int:
    if explicit_version is not None:
        return explicit_version

    if out_path.exists():
        try:
            current = json.loads(out_path.read_text(encoding="utf-8"))
            value = current.get("meta", {}).get("version")
            if isinstance(value, int):
                return value + 1
        except (json.JSONDecodeError, OSError):
            pass

    return 1


def verb_key(verb: dict[str, Any]) -> tuple[Any, ...]:
    return (
        verb["verb"],
        verb["root"],
        verb["stem"],
        verb["tense"],
        verb["person"],
        verb["gender"],
        verb["number"],
    )


def assign_ids(
    verbs: list[dict[str, Any]], out_path: Path, reindex_ids: bool
) -> tuple[int, int]:
    if reindex_ids or not out_path.exists():
        for index, verb in enumerate(verbs, start=1):
            verb["id"] = index
        return len(verbs), 0

    try:
        current = json.loads(out_path.read_text(encoding="utf-8"))
        current_verbs = current.get("verbs", [])
    except (json.JSONDecodeError, OSError):
        current_verbs = []

    existing_ids: dict[tuple[Any, ...], int] = {}
    max_id = 0
    for current_verb in current_verbs:
        key = verb_key(current_verb)
        verb_id = current_verb.get("id")
        if isinstance(verb_id, int):
            existing_ids[key] = verb_id
            if verb_id > max_id:
                max_id = verb_id

    reused = 0
    created = 0
    next_id = max_id + 1
    for verb in verbs:
        key = verb_key(verb)
        existing_id = existing_ids.get(key)
        if existing_id is not None:
            verb["id"] = existing_id
            reused += 1
            continue
        verb["id"] = next_id
        next_id += 1
        created += 1

    return reused, created


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate ParseTrainer BHSA dataset JSON.")
    parser.add_argument(
        "--out",
        default="src/data/parsetrainer-data.json",
        help="Output JSON path.",
    )
    parser.add_argument(
        "--bhsa-module",
        default="ETCBC/bhsa",
        help="Text-Fabric module spec.",
    )
    parser.add_argument(
        "--bhsa-version",
        default="2021",
        help="BHSA version to load (empty string to use Text-Fabric default).",
    )
    parser.add_argument(
        "--include-pronominal-suffixes",
        action="store_true",
        help="Keep verbs with pronominal suffixes (default excludes them).",
    )
    parser.add_argument(
        "--version",
        type=int,
        default=None,
        help="Dataset meta.version (default: increment existing output version, else 1).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Compute dataset but do not write output.",
    )
    parser.add_argument(
        "--reindex-ids",
        action="store_true",
        help="Assign fresh sequential IDs instead of preserving IDs from existing output.",
    )
    args = parser.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print("Loading BHSA data...")
    bhsa_version = args.bhsa_version if args.bhsa_version else None
    app_kwargs: dict[str, Any] = {"silent": "deep"}
    if bhsa_version is not None:
        app_kwargs["version"] = bhsa_version
    app = use(args.bhsa_module, **app_kwargs)
    F = app.api.F
    print("BHSA data loaded.")

    root_lookup: dict[str, str] = {unpoint(key): key for key in SELECTED_ROOTS}

    seen: set[tuple[Any, ...]] = set()
    verbs: list[dict[str, Any]] = []
    skipped_with_suffix = 0
    skipped_unknown_root = 0

    for node in F.otype.s("word"):
        if F.sp.v(node) != "verb":
            continue

        language = F.language.v(node)
        if language not in {"Hebrew", "hbo"}:
            continue

        if not args.include_pronominal_suffixes and F.prs.v(node) not in ABSENT_VALUES:
            skipped_with_suffix += 1
            continue

        stem_raw = F.vs.v(node)
        tense_raw = F.vt.v(node)
        if stem_raw not in STEMS or tense_raw not in TENSES:
            continue

        lex = F.lex_utf8.v(node)
        if not lex:
            continue
        root_consonants = lex_to_root(lex)
        if root_consonants not in root_lookup:
            skipped_unknown_root += 1
            continue

        word = F.g_word_utf8.v(node)
        if not word or "\u05c3" in word or "\u05be" in word:
            continue

        verb_str = strip_accents(word)
        root_key = root_lookup[root_consonants]
        stem = STEMS[stem_raw]
        tense = TENSES[tense_raw]
        person = PERSONS.get(F.ps.v(node))
        gender = GENDERS.get(F.gn.v(node))
        number = NUMBERS.get(F.nu.v(node))

        if tense == "passive participle (qal)" and stem != "Qal":
            continue

        dedup_key = (
            unpoint(verb_str),
            root_key,
            stem,
            tense,
            person,
            gender,
            number,
        )
        if dedup_key in seen:
            continue
        seen.add(dedup_key)

        verbs.append(
            {
                "verb": verb_str,
                "root": SELECTED_ROOTS[root_key][0],
                "stem": stem,
                "tense": tense,
                "person": person,
                "gender": gender,
                "number": number,
            }
        )

    verbs.sort(
        key=lambda verb: (
            verb["root"],
            verb["stem"],
            verb["tense"],
            str(verb["person"] or ""),
            str(verb["gender"] or ""),
            str(verb["number"] or ""),
        )
    )
    reused_ids, created_ids = assign_ids(verbs, out_path, args.reindex_ids)

    root_kind_by_name = {root_kind["name"]: root_kind["id"] for root_kind in ROOT_KINDS}
    roots_with_verbs = {verb["root"] for verb in verbs}
    roots: list[dict[str, Any]] = []
    for key, (display, kind_name, translation) in SELECTED_ROOTS.items():
        if display not in roots_with_verbs:
            continue
        roots.append(
            {
                "root": display,
                "rootKindId": root_kind_by_name[kind_name],
                "rootKindName": kind_name,
                "translation": translation,
            }
        )
    roots.sort(key=lambda root: (root["rootKindId"], root["root"]))

    dataset = {
        "meta": {
            "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "source": "BHSA/ETCBC",
            "version": infer_version(out_path, args.version),
        },
        "stems": STEMS_LIST,
        "tenses": TENSES_LIST,
        "rootKinds": ROOT_KINDS,
        "roots": roots,
        "verbs": verbs,
    }

    if not args.dry_run:
        out_path.write_text(
            json.dumps(dataset, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    print(
        json.dumps(
            {
                "out": str(out_path),
                "dryRun": args.dry_run,
                "verbs": len(verbs),
                "roots": len(roots),
                "skippedWithPronominalSuffix": skipped_with_suffix,
                "skippedUnknownRoot": skipped_unknown_root,
                "includePronominalSuffixes": args.include_pronominal_suffixes,
                "reusedIds": reused_ids,
                "createdIds": created_ids,
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
