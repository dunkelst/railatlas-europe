#!/usr/bin/env python3
"""Partition a built RailAtlas graph into routable spatial bundles."""
from __future__ import annotations
import argparse, json, math
from datetime import datetime, timezone
from pathlib import Path


def cell(lon, lat, size): return (math.floor(lon / size), math.floor(lat / size))
def bundle_id(ix, iy, size): return f"eu-{size:g}-{ix}-{iy}"


def tile_graph(graph, size=2.0):
    nodes = {n["id"]: n for n in graph.get("nodes", [])}
    memberships = {}
    for e in graph.get("edges", []):
        a, b = nodes.get(e["from"]), nodes.get(e["to"])
        if not a or not b: continue
        ca, cb = cell(a["lon"], a["lat"], size), cell(b["lon"], b["lat"], size)
        memberships.setdefault(ca, []).append(e)
        if cb != ca: memberships.setdefault(cb, []).append(e)
    out = {}
    for c, edges in memberships.items():
        ix, iy = c; bid = bundle_id(ix, iy, size)
        edge_ids = {e["id"] for e in edges}
        node_ids = {x for e in edges for x in (e["from"], e["to"])}
        ops = [op for op in graph.get("operational_points", []) if op.get("node_id") in node_ids]
        out[bid] = {"schema":"railatlas.graph/1","region":bid,"generated_at":graph.get("generated_at"),
                    "nodes":[nodes[n] for n in sorted(node_ids)],
                    "edges":[e for e in graph.get("edges",[]) if e["id"] in edge_ids],
                    "operational_points":ops,
                    "source_metadata":{**graph.get("source_metadata",{}),"tile_size_deg":size,"parent_region":graph.get("region")}}
    portals = {bid: [] for bid in out}; neighbors = {bid: set() for bid in out}
    for e in graph.get("edges", []):
        a,b=nodes.get(e["from"]),nodes.get(e["to"])
        if not a or not b: continue
        ca,cb=cell(a["lon"],a["lat"],size),cell(b["lon"],b["lat"],size)
        if ca == cb: continue
        ba,bb=bundle_id(*ca,size),bundle_id(*cb,size)
        if ba not in out or bb not in out: continue
        neighbors[ba].add(bb); neighbors[bb].add(ba)
        for owner,other,node in ((ba,bb,a),(bb,ba,b)):
            osm=node.get("source_refs",{}).get("osm_node_id")
            source_ref=osm if osm is not None else node["id"]
            portals[owner].append({"portal_id":f"osm-node:{source_ref}","node_id":node["id"],"neighbour_bundle":other,
                                   "source_ref":str(source_ref),"location":[node["lon"],node["lat"]]})
    return out, portals, neighbors


def countries_for_graph(g):
    values={op.get("country") for op in g.get("operational_points",[]) if op.get("country")}
    for e in g.get("edges",[]):
        country=e.get("country") or e.get("infrastructure",{}).get("country")
        if country: values.add(country)
    return sorted(values)


def registry(graphs, portals, neighbors, graph_prefix="graphs"):
    now=datetime.now(timezone.utc).isoformat().replace("+00:00","Z"); bundles=[]
    for bid,g in sorted(graphs.items()):
        ns=g["nodes"]; meta=g.get("source_metadata",{}); countries=countries_for_graph(g)
        if not countries: raise ValueError(f"routable bundle {bid} has no ISO country metadata")
        bbox=[min(n["lon"] for n in ns),min(n["lat"] for n in ns),max(n["lon"] for n in ns),max(n["lat"] for n in ns)]
        bundles.append({"id":bid,"graph":f"{graph_prefix}/{bid}.graph.json","bbox":bbox,"countries":countries,"version":"1","built_at":now,
                        "status":"routable","source":{"type":"osm-derived","ref":meta.get("source") or "unknown","timestamp":meta.get("source_date") or g.get("generated_at") or now},
                        "coverage":{"nodes":len(ns),"edges":len(g["edges"]),"operational_points":len(g["operational_points"])},
                        "neighbors":sorted(neighbors[bid]),"portals":portals[bid]})
    return {"schema":"railatlas.bundles/1","strategy":"spatial-overlap-osm-portals","bundles":bundles}


def remap_locations(index, graphs):
    node_bundles={}
    for bid,g in graphs.items():
        for n in g.get("nodes",[]): node_bundles.setdefault(n["id"],set()).add(bid)
    out={**index,"locations":[]}
    for loc in index.get("locations",[]):
        bids=sorted(node_bundles.get(loc.get("node_id"),()))
        out["locations"].append({**loc,"bundle_ids":bids})
    return out


def main():
    p=argparse.ArgumentParser(); p.add_argument("input",type=Path); p.add_argument("output_dir",type=Path); p.add_argument("--tile-deg",type=float,default=2.0); p.add_argument("--registry",type=Path); p.add_argument("--location-index",type=Path); p.add_argument("--location-index-out",type=Path)
    a=p.parse_args(); graph=json.loads(a.input.read_text()); graphs,portals,neighbors=tile_graph(graph,a.tile_deg)
    a.output_dir.mkdir(parents=True,exist_ok=True)
    for bid,g in graphs.items(): (a.output_dir/f"{bid}.graph.json").write_text(json.dumps(g,separators=(",",":"))+"\n")
    if a.registry: a.registry.write_text(json.dumps(registry(graphs,portals,neighbors),separators=(",",":"))+"\n")
    if a.location_index:
        if not a.location_index_out: p.error("--location-index-out is required with --location-index")
        index=json.loads(a.location_index.read_text()); a.location_index_out.write_text(json.dumps(remap_locations(index,graphs),separators=(",",":"))+"\n")
    print(f"Wrote {len(graphs)} routable bundles")
if __name__ == "__main__": main()
