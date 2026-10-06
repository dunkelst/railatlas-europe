#!/usr/bin/env python3
"""QA report for RailAtlas graph bundles.

Usage: python3 tools/graph_qa.py data/region.graph.json [--json report.json]
"""
import argparse, json
from collections import Counter, defaultdict, deque
from pathlib import Path


def analyse(graph):
    nodes = {n['id']: n for n in graph.get('nodes', [])}
    edges = graph.get('edges', [])
    ops = graph.get('operational_points', [])
    adjacency = defaultdict(set)
    degree = Counter()
    missing_endpoints = []
    service_edges = 0
    for e in edges:
        a, b = e.get('from'), e.get('to')
        if a not in nodes or b not in nodes:
            missing_endpoints.append(e.get('id'))
            continue
        adjacency[a].add(b); adjacency[b].add(a)
        degree[a] += 1; degree[b] += 1
        if (e.get('infrastructure') or {}).get('service'):
            service_edges += 1
    unseen = set(nodes); components = []
    while unseen:
        root = unseen.pop(); q = deque([root]); comp = {root}
        while q:
            n = q.popleft()
            for nxt in adjacency[n]:
                if nxt in unseen:
                    unseen.remove(nxt); comp.add(nxt); q.append(nxt)
        components.append(comp)
    components.sort(key=len, reverse=True)
    op_missing_node = [o.get('id') for o in ops if o.get('node_id') not in nodes]
    isolated_ops = [o.get('id') for o in ops if o.get('node_id') in nodes and not adjacency[o.get('node_id')]]
    junction_nodes = [nid for nid, neighbours in adjacency.items() if len(neighbours) > 2]
    infra = Counter()
    for e in edges:
        i = e.get('infrastructure') or {}
        for key in ('electrified','voltage_v','frequency_hz','maxspeed_kmh','gauge_mm','line_ref','bridge','tunnel','signalling'):
            if i.get(key) is not None: infra[key] += 1
    return {
        'schema': 'railatlas.graph-qa/1', 'region': graph.get('region'),
        'nodes': len(nodes), 'directed_edges': len(edges), 'operational_points': len(ops),
        'components': len(components), 'largest_component_nodes': len(components[0]) if components else 0,
        'largest_component_pct': round(100 * len(components[0]) / len(nodes), 2) if nodes and components else 0,
        'junction_nodes': len(junction_nodes), 'service_edges': service_edges,
        'missing_edge_endpoints': missing_endpoints, 'op_missing_graph_node': op_missing_node,
        'isolated_operational_points': isolated_ops, 'infrastructure_coverage_edges': dict(infra),
        'warnings': ([f'{len(components)} disconnected components'] if len(components) > 1 else [])
                    + ([f'{len(op_missing_node)} operational points reference missing nodes'] if op_missing_node else [])
                    + ([f'{len(isolated_ops)} isolated operational points'] if isolated_ops else [])
                    + ([f'{len(missing_endpoints)} edges reference missing nodes'] if missing_endpoints else [])
    }


def main():
    p = argparse.ArgumentParser(); p.add_argument('graph', type=Path); p.add_argument('--json', type=Path)
    a = p.parse_args(); report = analyse(json.loads(a.graph.read_text(encoding='utf-8')))
    text = json.dumps(report, ensure_ascii=False, indent=2)
    if a.json: a.json.write_text(text + '\n', encoding='utf-8')
    print(text)
    return 1 if report['missing_edge_endpoints'] or report['op_missing_graph_node'] else 0

if __name__ == '__main__': raise SystemExit(main())
