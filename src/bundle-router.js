function routableRegions(registry) {
  return (registry?.levels ?? []).filter(region => region?.graph);
}

function regionMap(registry) {
  return new Map(routableRegions(registry).map(region => [region.id, region]));
}

/** Return the shortest declared bundle path between two routing regions.
 *
 * Regions declare `neighbors: [regionId, ...]`.  The graph is intentionally
 * tiny and metadata-only: it decides which rail bundles must be fetched, not
 * how trains run inside them.
 */
export function resolveBundlePath(registry, fromId, toId) {
  if (!fromId || !toId) return null;
  const byId = regionMap(registry);
  if (!byId.has(fromId) || !byId.has(toId)) return null;
  if (fromId === toId) return [byId.get(fromId)];

  const queue = [fromId];
  const previous = new Map([[fromId, null]]);
  while (queue.length) {
    const id = queue.shift();
    const region = byId.get(id);
    for (const next of region?.neighbors ?? []) {
      if (!byId.has(next) || previous.has(next)) continue;
      previous.set(next, id);
      if (next === toId) {
        const ids = [];
        for (let cursor = toId; cursor != null; cursor = previous.get(cursor)) ids.push(cursor);
        return ids.reverse().map(regionId => byId.get(regionId));
      }
      queue.push(next);
    }
  }
  return null;
}

export function resolveBundlePathForLocations(registry, fromLocation, toLocation) {
  const fromIds = fromLocation?.bundle_ids ?? [];
  const toIds = toLocation?.bundle_ids ?? [];
  let best = null;
  for (const fromId of fromIds) {
    for (const toId of toIds) {
      const path = resolveBundlePath(registry, fromId, toId);
      if (path && (!best || path.length < best.length)) best = path;
    }
  }
  return best;
}
