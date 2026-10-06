import { resolveOperationalPoint } from './routing.js';
import { graphRegions, loadGraphForRegion } from './region-loader.js';
import { mergeJourneyBundles } from './bundle-graph.js';

async function cachedGraph(region, cache) {
  let graph = cache.get(region.id);
  if (!graph) {
    graph = await loadGraphForRegion(region);
    if (graph) cache.set(region.id, graph);
  }
  return graph;
}

/**
 * Resolve a JourneyRequest independently of map state.
 *
 * Fast path: return one bundle when it contains both endpoints.
 * Multi-bundle path: endpoints may live in different bundles. For now all
 * routable bundles between discovery endpoints are merged; bundle-neighbour
 * path selection can later reduce this set without changing the caller API.
 */
export async function resolveJourneyGraphSet(registry, fromText, toText, cache = new Map()) {
  const fromQuery = String(fromText ?? '').trim();
  const toQuery = String(toText ?? '').trim();
  if (!fromQuery || !toQuery) return null;

  const loaded = [];
  let fromMatch = null;
  let toMatch = null;

  for (const region of graphRegions(registry)) {
    const graph = await cachedGraph(region, cache);
    if (!graph) continue;
    loaded.push({ region, graph });

    const from = resolveOperationalPoint(graph, fromQuery);
    const to = resolveOperationalPoint(graph, toQuery);

    if (from && to) {
      return { regions: [region], graph, from, to };
    }
    if (!fromMatch && from) fromMatch = { region, graph, point: from };
    if (!toMatch && to) toMatch = { region, graph, point: to };
  }

  if (!fromMatch || !toMatch) return null;

  const graph = mergeJourneyBundles(loaded.map(item => item.graph));
  const from = resolveOperationalPoint(graph, fromQuery);
  const to = resolveOperationalPoint(graph, toQuery);
  if (!from || !to) return null;

  return {
    regions: loaded.map(item => item.region),
    graph,
    from,
    to,
    endpointRegions: { from: fromMatch.region, to: toMatch.region },
  };
}

// Backwards-compatible entry point for the current UI.
export async function resolveJourneyGraph(registry, fromText, toText, cache = new Map()) {
  const result = await resolveJourneyGraphSet(registry, fromText, toText, cache);
  if (!result) return null;
  return { ...result, region: result.regions[0] ?? null };
}
