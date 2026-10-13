import { graphRegions, loadGraphForRegion } from './region-loader.js';
import { matchLocationToOperationalPoints } from './location-crosswalk.js';
import { distanceMeters, nearestRailAccess } from './rail-access.js';

function coordinates(location) {
  if (Array.isArray(location?.location) && location.location.length >= 2) {
    const lon = Number(location.location[0]), lat = Number(location.location[1]);
    if (Number.isFinite(lon) && Number.isFinite(lat)) return { lon, lat };
  }
  const lon = Number(location?.lon), lat = Number(location?.lat);
  return Number.isFinite(lon) && Number.isFinite(lat) ? { lon, lat } : null;
}

function bboxNear(region, lon, lat, radiusMeters) {
  if (!region?.bbox) return false;
  const [west, south, east, north] = region.bbox;
  const latDelta = radiusMeters / 111320;
  const lonDelta = radiusMeters / Math.max(1000, 111320 * Math.cos(lat * Math.PI / 180));
  return lon >= west - lonDelta && lon <= east + lonDelta && lat >= south - latDelta && lat <= north + latDelta;
}

async function cachedGraph(region, cache, loadGraph) {
  if (cache.has(region.id)) return cache.get(region.id);
  const graph = await loadGraph(region);
  if (graph) cache.set(region.id, graph);
  return graph;
}

function operationalPointsWithCoordinates(graph) {
  const nodes = new Map((graph.nodes ?? []).map(node => [node.id, node]));
  return (graph.operational_points ?? []).map(op => {
    const node = nodes.get(op.node_id);
    return {
      ...op,
      location: op.location ?? (node ? [node.lon, node.lat] : undefined),
      lon: op.lon ?? node?.lon,
      lat: op.lat ?? node?.lat
    };
  });
}

/** Bind a selected catalog item to a routable graph OP without loading unrelated Europe bundles. */
export async function resolveLocationToGraph(registry, location, cache = new Map(), {
  maxMatchDistanceMeters = 1500,
  maxAccessDistanceMeters = 30000,
  loadGraph = loadGraphForRegion
} = {}) {
  if (!location || typeof location !== 'object') return { status: 'text', location };

  if (location.type === 'position' || String(location.id ?? '').startsWith('geo:')) {
    return nearestRailAccess(registry, location, cache, { maxDistanceMeters: maxAccessDistanceMeters, loadGraph });
  }

  if (location.node_id && location.graph_status === 'routable' && location.bundle_ids?.length) {
    return { status: 'routable', location, region: graphRegions(registry).find(region => location.bundle_ids.includes(region.id)) ?? null };
  }

  const available = graphRegions(registry);
  const explicitIds = location.bundle_ids ?? [];
  const point = coordinates(location);
  const explicitCandidates = explicitIds.length ? available.filter(region => explicitIds.includes(region.id)) : [];
  const candidates = explicitCandidates.length
    ? explicitCandidates
    : point ? available.filter(region => bboxNear(region, point.lon, point.lat, maxMatchDistanceMeters)) : [];
  if (!candidates.length) {
    return { status: 'catalog_only', location, reason: explicitIds.length ? 'bundle-not-available' : 'no-nearby-graph-bundle' };
  }

  const matches = [];
  for (const region of candidates) {
    const graph = await cachedGraph(region, cache, loadGraph);
    if (!graph) continue;
    const ops = operationalPointsWithCoordinates(graph);
    const result = matchLocationToOperationalPoints(location, ops, { maxDistanceMeters: maxMatchDistanceMeters });
    for (const op of result.matches) {
      const opPoint = coordinates(op);
      const distance = point && opPoint ? distanceMeters(point.lon, point.lat, opPoint.lon, opPoint.lat) : null;
      matches.push({ region, op, method: result.method, distanceMeters: distance });
    }
  }

  const unique = new Map();
  for (const match of matches) {
    const key = match.op.id || match.op.source_refs?.osm_node_id || match.op.node_id;
    if (!unique.has(key)) unique.set(key, { ...match, regions: [match.region] });
    else if (!unique.get(key).regions.some(region => region.id === match.region.id)) unique.get(key).regions.push(match.region);
  }

  if (!unique.size) return { status: 'catalog_only', location, reason: 'no-operational-point-match' };
  if (unique.size > 1) {
    return { status: 'ambiguous', location, candidates: [...unique.values()].map(match => ({ id: match.op.id, name: match.op.name, regionId: match.region.id, distanceMeters: match.distanceMeters })) };
  }

  const match = [...unique.values()][0];
  const regionIds = match.regions.map(region => region.id);
  const boundLocation = {
    ...location,
    node_id: match.op.node_id,
    bundle_ids: [...new Set(regionIds)],
    graph_status: 'routable',
    graph_match_method: match.method,
    graph_operational_point_ids: [match.op.id],
    matched_operational_point: { id: match.op.id, name: match.op.name, node_id: match.op.node_id }
  };
  return { status: 'routable', location: boundLocation, region: match.region, operationalPoint: match.op, distanceMeters: match.distanceMeters, matchMethod: match.method };
}
