#!/usr/bin/env node
import fs from 'node:fs';
import { performance } from 'node:perf_hooks';
import { mergeJourneyBundles } from '../src/bundle-graph.js';
import { dijkstra, resolveOperationalPoint } from '../src/routing.js';

function usage() {
  console.error('Usage: node tools/benchmark_corridor.mjs --from "Heilbronn Hbf" --to "Stuttgart Hbf" [--repeat 5] graph1.json [graph2.json ...]');
  process.exit(2);
}

const args = process.argv.slice(2);
let from = null, to = null, repeat = 5;
const files = [];
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--from') from = args[++i];
  else if (args[i] === '--to') to = args[++i];
  else if (args[i] === '--repeat') repeat = Number(args[++i]);
  else files.push(args[i]);
}
if (!from || !to || !files.length || !Number.isInteger(repeat) || repeat < 1) usage();

const bundleBytes = files.map(file => fs.statSync(file).size);
const bundles = files.map(file => JSON.parse(fs.readFileSync(file, 'utf8')));
const mergeStart = performance.now();
const graph = bundles.length === 1 ? bundles[0] : mergeJourneyBundles(bundles);
const mergeMs = performance.now() - mergeStart;
const fromOp = resolveOperationalPoint(graph, from);
const toOp = resolveOperationalPoint(graph, to);
if (!fromOp || !toOp) {
  console.error(JSON.stringify({ status: 'location_not_found', from_found: Boolean(fromOp), to_found: Boolean(toOp) }, null, 2));
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
  bundles: files.map((file, i) => ({ file, region: bundles[i].region ?? null, bytes: bundleBytes[i], nodes: bundles[i].nodes?.length ?? 0, edges: bundles[i].edges?.length ?? 0 })),
  totals: { bundle_count: files.length, bytes: bundleBytes.reduce((a, b) => a + b, 0), merged_nodes: graph.nodes?.length ?? 0, merged_edges: graph.edges?.length ?? 0 },
  route: { distance_m: route.distanceM, routing_cost: route.routingCost, nodes: route.nodeIds.length, edges: route.edgeIds.length },
  timing_ms: { merge: mergeMs, route_runs: timings, route_median: percentile(50), route_p95: percentile(95) }
};
console.log(JSON.stringify(result, null, 2));
