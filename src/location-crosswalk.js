function values(object, key) {
  const value = object?.identifiers?.[key];
  if (Array.isArray(value)) return value.map(String);
  return value == null ? [] : [String(value)];
}

function fold(value) {
  return String(value ?? '').normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function coords(item) {
  const loc = item?.location;
  if (Array.isArray(loc) && loc.length >= 2) return [Number(loc[0]), Number(loc[1])];
  if (item?.lon != null && item?.lat != null) return [Number(item.lon), Number(item.lat)];
  return null;
}

function distanceMeters(a, b) {
  const ca = coords(a), cb = coords(b);
  if (!ca || !cb || ca.some(Number.isNaN) || cb.some(Number.isNaN)) return Infinity;
  const r = 6371000, p1 = ca[1] * Math.PI / 180, p2 = cb[1] * Math.PI / 180;
  const dp = (cb[1] - ca[1]) * Math.PI / 180, dl = (cb[0] - ca[0]) * Math.PI / 180;
  const h = Math.sin(dp/2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(h));
}

const ID_PRIORITY = ['ifopt', 'uic', 'eva', 'db', 'cff', 'obb', 'sncf', 'renfe', 'osm'];

export function matchLocationToOperationalPoints(location, operationalPoints, { maxDistanceMeters = 1500 } = {}) {
  for (const key of ID_PRIORITY) {
    const wanted = new Set(values(location, key));
    if (!wanted.size) continue;
    const matches = operationalPoints.filter(op => values(op, key).some(id => wanted.has(id)));
    if (matches.length) return { status: matches.length === 1 ? 'routable' : 'ambiguous', method: key, matches };
  }

  const name = fold(location?.name);
  if (name) {
    const matches = operationalPoints
      .map(op => ({ op, distance: distanceMeters(location, op) }))
      .filter(x => x.distance <= maxDistanceMeters && [x.op?.name, ...(x.op?.aliases ?? [])].some(n => fold(n) === name))
      .sort((a, b) => a.distance - b.distance);
    if (matches.length) return { status: matches.length === 1 ? 'routable' : 'ambiguous', method: 'name+distance', distance_m: matches[0].distance, matches: matches.map(x => x.op) };
  }
  return { status: 'catalog_only', method: null, matches: [] };
}

export function bindLocationToGraph(location, graph, options) {
  const result = matchLocationToOperationalPoints(location, graph?.operational_points ?? [], options);
  const bundleIds = new Set(location?.bundle_ids ?? []);
  if (result.status === 'routable' && graph?.region) bundleIds.add(graph.region);
  return { ...location, graph_status: result.status, graph_match_method: result.method, graph_operational_point_ids: result.matches.map(op => op.id), bundle_ids: [...bundleIds] };
}
