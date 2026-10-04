let registryPromise;

export async function loadRegionRegistry() {
  if (!registryPromise) {
    registryPromise = fetch('./data/regions.json').then(response => {
      if (!response.ok) throw new Error(`Region registry could not be loaded: ${response.status}`);
      return response.json();
    });
  }
  return registryPromise;
}

export function regionsForZoom(registry, zoom) {
  return (registry.levels ?? []).filter(region =>
    zoom >= region.min_zoom && zoom <= region.max_zoom
  );
}

// Routing must not depend on the current map viewport. This list is the
// canonical set of graph bundles available to a JourneyRequest.
export function graphRegions(registry) {
  return (registry?.levels ?? []).filter(region => Boolean(region.graph));
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
  return regionContaining(registry, lon, lat, zoom, { requireGraph: true });
}

export async function loadGraphForRegion(region) {
  if (!region?.graph) return null;
  const response = await fetch(`./data/${region.graph}`);
  if (!response.ok) throw new Error(`Graph bundle could not be loaded: ${response.status}`);
  return response.json();
}
