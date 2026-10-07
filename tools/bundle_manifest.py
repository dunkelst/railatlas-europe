#!/usr/bin/env python3
"""Generate a RailAtlas bundle manifest from a built RailGraph.

Boundary nodes are selected against the exact extraction bbox supplied by the
build pipeline. Keeping this separate from the PBF parser makes manifests
reproducible for graphs produced by any importer.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def parse_bbox(value: str):
    parts = [float(v) for v in value.split(",")]
    if len(parts) != 4:
        raise argparse.ArgumentTypeError("bbox must be minlon,minlat,maxlon,maxlat")
    minlon, minlat, maxlon, maxlat = parts
    if minlon >= maxlon or minlat >= maxlat:
        raise argparse.ArgumentTypeError("bbox minimums must be smaller than maximums")
    return parts


def on_boundary(lon, lat, bbox, epsilon):
    minlon, minlat, maxlon, maxlat = bbox
    inside = minlon - epsilon <= lon <= maxlon + epsilon and minlat - epsilon <= lat <= maxlat + epsilon
    if not inside:
        return False
    return min(abs(lon-minlon), abs(lon-maxlon), abs(lat-minlat), abs(lat-maxlat)) <= epsilon


def build_manifest(graph, graph_path: Path, bbox, epsilon=1e-5):
    boundary_nodes = []
    for node in graph.get("nodes", []):
        refs = node.get("source_refs") or {}
        osm_id = refs.get("osm_node_id")
        if osm_id is None:
            continue
        if on_boundary(float(node["lon"]), float(node["lat"]), bbox, epsilon):
            boundary_nodes.append({"node_id": node["id"], "osm_node_id": osm_id})
    boundary_nodes.sort(key=lambda item: (item["osm_node_id"], item["node_id"]))
    return {
        "schema": "railatlas.bundle/1",
        "id": graph["region"],
        "graph": graph_path.name,
        "bbox": bbox,
        "node_count": len(graph.get("nodes", [])),
        "edge_count": len(graph.get("edges", [])),
        "operational_point_count": len(graph.get("operational_points", [])),
        "boundary_nodes": boundary_nodes,
        "neighbors": [],
        "source": graph.get("source_metadata", {}),
        "qa": {},
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description="Generate RailAtlas bundle manifest")
    parser.add_argument("graph", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--bbox", required=True, type=parse_bbox, help="exact extract bbox: minlon,minlat,maxlon,maxlat")
    parser.add_argument("--epsilon", type=float, default=1e-5, help="boundary tolerance in degrees")
    args = parser.parse_args(argv)
    graph = json.loads(args.graph.read_text(encoding="utf-8"))
    manifest = build_manifest(graph, args.graph, args.bbox, args.epsilon)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Bundle manifest written: {args.output} ({len(manifest['boundary_nodes'])} boundary nodes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
