import { resolveOperationalPoint } from './routing.js';
import { graphRegions, loadGraphForRegion } from './region-loader.js';
import { mergeJourneyBundles } from './bundle-graph.js';
import { resolveBundlePathForLocations } from './bundle-router.js';

async function cachedGraph(region, cache) {
  let graph = cache.get(region.id);
  if (!graph) {
    graph = await loadGraphForRegion(region);
    if (graph) cache.set(region.id, graph);
  }
  return graph;
}

function isLocation(value) {
  return Boolean(value && typeof value === 'object' && (value.id || value.node_id));
}

function locationQuery(value) {
  if (!isLocation(value)) return String(value ?? '').trim();
  return String(value.id || value.name || '').trim();
}

function resolveLocationInGraph(graph, value) {
  if (!graph || !value) return null;
  if (isLocation(value)) {
    const ops = graph.operational_points ?? [];
    return ops.find(op => op.id === value.id)
      ?? ops.find(op => op.node_id === value.node_id)
      ?? (value.name ? resolveOperationalPoint(graph, value.name) : null);
  }
  return resolveOperationalPoint(graph, locationQuery(value));
}

async function loadRegions(regions, cache) {
  const loaded = [];
  for (const region of regions ?? []) {
    const graph = await cachedGraph(region, cache);
    if (graph) loaded.push({ region, graph });
  }
  return loaded;
}

export async function resolveJourneyGraphSet(registry, fromValue, toValue, cache = new Map()) {
  const fromQuery = locationQuery(fromValue);
  const toQuery = locationQuery(toValue);
  if (!fromQuery || !toQuery) return null;

  // Indexed path: location selections define endpoint bundles; the bundle
  // metagraph supplies any intermediate regions. This keeps European routing
  // proportional to the corridor instead of the total number of bundles.
  if (isLocation(fromValue) && isLocation(toValue)) {
    const corridor = resolveBundlePathForLocations(registry, fromValue, toValue);
    if (corridor?.length) {
      const loaded = await loadRegions(corridor, cache);
      if (loaded.length !== corridor.length) return null;
      const graph = loaded.length === 1 ? loaded[0].graph : mergeJourneyBundles(loaded.map(item => item.graph));
      const from = resolveLocationInGraph(graph, fromValue);
      const to = resolveLocationInGraph(graph, toValue);
      if (from && to) {
        return {
          regions: loaded.map(item => item.region),
          graph,
          from,
          to,
          endpointRegions: {
            from: loaded.find(item => resolveLocationInGraph(item.graph, fromValue))?.region ?? null,
            to: loaded.find(item => resolveLocationInGraph(item.graph, toValue))?.region ?? null,
          },
        };
      }
    }
  }

  // Compatibility path for free text while the location index is incomplete.
  const loaded = [];
  let fromMatch = null;
  let toMatch = null;
  for (const region of graphRegions(registry)) {
    const graph = await cachedGraph(region, cache);
    if (!graph) continue;
    loaded.push({ region, graph });
    const from = resolveLocationInGraph(graph, fromValue);
    const to = resolveLocationInGraph(graph, toValue);
    if (from && to) return { regions: [region], graph, from, to };
    if (!fromMatch && from) fromMatch = { region, graph, point: from };
    if (!toMatch && to) toMatch = { region, graph, point: to };
  }
  if (!fromMatch || !toMatch) return null;
  const graph = mergeJourneyBundles(loaded.map(item => item.graph));
  const from = resolveLocationInGraph(graph, fromValue);
  const to = resolveLocationInGraph(graph, toValue);
  if (!from || !to) return null;
  return { regions: loaded.map(item => item.region), graph, from, to, endpointRegions: { from: fromMatch.region, to: toMatch.region } };
}

export async function resolveJourneyGraph(registry, fromValue, toValue, cache = new Map()) {
  const result = await resolveJourneyGraphSet(registry, fromValue, toValue, cache);
  if (!result) return null;
  return { ...result, region: result.regions[0] ?? null };
}
