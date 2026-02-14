#!/usr/bin/env python3
"""
Remove BHSA verb entries with pronominal suffixes from ParseTrainer dataset.

Usage:
  python scripts/remove_pronominal_suffix_verbs.py
  python scripts/remove_pronominal_suffix_verbs.py --dry-run --report suffix-report.json
"""

from __future__ import annotations

import argparse
import json
import unicodedata
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from tf.app import use

STEM_MAP = {
    "Qal": "qal",
    "Niphal": "nif",
    "Piel": "piel",
    "Pual": "pual",
    "Hiphil": "hif",
    "Hophal": "hof",
    "Hitpael": "hit",
}

TENSE_MAP = {
    "perfect": {"perf"},
    "imperfect": {"impf", "wayq"},
    "cohortative": {"impf"},
    "jussive": {"impf"},
    "imperative": {"impv"},
    "infinitive construct": {"infc"},
    "infinitive absolute": {"infa"},
    "participle": {"ptca", "ptcp"},
    "passive participle (qal)": {"ptcp"},
}

PS_MAP = {"1": "p1", "2": "p2", "3": "p3", None: "unknown"}
GN_MAP = {"m": "m", "f": "f", "c": "unknown", None: "unknown"}
NU_MAP = {"s": "sg", "p": "pl", None: "unknown"}

PUNCT_TO_DROP = {"\u05be", "\u05c3", "\u05c0"}
ABSENT_VALUES = {None, "NA", "absent"}


@dataclass(frozen=True)
class BhsaVerb:
    vs: str | None
    vt: str | None
    ps: str | None
    gn: str | None
    nu: str | None
    prs: str | None


def normalize_precise(word: str) -> str:
    normalized = unicodedata.normalize("NFC", word)
    out: list[str] = []
    for ch in normalized:
        if ch in PUNCT_TO_DROP:
            continue
        # Keep vowels and dagesh; drop cantillation accents.
        if unicodedata.combining(ch) >= 220:
            continue
        out.append(ch)
    return "".join(out)


def normalize_loose(word: str) -> str:
    normalized = unicodedata.normalize("NFD", word)
    out: list[str] = []
    for ch in normalized:
        if ch in PUNCT_TO_DROP:
            continue
        if unicodedata.category(ch) == "Mn":
            continue
        out.append(ch)
    return unicodedata.normalize("NFC", "".join(out))


def load_bhsa_index(module: str) -> tuple[dict[str, list[BhsaVerb]], dict[str, list[BhsaVerb]]]:
    _ = use(module, hoist=globals(), silent="deep")

    index_precise: dict[str, list[BhsaVerb]] = defaultdict(list)
    index_loose: dict[str, list[BhsaVerb]] = defaultdict(list)

    for word in F.otype.s("word"):
        if F.sp.v(word) != "verb":
            continue

        record = BhsaVerb(
            vs=F.vs.v(word),
            vt=F.vt.v(word),
            ps=F.ps.v(word),
            gn=F.gn.v(word),
            nu=F.nu.v(word),
            prs=F.prs.v(word),
        )
        form = F.g_word_utf8.v(word) or ""

        index_precise[normalize_precise(form)].append(record)
        index_loose[normalize_loose(form)].append(record)

    return index_precise, index_loose


def match_candidates(
    entry: dict[str, Any], index: dict[str, list[BhsaVerb]], normalize_fn: Any
) -> list[BhsaVerb]:
    stem = STEM_MAP.get(entry["stem"])
    allowed_vt = TENSE_MAP.get(entry["tense"], set())
    person = entry["person"]
    gender = entry["gender"]
    number = entry["number"]

    key = normalize_fn(entry["verb"])
    candidates = index.get(key, [])
    matched: list[BhsaVerb] = []

    for cand in candidates:
        if stem is not None and cand.vs != stem:
            continue
        if allowed_vt and cand.vt not in allowed_vt:
            continue
        if person is not None and cand.ps != PS_MAP[person]:
            continue
        if gender is not None and cand.gn != GN_MAP[gender]:
            continue
        if number is not None and cand.nu != NU_MAP[number]:
            continue
        matched.append(cand)

    return matched


def has_pronominal_suffix(candidates: list[BhsaVerb]) -> bool:
    suffix_flags = [cand.prs not in ABSENT_VALUES for cand in candidates]
    return bool(suffix_flags) and all(suffix_flags)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Remove verbs with pronominal suffixes using BHSA/Text-Fabric morphology."
    )
    parser.add_argument(
        "--dataset",
        default="src/data/parsetrainer-data.json",
        help="Path to ParseTrainer dataset JSON.",
    )
    parser.add_argument(
        "--bhsa-module",
        default="ETCBC/bhsa",
        help="Text-Fabric module spec for BHSA.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Compute and report removals without writing the dataset.",
    )
    parser.add_argument(
        "--report",
        default="",
        help="Optional path to write a JSON report.",
    )
    args = parser.parse_args()

    dataset_path = Path(args.dataset)
    data = json.loads(dataset_path.read_text(encoding="utf-8"))
    verbs: list[dict[str, Any]] = data["verbs"]

    index_precise, index_loose = load_bhsa_index(args.bhsa_module)

    kept: list[dict[str, Any]] = []
    removed: list[dict[str, Any]] = []
    unresolved: list[dict[str, Any]] = []
    removal_source = {"precise": 0, "loose": 0}

    for entry in verbs:
        matches = match_candidates(entry, index_precise, normalize_precise)
        source = "precise"

        if not matches:
            matches = match_candidates(entry, index_loose, normalize_loose)
            source = "loose"

        if not matches:
            kept.append(entry)
            unresolved.append(entry)
            continue

        if has_pronominal_suffix(matches):
            removed.append(entry)
            removal_source[source] += 1
        else:
            kept.append(entry)

    if not args.dry_run and removed:
        data["verbs"] = kept
        meta = data.get("meta", {})
        meta["generatedAt"] = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace(
            "+00:00", "Z"
        )
        if isinstance(meta.get("version"), int):
            meta["version"] = meta["version"] + 1
        data["meta"] = meta

        dataset_path.write_text(
            json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )

    summary = {
        "dataset": str(dataset_path),
        "total_before": len(verbs),
        "removed": len(removed),
        "kept": len(kept),
        "unresolved": len(unresolved),
        "removed_by_match": removal_source,
        "removed_ids": [entry["id"] for entry in removed],
    }

    print(json.dumps(summary, ensure_ascii=False, indent=2))

    if args.report:
        report_path = Path(args.report)
        report_payload = {
            **summary,
            "removed_entries": removed,
            "unresolved_entries": unresolved,
        }
        report_path.write_text(
            json.dumps(report_payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )


if __name__ == "__main__":
    main()
