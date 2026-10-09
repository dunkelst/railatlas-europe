#!/usr/bin/env python3
"""Build a lazy-loadable RailAtlas Europe station catalog.

Inputs may be RailAtlas location/graph JSON files or the ODbL Trainline EU
stations.csv dataset. JSON graph inputs preserve bundle_ids; Trainline data is
used as a broad Europe-wide discovery catalog and is later cross-walked to
RailAtlas operational points as real rail-graph bundles become available.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import unicodedata
from collections import defaultdict
from pathlib import Path


def fold(value: str) -> str:
    value = unicodedata.normalize("NFKD", str(value or ""))
    value = "".join(ch for ch in value if not unicodedata.combining(ch)).lower()
    return re.sub(r"[^a-z0-9]+", " ", value).strip()


def truthy(value):
    return str(value or "").strip().lower() in {"1", "t", "true", "yes", "y"}


def read_trainline_csv(path: Path):
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle, delimiter=";")
        for row in reader:
            name = (row.get("name") or "").strip()
            country = (row.get("country") or "").strip().upper()
            if not name or not country or truthy(row.get("is_city")):
                continue
            try:
                lon = float(row.get("longitude") or "")
                lat = float(row.get("latitude") or "")
            except ValueError:
                continue
            identifiers = {"trainline": [str(row.get("id"))]}
            for source, target in (
                ("uic", "uic"), ("db_id", "db"), ("cff_id", "cff"),
                ("obb_id", "obb"), ("sncf_id", "sncf"), ("renfe_id", "renfe"),
                ("atoc_id", "atoc"), ("benerail_id", "benerail")
            ):
                value = (row.get(source) or "").strip()
                if value:
                    identifiers[target] = [value]
            aliases = []
            slug = (row.get("slug") or "").strip()
            if slug and fold(slug) != fold(name):
                aliases.append(slug.replace("-", " "))
            yield {
                "id": f"ra:ext:trainline:{row.get('id')}",
                "name": name,
                "aliases": aliases,
                "type": "station",
                "country": country,
                "location": [lon, lat],
                "identifiers": identifiers,
                "bundle_ids": [],
                "source": "trainline-eu/stations"
            }


def read_locations(path: Path):
    if path.suffix.lower() == ".csv":
        yield from read_trainline_csv(path)
        return
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("schema") == "railatlas.locations/1":
        yield from data.get("locations", [])
        return
    if data.get("schema") == "railatlas.graph/1":
        region = data.get("region")
        for op in data.get("operational_points", []):
            item = dict(op)
            item["bundle_ids"] = [region] if region else []
            yield item
        return
    raise ValueError(f"Unsupported input schema in {path}")


def first_identifier(location, key):
    values = (location.get("identifiers") or {}).get(key) or []
    return str(values[0]) if values else None


def dedupe_key(location):
    country = (location.get("country") or "xx").lower()
    for key in ("ifopt", "uic", "eva", "osm"):
        value = first_identifier(location, key)
        if value:
            return f"{key}:{value}"
    loc = location.get("location") or [location.get("lon"), location.get("lat")]
    lon = round(float(loc[0]), 5) if loc and loc[0] is not None else None
    lat = round(float(loc[1]), 5) if loc and len(loc) > 1 and loc[1] is not None else None
    return f"name:{country}:{fold(location.get('name'))}:{lon}:{lat}"


def merge_location(a, b):
    result = dict(a)
    result["aliases"] = sorted(set((a.get("aliases") or []) + (b.get("aliases") or [])))
    result["bundle_ids"] = sorted(set((a.get("bundle_ids") or []) + (b.get("bundle_ids") or [])))
    identifiers = defaultdict(list)
    for source in (a.get("identifiers") or {}, b.get("identifiers") or {}):
        for key, values in source.items():
            for value in values or []:
                if value not in identifiers[key]:
                    identifiers[key].append(value)
    result["identifiers"] = dict(identifiers)
    for key in ("country", "type", "location", "lat", "lon", "node_id"):
        if result.get(key) is None and b.get(key) is not None:
            result[key] = b[key]
    return result


def prefixes_for(location):
    values = [location.get("name"), *(location.get("aliases") or [])]
    out = set()
    for value in values:
        token = fold(value)
        if len(token) >= 2:
            out.add(token[:2])
    return out


def main(argv=None):
    p = argparse.ArgumentParser(description="Build sharded RailAtlas Europe station catalog")
    p.add_argument("inputs", nargs="+", type=Path)
    p.add_argument("--output-dir", required=True, type=Path)
    p.add_argument("--manifest", default="location-catalog.json")
    args = p.parse_args(argv)

    merged = {}
    for path in args.inputs:
        for location in read_locations(path):
            if not location.get("name"):
                continue
            key = dedupe_key(location)
            merged[key] = merge_location(merged[key], location) if key in merged else location

    by_country = defaultdict(list)
    for location in merged.values():
        by_country[(location.get("country") or "XX").upper()].append(location)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    shards = []
    prefix_map = defaultdict(set)
    for country, locations in sorted(by_country.items()):
        locations.sort(key=lambda x: fold(x.get("name")))
        shard_id = country.lower()
        path = f"locations/{shard_id}.json"
        target = args.output_dir / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps({"schema":"railatlas.locations/1","locations":locations}, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
        shards.append({"id": shard_id, "country": country, "path": path, "count": len(locations)})
        for location in locations:
            for prefix in prefixes_for(location):
                prefix_map[prefix].add(shard_id)

    manifest = {
        "schema": "railatlas.location-catalog/1",
        "scope": "Europe",
        "total_locations": len(merged),
        "sources": [{"id":"trainline-eu/stations","license":"ODbL-1.0","url":"https://github.com/trainline-eu/stations"}],
        "shards": shards,
        "prefixes": {k: sorted(v) for k, v in sorted(prefix_map.items())}
    }
    (args.output_dir / args.manifest).write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"RailAtlas Europe catalog: {len(merged)} locations in {len(shards)} country shards")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
