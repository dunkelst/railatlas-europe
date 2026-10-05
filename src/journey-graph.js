import { resolveOperationalPoint } from './routing.js';
import { graphRegions, loadGraphForRegion } from './region-loader.js';

/**
 * Resolve a JourneyRequest against routing bundles, independently of map state.
 * Returns the first bundle containing both endpoints. The injected cache is
 * shared with the atlas loader so bundles are fetched only once.
 */
export async function resolveJourneyGraph(registry, fromText, toText, cache = new Map()) {
  const fromQuery = String(fromText ?? '').trim();
  const toQuery = String(toText ?? '').trim();
  if (!fromQuery || !toQuery) return null;

  for (const region of graphRegions(registry)) {
    let graph = cache.get(region.id);
    if (!graph) {
      graph = await loadGraphForRegion(region);
      if (!graph) continue;
      cache.set(region.id, graph);
    }

    const from = resolveOperationalPoint(graph, fromQuery);
    const to = resolveOperationalPoint(graph, toQuery);
    if (from && to) return { region, graph, from, to };
  }

  return null;
}
