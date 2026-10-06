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

RAILWAY_WAY_VALUES = {"rail", "light_rail", "subway", "narrow_gauge", "tram", "monorail"}
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
        nodes[node_id] = OsmNode(node_id, float(n.attrib["lon"]), float(n.attrib["lat"]), parse_tags(n))
    ways: List[OsmWay] = []
    for w in root.findall("way"):
        tags = parse_tags(w)
        if tags.get("railway") not in RAILWAY_WAY_VALUES:
            continue
        node_ids = [int(nd.attrib["ref"]) for nd in w.findall("nd")]
        if len(node_ids) < 2 or any(nid not in nodes for nid in node_ids):
            continue
        ways.append(OsmWay(int(w.attrib["id"]), node_ids, [(nodes[n].lon, nodes[n].lat) for n in node_ids], tags))
    return OsmModel(nodes, ways)

def load_osm_pbf(path: Path) -> OsmModel:
    try:
        import osmium  # type: ignore
    except ImportError as exc:
        raise RuntimeError("PBF import requires pyosmium. Install with: pip install -r requirements-builder.txt") from exc
    nodes: Dict[int, OsmNode] = {}
    ways: List[OsmWay] = []
    class Handler(osmium.SimpleHandler):
        def node(self, n):
            tags = {t.k: t.v for t in n.tags}
            if tags.get("railway") in OP_NODE_VALUES | SPLIT_NODE_VALUES:
                try: nodes[int(n.id)] = OsmNode(int(n.id), n.location.lon, n.location.lat, tags)
                except Exception: pass
        def way(self, w):
            tags = {t.k: t.v for t in w.tags}
            if tags.get("railway") not in RAILWAY_WAY_VALUES: return
            ids, coords = [], []
            for n in w.nodes:
                try: lon, lat = n.location.lon, n.location.lat
                except Exception: return
                nid = int(n.ref); ids.append(nid); coords.append((lon, lat))
                if nid not in nodes: nodes[nid] = OsmNode(nid, lon, lat, {})
            if len(ids) >= 2: ways.append(OsmWay(int(w.id), ids, coords, tags))
    handler = Handler(); handler.apply_file(str(path), locations=True)
    return OsmModel(nodes, ways)

def load_osm(path: Path) -> OsmModel:
    suffixes = "".join(path.suffixes).lower()
    return load_osm_pbf(path) if suffixes.endswith(".osm.pbf") or path.suffix.lower() == ".pbf" else load_osm_xml(path)

def haversine_m(a, b):
    lon1, lat1 = map(math.radians, a); lon2, lat2 = map(math.radians, b)
    dlon, dlat = lon2-lon1, lat2-lat1
    h = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    return 2*6371008.8*math.asin(math.sqrt(h))

def polyline_length_m(coords): return sum(haversine_m(coords[i-1], coords[i]) for i in range(1, len(coords)))
def first_number(value):
    if not value: return None
    m = re.search(r"-?\d+(?:\.\d+)?", value.replace(",", ".")); return float(m.group(0)) if m else None
def first_int(value):
    n = first_number(value); return int(n) if n is not None else None

def infrastructure_from_tags(tags):
    return {"usage":tags.get("usage"),"service":tags.get("service"),"tracks":first_int(tags.get("tracks")),"gauge_mm":first_int(tags.get("gauge")),"electrified":tags.get("electrified"),"voltage_v":first_number(tags.get("voltage")),"frequency_hz":first_number(tags.get("frequency")),"maxspeed_kmh":first_number(tags.get("maxspeed")),"operator":tags.get("operator"),"infrastructure_manager":tags.get("owner") or tags.get("operator"),"line_ref":tags.get("ref"),"bridge":tags.get("bridge"),"tunnel":tags.get("tunnel"),"layer":first_int(tags.get("layer")),"signalling":tags.get("railway:signal:main") or tags.get("signal"),"traffic_mode":tags.get("passenger") or tags.get("freight")}

def nearest_rail_node(model, point, max_distance_m):
    best_id, best_distance = None, max_distance_m
    for nid in {nid for way in model.ways for nid in way.node_ids}:
        node=model.nodes[nid]; distance=haversine_m(point,(node.lon,node.lat))
        if distance <= best_distance: best_id,best_distance=nid,distance
    return best_id

def collect_split_nodes(model, op_snap_m):
    counts=Counter(nid for way in model.ways for nid in way.node_ids); split={nid for nid,c in counts.items() if c>1}
    for way in model.ways: split.update((way.node_ids[0],way.node_ids[-1]))
    for nid,node in model.nodes.items():
        if node.tags.get("railway") in SPLIT_NODE_VALUES and counts.get(nid): split.add(nid)
    snaps={}
    for nid,node in model.nodes.items():
        if node.tags.get("railway") not in OP_NODE_VALUES: continue
        target=nid if counts.get(nid) else nearest_rail_node(model,(node.lon,node.lat),op_snap_m)
        if target is not None: split.add(target); snaps[nid]=target
    return split,snaps

