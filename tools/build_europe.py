#!/usr/bin/env python3
"""Run the production RailAtlas PBF -> graph -> QA -> bundle pipeline."""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

import graph_qa
import osm_pbf_builder
import tile_graph_bundles


def write_json(path: Path, value) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description="Build production RailAtlas routing bundles from an OSM PBF/XML extract")
    p.add_argument("input", type=Path)
    p.add_argument("output", type=Path, help="Build output directory")
    p.add_argument("--region", required=True, help="Source/extract identity, e.g. de-southwest")
    p.add_argument("--country", help="ISO alpha-2 country for a single-country extract")
    p.add_argument("--source-url")
    p.add_argument("--source-date", help="RFC3339 source snapshot timestamp")
    p.add_argument("--tile-size-deg", type=float, default=2.0)
    p.add_argument("--op-snap-m", type=float, default=1000.0)
    a = p.parse_args(argv)

    out = a.output
    graph_path = out / "source.graph.json"
    locations_path = out / "locations.json"
    qa_path = out / "graph-qa.json"
    registry_path = out / "bundles.json"
    bundle_dir = out / "graphs"

    model = osm_pbf_builder.load_osm(a.input)
    graph = osm_pbf_builder.build_graph(model, a.region, a.input.name, a.source_url, a.source_date, a.country, a.op_snap_m)
    write_json(graph_path, graph)

    qa = graph_qa.analyse(graph)
    write_json(qa_path, qa)
    if qa["missing_edge_endpoints"] or qa["op_missing_graph_node"]:
        print(f"Build stopped: graph integrity failed; see {qa_path}")
        return 2

    graphs, portals, neighbors = tile_graph_bundles.tile_graph(graph, a.tile_size_deg)
    registry = tile_graph_bundles.registry(graphs, portals, neighbors)
    schema_path = Path(__file__).resolve().parents[1] / "schema" / "railatlas.bundles.schema.json"
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    errors = sorted(Draft202012Validator(schema, format_checker=FormatChecker()).iter_errors(registry), key=lambda e: list(e.absolute_path))
    if errors:
        for error in errors:
            print(f"registry: {'.'.join(map(str, error.absolute_path)) or '<root>'}: {error.message}")
        return 3

    for bid, bundle in graphs.items():
        write_json(bundle_dir / f"{bid}.graph.json", bundle)
    write_json(registry_path, registry)

    locations = osm_pbf_builder.build_location_index(graph)
    locations = tile_graph_bundles.remap_locations(locations, graphs)
    write_json(locations_path, locations)

    assigned = sum(bool(x.get("bundle_ids")) for x in locations.get("locations", []))
    portal_count = sum(len(x) for x in portals.values())
    manifest = {
        "schema": "railatlas.build-manifest/1",
        "built_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "source": {"file": a.input.name, "url": a.source_url, "timestamp": a.source_date},
        "region": a.region,
        "country": a.country,
        "tile_size_deg": a.tile_size_deg,
        "graph": {"nodes": qa["nodes"], "edges": qa["directed_edges"], "operational_points": qa["operational_points"], "components": qa["components"], "largest_component_pct": qa["largest_component_pct"]},
        "bundles": {"count": len(graphs), "portals": portal_count},
        "locations": {"total": len(locations.get("locations", [])), "assigned_to_bundle": assigned},
        "infrastructure_coverage_edges": qa["infrastructure_coverage_edges"],
        "artifacts": {"graph": graph_path.name, "qa": qa_path.name, "registry": registry_path.name, "locations": locations_path.name, "bundle_dir": bundle_dir.name},
    }
    write_json(out / "build-manifest.json", manifest)
    print(f"RailAtlas build complete: {len(graphs)} bundles, {portal_count} portals, {assigned}/{manifest['locations']['total']} locations assigned")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
