#!/usr/bin/env python3
"""Validate production RailAtlas bundle data before deployment.

This is deliberately a deployment gate, not another graph builder. It checks
that the published registry is internally consistent with the graph shards
that the browser will fetch. Deployments can additionally require non-empty
routing coverage via --require-coverage.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
SCHEMA = ROOT / "schema" / "railatlas.bundles.schema.json"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="Validate published RailAtlas routing bundles")
    parser.add_argument(
        "--require-coverage",
        action="store_true",
        help="fail when the production bundle registry contains no routable bundles",
    )
    args = parser.parse_args(argv)

    registry_path = DATA / "bundles.json"
    if not registry_path.exists():
        raise SystemExit("production gate: data/bundles.json is missing")

    registry = load_json(registry_path)
    schema = load_json(SCHEMA)
    errors = sorted(
        Draft202012Validator(schema, format_checker=FormatChecker()).iter_errors(registry),
        key=lambda e: list(e.absolute_path),
    )
    if errors:
        for error in errors:
            where = ".".join(map(str, error.absolute_path)) or "<root>"
            print(f"production gate: registry {where}: {error.message}")
        return 2

    bundles = registry.get("bundles", [])
    if args.require_coverage and not bundles:
        print("production gate: no routable production bundles are published")
        return 5

    by_id = {bundle["id"]: bundle for bundle in bundles}
    if len(by_id) != len(bundles):
        print("production gate: duplicate bundle ids")
        return 3

    failures: list[str] = []
    referenced_graphs: set[Path] = set()

    for bundle in bundles:
        bid = bundle["id"]
        graph_path = DATA / bundle["graph"]
        referenced_graphs.add(graph_path.resolve())
        if not graph_path.is_file():
            failures.append(f"{bid}: graph does not exist: {bundle['graph']}")

        declared_neighbors = set(bundle.get("neighbors", []))
        portal_neighbors = {portal["neighbour_bundle"] for portal in bundle.get("portals", [])}
        if portal_neighbors - declared_neighbors:
            failures.append(f"{bid}: portal neighbor missing from neighbors: {sorted(portal_neighbors - declared_neighbors)}")

        for neighbor in declared_neighbors:
            other = by_id.get(neighbor)
            if other is None:
                failures.append(f"{bid}: unknown neighbor {neighbor}")
                continue
            if bid not in set(other.get("neighbors", [])):
                failures.append(f"{bid}: neighbor relation to {neighbor} is not reciprocal")

        for portal in bundle.get("portals", []):
            neighbor = portal["neighbour_bundle"]
            other = by_id.get(neighbor)
            if other is None:
                continue
            source_ref = str(portal["source_ref"])
            reciprocal = any(
                p.get("neighbour_bundle") == bid and str(p.get("source_ref")) == source_ref
                for p in other.get("portals", [])
            )
            if not reciprocal:
                failures.append(f"{bid}: portal {portal['portal_id']} has no reciprocal source_ref in {neighbor}")

    graph_root = DATA / "graphs"
    if graph_root.exists():
        for graph_path in graph_root.rglob("*.graph.json"):
            if graph_path.resolve() not in referenced_graphs:
                failures.append(f"orphan graph shard: {graph_path.relative_to(DATA)}")

    if failures:
        for failure in failures:
            print(f"production gate: {failure}")
        return 4

    print(f"Production RailGraph gate passed: {len(bundles)} bundles, {len(referenced_graphs)} graph shards")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