def edge_segments(way, split_nodes):
    start=0
    for i in range(1,len(way.node_ids)):
        if way.node_ids[i] in split_nodes:
            if i>start: yield start,i
            start=i

def make_graph_node(model, osm_node_id):
    n=model.nodes[osm_node_id]; return {"id":f"osm:n{osm_node_id}","lon":n.lon,"lat":n.lat,"source_refs":{"osm_node_id":osm_node_id}}

def build_graph(model, region, source, source_url=None, source_date=None, country=None, op_snap_m=1000.0):
    split_nodes,op_snaps=collect_split_nodes(model,op_snap_m); graph_node_ids=set(); edges=[]
    for way in model.ways:
        for segment_index,(start,end) in enumerate(edge_segments(way,split_nodes)):
            seg_ids=way.node_ids[start:end+1]; coords=way.coords[start:end+1]
            if len(coords)<2: continue
            a,b=seg_ids[0],seg_ids[-1]; graph_node_ids.update((a,b)); length=round(polyline_length_m(coords),3)
            base={"length_m":length,"railway":way.tags.get("railway","rail"),"country":country,"infrastructure":infrastructure_from_tags(way.tags),"source_refs":{"osm_way_id":way.id}}
            edges.extend(({**base,"id":f"osm:w{way.id}:s{segment_index}:f","from":f"osm:n{a}","to":f"osm:n{b}","geometry":[[x,y] for x,y in coords]},{**base,"id":f"osm:w{way.id}:s{segment_index}:r","from":f"osm:n{b}","to":f"osm:n{a}","geometry":[[x,y] for x,y in reversed(coords)]}))
    ops=[]
    for op_id,snap_id in sorted(op_snaps.items()):
        op=model.nodes[op_id]; name=op.tags.get("name") or f"OSM {op_id}"
        aliases=[v for k,v in op.tags.items() if k in {"alt_name","short_name","official_name","loc_name"} and v and v != name]
        identifiers={"osm":[str(op_id)]}
        for key,out_key in (("ref:IFOPT","ifopt"),("ref:eva","eva"),("uic_ref","uic")):
            if op.tags.get(key): identifiers[out_key]=[op.tags[key]]
        ops.append({"id":f"ra:op:osm:{op_id}","name":name,"node_id":f"osm:n{snap_id}","country":country,"location":[op.lon,op.lat],"identifiers":identifiers,"aliases":aliases,"type":op.tags.get("railway")})
    return {"schema":"railatlas.graph/1","region":region,"generated_at":datetime.now(timezone.utc).isoformat().replace("+00:00","Z"),"nodes":[make_graph_node(model,n) for n in sorted(graph_node_ids)],"edges":edges,"operational_points":ops,"source_metadata":{"status":"osm-derived","source":source,"source_url":source_url,"source_date":source_date,"license":"OpenStreetMap data © OpenStreetMap contributors, ODbL 1.0","builder_version":"railatlas-osm-builder/0.2.0","routing_direction_assumption":"bidirectional arcs until railway-specific direction constraints are implemented"}}

def build_location_index(graph):
    region=graph["region"]
    return {"schema":"railatlas.locations/1","generated_at":graph["generated_at"],"locations":[{"id":op["id"],"name":op["name"],"aliases":op.get("aliases",[]),"type":op.get("type"),"country":op.get("country"),"location":op["location"],"node_id":op["node_id"],"identifiers":op.get("identifiers",{}),"bundle_ids":[region]} for op in graph.get("operational_points",[])]}

def main(argv=None):
    parser=argparse.ArgumentParser(description="Build RailAtlas graph from OSM XML/PBF")
    parser.add_argument("input",type=Path); parser.add_argument("output",type=Path); parser.add_argument("--region",required=True); parser.add_argument("--country"); parser.add_argument("--source-url"); parser.add_argument("--source-date"); parser.add_argument("--op-snap-m",type=float,default=1000.0); parser.add_argument("--location-index",type=Path,help="Also write compact operational-point index for search/bundle resolution")
    args=parser.parse_args(argv); model=load_osm(args.input); graph=build_graph(model,args.region,args.input.name,args.source_url,args.source_date,args.country,args.op_snap_m)
    args.output.parent.mkdir(parents=True,exist_ok=True); args.output.write_text(json.dumps(graph,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    if args.location_index:
        args.location_index.parent.mkdir(parents=True,exist_ok=True); index=build_location_index(graph); args.location_index.write_text(json.dumps(index,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
    print(f"RailAtlas graph written: {args.output} ({len(graph['nodes'])} nodes, {len(graph['edges'])} directed edges, {len(graph['operational_points'])} operational points)")
    return 0

if __name__ == "__main__": raise SystemExit(main())
