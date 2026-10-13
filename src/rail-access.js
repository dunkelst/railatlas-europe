import { graphRegions, loadGraphForRegion } from './region-loader.js';

function coordinates(location) {
  if (Array.isArray(location?.location) && location.location.length >= 2) {
    const lon = Number(location.location[0]), lat = Number(location.location[1]);
    if (Number.isFinite(lon) && Number.isFinite(lat)) return { lon, lat };
  }
  const lon = Number(location?.lon), lat = Number(location?.lat);
  return Number.isFinite(lon) && Number.isFinite(lat) ? { lon, lat } : null;
}

export function distanceMeters(lon1, lat1, lon2, lat2) {
  const radians = Math.PI / 180;
  const p1 = lat1 * radians, p2 = lat2 * radians;
  const dp = (lat2 - lat1) * radians, dl = (lon2 - lon1) * radians;
  const h = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
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

function pointForOperationalPoint(op, nodes) {
  if (Array.isArray(op.location) && op.location.length >= 2) {
    const lon = Number(op.location[0]), lat = Number(op.location[1]);
    if (Number.isFinite(lon) && Number.isFinite(lat)) return { lon, lat };
  }
  if (op.lon != null && op.lat != null) {
    const lon = Number(op.lon), lat = Number(op.lat);
    if (Number.isFinite(lon) && Number.isFinite(lat)) return { lon, lat };
  }
  const node = nodes.get(op.node_id);
  if (!node) return null;
  const lon = Number(node.lon), lat = Number(node.lat);
  return Number.isFinite(lon) && Number.isFinite(lat) ? { lon, lat } : null;
}

/** Snap a GPS position to the nearest connected operational point in nearby graph bundles. */
export async function nearestRailAccess(registry, location, cache = new Map(), {
  maxDistanceMeters = 30000,
  loadGraph = loadGraphForRegion
} = {}) {
  const origin = coordinates(location);
  if (!origin) return { status: 'invalid_location', location, reason: 'missing-coordinates' };

  const regions = graphRegions(registry).filter(region => bboxNear(region, origin.lon, origin.lat, maxDistanceMeters));
  if (!regions.length) {
    return { status: 'no_access', location, maxDistanceMeters, reason: 'no-nearby-graph-bundle', nearest: null };
  }

  let best = null;
  for (const region of regions) {
    const graph = await cachedGraph(region, cache, loadGraph);
    if (!graph) continue;
    const nodes = new Map((graph.nodes ?? []).map(node => [node.id, node]));
    const connected = new Set();
    for (const edge of graph.edges ?? []) {
      connected.add(edge.from);
      connected.add(edge.to);
    }
    for (const op of graph.operational_points ?? []) {
      if (!op.node_id || !connected.has(op.node_id)) continue;
      const point = pointForOperationalPoint(op, nodes);
      if (!point) continue;
      const distance = distanceMeters(origin.lon, origin.lat, point.lon, point.lat);
      if (!best || distance < best.distanceMeters) best = { region, graph, operationalPoint: op, point, distanceMeters: distance };
    }
  }

  if (!best || best.distanceMeters > maxDistanceMeters) {
    return {
      status: 'no_access', location, maxDistanceMeters, reason: best ? 'nearest-operational-point-too-far' : 'no-connected-operational-points',
      nearest: best ? { name: best.operationalPoint.name, distanceMeters: best.distanceMeters, regionId: best.region.id } : null
    };
  }

  const op = best.operationalPoint;
  const boundLocation = {
    ...location,
    node_id: op.node_id,
    bundle_ids: [best.region.id],
    graph_status: 'routable',
    graph_match_method: 'nearest-operational-point',
    graph_operational_point_ids: [op.id],
    rail_access: { operational_point_id: op.id, name: op.name, distance_m: Math.round(best.distanceMeters) }
  };
  return { status: 'routable', location: boundLocation, region: best.region, graph: best.graph, operationalPoint: op, distanceMeters: best.distanceMeters };
}
