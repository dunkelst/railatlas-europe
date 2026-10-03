#!/usr/bin/env python3
"""Build a RailAtlas graph bundle from OpenStreetMap railway data.

Small .osm/.xml files are parsed with the Python standard library for regression
fixtures. Real .osm.pbf extracts use pyosmium when installed.

The builder never creates a connection merely because two geometries cross.
Connectivity follows shared OSM node IDs only.
"""

from __future__ import annotations

import argparse
import json
import math
import re
import sys
from collections import Counter
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple
import xml.etree.ElementTree as ET

RAILWAY_WAY_VALUES = {
    "rail", "light_rail", "subway", "narrow_gauge", "tram", "monorail"
}
OP_NODE_VALUES = {"station", "halt", "junction"}
SPLIT_NODE_VALUES = {"switch", "railway_crossing"}

@dataclass
class OsmNode:
    id: int
    lon: float
    lat: float
    tags: Dict[str, str] = field(default_factory=dict)

@dataclass
class OsmWay:
    id: int
    node_ids: List[int]
    coords: List[Tuple[float, float]]
    tags: Dict[str, str]

@dataclass
class OsmModel:
    nodes: Dict[int, OsmNode]
    ways: List[OsmWay]

def parse_tags(element) -> Dict[str, str]:
    return {t.attrib["k"]: t.attrib.get("v", "") for t in element.findall("tag")}

def load_osm_xml(path: Path) -> OsmModel:
    root = ET.parse(path).getroot()
    nodes: Dict[int, OsmNode] = {}
    for n in root.findall("node"):
        node_id = int(n.attrib["id"])
        nodes[node_id] = OsmNode(
            id=node_id,
            lon=float(n.attrib["lon"]),
            lat=float(n.attrib["lat"]),
            tags=parse_tags(n),
        )

    ways: List[OsmWay] = []
    for w in root.findall("way"):
        tags = parse_tags(w)
        if tags.get("railway") not in RAILWAY_WAY_VALUES:
            continue
        node_ids = [int(nd.attrib["ref"]) for nd in w.findall("nd")]
        if len(node_ids) < 2 or any(nid not in nodes for nid in node_ids):
            continue
        ways.append(OsmWay(
            id=int(w.attrib["id"]),
            node_ids=node_ids,
            coords=[(nodes[nid].lon, nodes[nid].lat) for nid in node_ids],
            tags=tags,
        ))
    return OsmModel(nodes=nodes, ways=ways)

def load_osm_pbf(path: Path) -> OsmModel:
    try:
        import osmium  # type: ignore
    except ImportError as exc:
        raise RuntimeError(
            "PBF import requires pyosmium. Install with: pip install -r requirements-builder.txt"
        ) from exc

    nodes: Dict[int, OsmNode] = {}
    ways: List[OsmWay] = []

    class Handler(osmium.SimpleHandler):
        def node(self, n):
            tags = {t.k: t.v for t in n.tags}
            if tags.get("railway") in OP_NODE_VALUES | SPLIT_NODE_VALUES:
                try:
                    nodes[int(n.id)] = OsmNode(int(n.id), n.location.lon, n.location.lat, tags)
                except Exception:
                    pass

        def way(self, w):
            tags = {t.k: t.v for t in w.tags}
            if tags.get("railway") not in RAILWAY_WAY_VALUES:
                return
            ids: List[int] = []
            coords: List[Tuple[float, float]] = []
            for n in w.nodes:
                try:
                    lon, lat = n.location.lon, n.location.lat
                except Exception:
                    return
                nid = int(n.ref)
                ids.append(nid)
                coords.append((lon, lat))
                existing = nodes.get(nid)
                if existing is None:
                    nodes[nid] = OsmNode(nid, lon, lat, {})
            if len(ids) >= 2:
                ways.append(OsmWay(int(w.id), ids, coords, tags))

    handler = Handler()
    handler.apply_file(str(path), locations=True)
    return OsmModel(nodes=nodes, ways=ways)

def load_osm(path: Path) -> OsmModel:
    suffixes = "".join(path.suffixes).lower()
    if suffixes.endswith(".osm.pbf") or path.suffix.lower() == ".pbf":
        return load_osm_pbf(path)
    return load_osm_xml(path)

