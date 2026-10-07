#!/usr/bin/env python3
"""Build a RailAtlas bundle metagraph from generated bundle manifests."""
from __future__ import annotations

import argparse
import copy
import json
from collections import defaultdict
from pathlib import Path

SCHEMA = "railatlas.bundle/1"
INDEX_SCHEMA = "railatlas.bundle-index/1"


def build_index(manifests):
    by_id = {}
    boundary_owners = defaultdict(list)

    for source in manifests:
        manifest = copy.deepcopy(source)
        if manifest.get("schema") != SCHEMA:
            raise ValueError(f"unsupported manifest schema for {manifest.get('id', '<unknown>')}")
        bundle_id = manifest.get("id")
        if not bundle_id or bundle_id in by_id:
            raise ValueError(f"missing or duplicate bundle id: {bundle_id!r}")
        manifest["neighbors"] = []
        by_id[bundle_id] = manifest
        for node in manifest.get("boundary_nodes", []):
            osm_id = node.get("osm_node_id")
            node_id = node.get("node_id")
            if osm_id is not None and node_id:
                boundary_owners[str(osm_id)].append((bundle_id, node_id))

    shared = defaultdict(lambda: defaultdict(set))
    for owners in boundary_owners.values():
        bundle_ids = sorted({bundle_id for bundle_id, _ in owners})
        if len(bundle_ids) < 2:
            continue
        nodes_by_bundle = defaultdict(set)
        for bundle_id, node_id in owners:
            nodes_by_bundle[bundle_id].add(node_id)
        for bundle_id in bundle_ids:
            for other_id in bundle_ids:
                if other_id != bundle_id:
                    shared[bundle_id][other_id].update(nodes_by_bundle[bundle_id])

    for bundle_id, manifest in by_id.items():
        manifest["neighbors"] = [
            {"bundle_id": other_id, "shared_boundary_nodes": sorted(node_ids)}
            for other_id, node_ids in sorted(shared[bundle_id].items())
        ]

    return {
        "schema": INDEX_SCHEMA,
        "bundles": [by_id[bundle_id] for bundle_id in sorted(by_id)],
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description="Derive reciprocal RailAtlas bundle neighbors")
    parser.add_argument("manifests", nargs="+", type=Path)
    parser.add_argument("-o", "--output", required=True, type=Path)
    args = parser.parse_args(argv)

    manifests = [json.loads(path.read_text(encoding="utf-8")) for path in args.manifests]
    index = build_index(manifests)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    neighbor_links = sum(len(bundle["neighbors"]) for bundle in index["bundles"])
    print(f"Bundle index written: {args.output} ({len(index['bundles'])} bundles, {neighbor_links} directed neighbor links)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
