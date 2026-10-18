#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { mergeJourneyBundles } from '../src/bundle-graph.js';
import { resolveBundlePathForLocations } from '../src/bundle-router.js';
import { resolveLocation } from '../src/location-index.js';
import { dijkstra, resolveOperationalPoint } from '../src/routing.js';

function usage() {
  console.error('Usage: node tools/benchmark_corridor.mjs --from "Heilbronn Hbf" --to "Stuttgart Hbf" [--repeat 5] [--registry build/bundles.json --locations build/locations.json | graph1.json graph2.json ...]');
  process.exit(2);
}

const args = process.argv.slice(2);
let from = null, to = null, repeat = 5, registryFile = null, locationsFile = null;
let files = [];
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--from') from = args[++i];
  else if (args[i] === '--to') to = args[++i];
  else if (args[i] === '--repeat') repeat = Number(args[++i]);
  else if (args[i] === '--registry') registryFile = args[++i];
  else if (args[i] === '--locations') locationsFile = args[++i];
  else files.push(args[i]);
}
if (!from || !to || !Number.isInteger(repeat) || repeat < 1) usage();

let registry = null;
let selectedBundleIds = null;
let portalTransitions = null;
let unusedBundleCount = null;
let indexedFrom = null;
let indexedTo = null;

if (registryFile) {
  if (files.length) usage();
  const registryDir = path.dirname(path.resolve(registryFile));
  locationsFile ??= path.join(registryDir, 'locations.json');
  registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
  const locations = JSON.parse(fs.readFileSync(locationsFile, 'utf8'));
  indexedFrom = resolveLocation(locations, from);
  indexedTo = resolveLocation(locations, to);
  if (!indexedFrom || !indexedTo) {
    console.error(JSON.stringify({ status: 'location_not_found', from_found: Boolean(indexedFrom), to_found: Boolean(indexedTo), stage: 'location_index' }, null, 2));
    process.exit(1);
  }
  const corridor = resolveBundlePathForLocations(registry, indexedFrom, indexedTo);
  if (!corridor?.length) {
    console.error(JSON.stringify({ status: 'graph_missing', from_bundle_ids: indexedFrom.bundle_ids ?? [], to_bundle_ids: indexedTo.bundle_ids ?? [], stage: 'bundle_metagraph' }, null, 2));
    process.exit(1);
  }
  selectedBundleIds = corridor.map(bundle => bundle.id);
  files = corridor.map(bundle => path.resolve(registryDir, bundle.graph));
  unusedBundleCount = Math.max(0, (registry.bundles?.length ?? 0) - corridor.length);
  portalTransitions = corridor.slice(0, -1).map((bundle, i) => {
    const next = corridor[i + 1];
    return {
      from: bundle.id,
      to: next.id,
      portals: (bundle.portals ?? []).filter(portal => portal.neighbour_bundle === next.id).length,
    };
  });
}

if (!files.length) usage();
const bundleBytes = files.map(file => fs.statSync(file).size);
const bundles = files.map(file => JSON.parse(fs.readFileSync(file, 'utf8')));
const mergeStart = performance.now();
const graph = bundles.length === 1 ? bundles[0] : mergeJourneyBundles(bundles);
const mergeMs = performance.now() - mergeStart;
const fromOp = indexedFrom?.node_id ? graph.operational_points?.find(op => op.node_id === indexedFrom.node_id) : resolveOperationalPoint(graph, from);
const toOp = indexedTo?.node_id ? graph.operational_points?.find(op => op.node_id === indexedTo.node_id) : resolveOperationalPoint(graph, to);
if (!fromOp || !toOp) {
  console.error(JSON.stringify({ status: 'location_not_found', from_found: Boolean(fromOp), to_found: Boolean(toOp), stage: 'merged_graph' }, null, 2));
  process.exit(1);
}

const timings = [];
let route = null;
for (let i = 0; i < repeat; i += 1) {
  const start = performance.now();
  route = dijkstra(graph, fromOp.node_id, toOp.node_id);
  timings.push(performance.now() - start);
}
if (!route) {
  console.error(JSON.stringify({ status: 'no_path', from_op: fromOp.id, to_op: toOp.id }, null, 2));
  process.exit(1);
}
const sorted = [...timings].sort((a, b) => a - b);
const percentile = p => sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
const result = {
  schema: 'railatlas.corridor-benchmark/1',
  status: 'ok',
  from: { query: from, op_id: fromOp.id, node_id: fromOp.node_id },
  to: { query: to, op_id: toOp.id, node_id: toOp.node_id },
  selection: registryFile ? { registry: registryFile, locations: locationsFile, selected_bundle_ids: selectedBundleIds, unused_bundle_count: unusedBundleCount, portal_transitions: portalTransitions } : null,
  bundles: files.map((file, i) => ({ file, id: selectedBundleIds?.[i] ?? bundles[i].region ?? null, region: bundles[i].region ?? null, bytes: bundleBytes[i], nodes: bundles[i].nodes?.length ?? 0, edges: bundles[i].edges?.length ?? 0 })),
  totals: { bundle_count: files.length, bytes: bundleBytes.reduce((a, b) => a + b, 0), merged_nodes: graph.nodes?.length ?? 0, merged_edges: graph.edges?.length ?? 0 },
  route: { distance_m: route.distanceM, routing_cost: route.routingCost, nodes: route.nodeIds.length, edges: route.edgeIds.length },
  timing_ms: { merge: mergeMs, route_runs: timings, route_median: percentile(50), route_p95: percentile(95) }
};
console.log(JSON.stringify(result, null, 2));
