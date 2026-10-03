export function buildAdjacency(graph) {
  const adjacency = new Map();
  for (const node of graph.nodes ?? []) adjacency.set(node.id, []);
  for (const edge of graph.edges ?? []) {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, []);
    adjacency.get(edge.from).push(edge);
  }
  return adjacency;
}

export function dijkstra(graph, startNodeId, endNodeId) {
  const adjacency = buildAdjacency(graph);
  const dist = new Map();
  const prev = new Map();
  const prevEdge = new Map();
  const queue = new Set();

  for (const node of graph.nodes ?? []) {
    dist.set(node.id, Infinity);
    queue.add(node.id);
  }
  if (!dist.has(startNodeId) || !dist.has(endNodeId)) {
    throw new Error('Start or target node is missing from graph');
  }
  dist.set(startNodeId, 0);

  while (queue.size) {
    let current = null;
    let best = Infinity;
    for (const nodeId of queue) {
      const d = dist.get(nodeId);
      if (d < best) {
        best = d;
        current = nodeId;
      }
    }

    if (current === null || best === Infinity) break;
    queue.delete(current);
    if (current === endNodeId) break;

    for (const edge of adjacency.get(current) ?? []) {
      if (!queue.has(edge.to)) continue;
      const weight = Number.isFinite(edge.routing_cost) ? edge.routing_cost : edge.length_m;
      if (!Number.isFinite(weight) || weight < 0) continue;
      const alt = best + weight;
      if (alt < dist.get(edge.to)) {
        dist.set(edge.to, alt);
        prev.set(edge.to, current);
        prevEdge.set(edge.to, edge.id);
      }
    }
  }

  if (!Number.isFinite(dist.get(endNodeId))) return null;

  const nodeIds = [];
  const edgeIds = [];
  let cursor = endNodeId;
  while (cursor !== undefined) {
    nodeIds.push(cursor);
    if (cursor === startNodeId) break;
    const edgeId = prevEdge.get(cursor);
    if (!edgeId) return null;
    edgeIds.push(edgeId);
    cursor = prev.get(cursor);
  }

  nodeIds.reverse();
  edgeIds.reverse();
  const edgeMap = new Map((graph.edges ?? []).map(edge => [edge.id, edge]));
  const edges = edgeIds.map(id => edgeMap.get(id));
  return {
    nodeIds,
    edgeIds,
    edges,
    routingCost: dist.get(endNodeId),
    distanceM: edges.reduce((sum, edge) => sum + (edge?.length_m ?? 0), 0)
  };
}

export function resolveOperationalPoint(graph, query) {
  const q = query.trim().toLocaleLowerCase();
  return (graph.operational_points ?? []).find(op =>
    op.name.toLocaleLowerCase() === q ||
    (op.aliases ?? []).some(alias => alias.toLocaleLowerCase() === q)
  ) ?? null;
}

export function routeGeometry(routeResult) {
  if (!routeResult) return [];
  const points = [];
  for (const edge of routeResult.edges) {
    for (const coord of edge.geometry ?? []) {
      const latLon = [coord[1], coord[0]];
      const last = points.at(-1);
      if (!last || last[0] !== latLon[0] || last[1] !== latLon[1]) points.push(latLon);
    }
  }
  return points;
}
