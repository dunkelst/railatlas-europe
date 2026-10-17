let registryPromise;
const graphPromises = new Map();

export async function loadRegionRegistry() {
  if (!registryPromise) {
    registryPromise = Promise.all([
      fetch('./data/regions.json').then(response => {
        if (!response.ok) throw new Error(`Region registry could not be loaded: ${response.status}`);
        return response.json();
      }),
      fetch('./data/bundles.json').then(response => {
        if (!response.ok) throw new Error(`Bundle registry could not be loaded: ${response.status}`);
        return response.json();
      }),
    ]).then(([regions, bundles]) => ({ ...regions, bundles: bundles.bundles ?? [] }));
  }
  return registryPromise;
}

export function regionsForZoom(registry, zoom) {
  return (registry.levels ?? []).filter(region =>
    zoom >= region.min_zoom && zoom <= region.max_zoom
  );
}

// Routing must not depend on the current map viewport. Production bundles are
// preferred; legacy level graphs remain available as regression fixtures.
export function graphRegions(registry) {
  const bundles = (registry?.bundles ?? []).filter(bundle => Boolean(bundle.graph));
  const legacy = (registry?.levels ?? []).filter(region => Boolean(region.graph));
  return [...bundles, ...legacy.filter(region => !bundles.some(bundle => bundle.id === region.id))];
}

export function regionContaining(registry, lon, lat, zoom, options = {}) {
  const { requireGraph = false } = options;

  const candidates = regionsForZoom(registry, zoom)
    .filter(region => {
      if (requireGraph && !region.graph) return false;
      if (!region.bbox) return false;
      const [west, south, east, north] = region.bbox;
      return lon >= west && lon <= east && lat >= south && lat <= north;
    })
    .sort((a, b) => (b.min_zoom ?? 0) - (a.min_zoom ?? 0));

  return candidates[0] ?? null;
}

export function graphRegionContaining(registry, lon, lat, zoom) {
  const production = (registry?.bundles ?? []).filter(bundle => {
    if (!bundle.graph || !bundle.bbox) return false;
    const [west, south, east, north] = bundle.bbox;
    return lon >= west && lon <= east && lat >= south && lat <= north;
  });
  if (production.length) return production[0];
  return regionContaining(registry, lon, lat, zoom, { requireGraph: true });
}

export async function loadGraphForRegion(region) {
  if (!region?.graph) return null;
  const key = region.graph;
  if (!graphPromises.has(key)) {
    graphPromises.set(key, fetch(`./data/${key}`).then(response => {
      if (!response.ok) throw new Error(`Graph bundle could not be loaded: ${response.status}`);
      return response.json();
    }).catch(error => {
      graphPromises.delete(key);
      throw error;
    }));
  }
  return graphPromises.get(key);
}

/** Load only the graph shards selected by the bundle metagraph path. */
export async function loadGraphsForBundlePath(path) {
  const regions = (path ?? []).filter(region => region?.graph);
  return Promise.all(regions.map(loadGraphForRegion));
}