def haversine_m(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    lon1, lat1 = map(math.radians, a)
    lon2, lat2 = map(math.radians, b)
    dlon, dlat = lon2 - lon1, lat2 - lat1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * 6371008.8 * math.asin(math.sqrt(h))

def polyline_length_m(coords: List[Tuple[float, float]]) -> float:
    return sum(haversine_m(coords[i - 1], coords[i]) for i in range(1, len(coords)))

def first_number(value: Optional[str]) -> Optional[float]:
    if not value:
        return None
    match = re.search(r"-?\d+(?:\.\d+)?", value.replace(",", "."))
    return float(match.group(0)) if match else None

def first_int(value: Optional[str]) -> Optional[int]:
    number = first_number(value)
    return int(number) if number is not None else None

def infrastructure_from_tags(tags: Dict[str, str]) -> Dict[str, object]:
    return {
        "usage": tags.get("usage"),
        "service": tags.get("service"),
        "tracks": first_int(tags.get("tracks")),
        "gauge_mm": first_int(tags.get("gauge")),
        "electrified": tags.get("electrified"),
        "voltage_v": first_number(tags.get("voltage")),
        "frequency_hz": first_number(tags.get("frequency")),
        "maxspeed_kmh": first_number(tags.get("maxspeed")),
        "operator": tags.get("operator"),
        "infrastructure_manager": tags.get("owner") or tags.get("operator"),
        "line_ref": tags.get("ref"),
        "bridge": tags.get("bridge"),
        "tunnel": tags.get("tunnel"),
        "layer": first_int(tags.get("layer")),
        "signalling": tags.get("railway:signal:main") or tags.get("signal"),
        "traffic_mode": tags.get("passenger") or tags.get("freight"),
    }

def nearest_rail_node(model: OsmModel, point: Tuple[float, float], max_distance_m: float) -> Optional[int]:
    rail_node_ids = {nid for way in model.ways for nid in way.node_ids}
    best_id = None
    best_distance = max_distance_m
    for nid in rail_node_ids:
        node = model.nodes[nid]
        distance = haversine_m(point, (node.lon, node.lat))
        if distance <= best_distance:
            best_id, best_distance = nid, distance
    return best_id

def collect_split_nodes(model: OsmModel, op_snap_m: float) -> Tuple[set[int], Dict[int, int]]:
    counts = Counter(nid for way in model.ways for nid in way.node_ids)
    split_nodes = {nid for nid, count in counts.items() if count > 1}
    for way in model.ways:
        split_nodes.add(way.node_ids[0])
        split_nodes.add(way.node_ids[-1])

    for nid, node in model.nodes.items():
        if node.tags.get("railway") in SPLIT_NODE_VALUES and counts.get(nid):
            split_nodes.add(nid)

    op_snaps: Dict[int, int] = {}
    for nid, node in model.nodes.items():
        if node.tags.get("railway") not in OP_NODE_VALUES:
            continue
        target = nid if counts.get(nid) else nearest_rail_node(model, (node.lon, node.lat), op_snap_m)
        if target is not None:
            split_nodes.add(target)
            op_snaps[nid] = target

    return split_nodes, op_snaps

def edge_segments(way: OsmWay, split_nodes: set[int]):
    start = 0
    for i in range(1, len(way.node_ids)):
        if way.node_ids[i] in split_nodes:
            if i > start:
                yield start, i
            start = i

def make_graph_node(model: OsmModel, osm_node_id: int) -> Dict[str, object]:
    n = model.nodes[osm_node_id]
    return {
        "id": f"osm:n{osm_node_id}",
        "lon": n.lon,
        "lat": n.lat,
        "source_refs": {"osm_node_id": osm_node_id},
    }

def build_graph(
    model: OsmModel,
    region: str,
    source: str,
    source_url: Optional[str] = None,
    source_date: Optional[str] = None,
    country: Optional[str] = None,
    op_snap_m: float = 1000.0,
) -> Dict[str, object]:
    split_nodes, op_snaps = collect_split_nodes(model, op_snap_m)

    graph_node_ids: set[int] = set()
    edges: List[Dict[str, object]] = []

    for way in model.ways:
        for segment_index, (start, end) in enumerate(edge_segments(way, split_nodes)):
            seg_ids = way.node_ids[start:end + 1]
            coords = way.coords[start:end + 1]
            if len(coords) < 2:
                continue

            from_osm = seg_ids[0]
            to_osm = seg_ids[-1]
            graph_node_ids.update((from_osm, to_osm))
            length_m = round(polyline_length_m(coords), 3)
            infra = infrastructure_from_tags(way.tags)
            base = {
                "length_m": length_m,
                "railway": way.tags.get("railway", "rail"),
                "country": country,
                "infrastructure": infra,
                "source_refs": {"osm_way_id": way.id},
            }

            forward = {
                **base,
                "id": f"osm:w{way.id}:s{segment_index}:f",
                "from": f"osm:n{from_osm}",
                "to": f"osm:n{to_osm}",
                "geometry": [[lon, lat] for lon, lat in coords],
            }
            reverse = {
                **base,
                "id": f"osm:w{way.id}:s{segment_index}:r",
                "from": f"osm:n{to_osm}",
                "to": f"osm:n{from_osm}",
                "geometry": [[lon, lat] for lon, lat in reversed(coords)],
            }
            edges.extend((forward, reverse))

    operational_points: List[Dict[str, object]] = []
    for op_osm_id, snapped_osm_id in sorted(op_snaps.items()):
        op = model.nodes[op_osm_id]
        name = op.tags.get("name") or f"OSM {op_osm_id}"
        operational_points.append({
            "id": f"ra:op:osm:{op_osm_id}",
            "name": name,
            "node_id": f"osm:n{snapped_osm_id}",
            "country": country,
            "location": [op.lon, op.lat],
            "identifiers": {"osm": [str(op_osm_id)]},
            "aliases": [],
        })

    return {
        "schema": "railatlas.graph/1",
        "region": region,
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "nodes": [make_graph_node(model, nid) for nid in sorted(graph_node_ids)],
        "edges": edges,
        "operational_points": operational_points,
        "source_metadata": {
            "status": "osm-derived",
            "source": source,
            "source_url": source_url,
            "source_date": source_date,
            "license": "OpenStreetMap data © OpenStreetMap contributors, ODbL 1.0",
            "builder_version": "railatlas-osm-builder/0.1.0",
            "routing_direction_assumption": "bidirectional arcs until railway-specific direction constraints are implemented",
        },
    }

def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Build RailAtlas graph from OSM XML/PBF")
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--region", required=True)
    parser.add_argument("--country")
    parser.add_argument("--source-url")
    parser.add_argument("--source-date")
    parser.add_argument("--op-snap-m", type=float, default=1000.0)
    args = parser.parse_args(argv)

    model = load_osm(args.input)
    graph = build_graph(
        model,
        region=args.region,
        source=args.input.name,
        source_url=args.source_url,
        source_date=args.source_date,
        country=args.country,
        op_snap_m=args.op_snap_m,
    )

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(graph, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(
        f"RailAtlas graph written: {args.output} "
        f"({len(graph['nodes'])} nodes, {len(graph['edges'])} directed edges, "
        f"{len(graph['operational_points'])} operational points)"
    )
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
