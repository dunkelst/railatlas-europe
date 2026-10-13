#!/usr/bin/env python3
"""Smoke-test that the real Stuttgart OSM graph can route Heilbronn Hbf to Stuttgart Hbf.

Usage: python3 tools/route_smoke.py data/de-bw-stuttgart.graph.json
"""
import argparse
import heapq
import json
import math
from pathlib import Path


def haversine_m(a, b):
    lon1, lat1 = map(math.radians, a)
    lon2, lat2 = map(math.radians, b)
    dlon, dlat = lon2 - lon1, lat2 - lat1
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    return 2 * 6371008.8 * math.asin(math.sqrt(h))


def nearest_operational_point(graph, lon, lat, max_snap_m):
    nodes = {node["id"]: node for node in graph.get("nodes", [])}
    candidates = []
    for op in graph.get("operational_points", []):
        if op.get("node_id") not in nodes:
            continue
        point = op.get("location")
        if not isinstance(point, list) or len(point) < 2:
            node = nodes[op["node_id"]]
            point = [node.get("lon"), node.get("lat")]
        if point[0] is None or point[1] is None:
            continue
        distance = haversine_m((lon, lat), (float(point[0]), float(point[1])))
        if distance <= max_snap_m:
            candidates.append((distance, op))
    if not candidates:
        raise RuntimeError(f"No operational point within {max_snap_m:.0f} m of ({lon}, {lat})")
    return min(candidates, key=lambda item: item[0])


def shortest_route_m(graph, source, target):
    nodes = {node["id"] for node in graph.get("nodes", [])}
    adjacency = {}
    for edge in graph.get("edges", []):
        start, end = edge.get("from"), edge.get("to")
        if start not in nodes or end not in nodes:
            continue
        weight = float(edge.get("length_m") or 0)
        if weight < 0:
            continue
        adjacency.setdefault(start, []).append((end, weight))
    distances = {source: 0.0}
    queue = [(0.0, source)]
    while queue:
        distance, node = heapq.heappop(queue)
        if distance != distances.get(node):
            continue
        if node == target:
            return distance
        for neighbour, weight in adjacency.get(node, []):
            candidate = distance + weight
            if candidate < distances.get(neighbour, float("inf")):
                distances[neighbour] = candidate
                heapq.heappush(queue, (candidate, neighbour))
    return None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("graph", type=Path)
    parser.add_argument("--from-lon", type=float, default=9.2090)
    parser.add_argument("--from-lat", type=float, default=49.1430)
    parser.add_argument("--to-lon", type=float, default=9.1829)
    parser.add_argument("--to-lat", type=float, default=48.7838)
    parser.add_argument("--max-snap-m", type=float, default=5000)
    parser.add_argument("--min-route-km", type=float, default=20)
    parser.add_argument("--max-route-km", type=float, default=180)
    args = parser.parse_args()

    graph = json.loads(args.graph.read_text(encoding="utf-8"))
    origin_distance, origin = nearest_operational_point(graph, args.from_lon, args.from_lat, args.max_snap_m)
    destination_distance, destination = nearest_operational_point(graph, args.to_lon, args.to_lat, args.max_snap_m)
    if origin["node_id"] == destination["node_id"]:
        raise RuntimeError("Origin and destination resolved to the same graph node")

    distance_m = shortest_route_m(graph, origin["node_id"], destination["node_id"])
    if distance_m is None:
        raise RuntimeError(f"No connected rail route: {origin.get('name')} -> {destination.get('name')}")
    distance_km = distance_m / 1000
    if not args.min_route_km <= distance_km <= args.max_route_km:
        raise RuntimeError(f"Implausible route distance: {distance_km:.1f} km")

    print(json.dumps({
        "status": "route-smoke-passed",
        "from": origin.get("name"),
        "from_snap_m": round(origin_distance, 1),
        "to": destination.get("name"),
        "to_snap_m": round(destination_distance, 1),
        "route_km": round(distance_km, 2),
        "graph_region": graph.get("region"),
        "source": graph.get("source_metadata", {}).get("source_url"),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
