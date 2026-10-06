function sourceNodeKey(node) {
  const osm = node?.source_refs?.osm_node_id;
  return osm == null ? null : `osm:n${osm}`;
}

/**
 * Merge independently-built RailAtlas graph bundles into one journey graph.
 * OSM-derived bundles stitch deterministically through shared OSM node IDs.
 * IDs are preserved, so routing.js can operate on the result unchanged.
 */
export function mergeJourneyBundles(bundles) {
  const graphs = (bundles ?? []).filter(Boolean);
  const nodes = new Map();
  const edges = new Map();
  const operationalPoints = new Map();
  const canonicalNodeIds = new Map();

  for (const graph of graphs) {
    for (const node of graph.nodes ?? []) {
      const sourceKey = sourceNodeKey(node) ?? node.id;
      const canonicalId = canonicalNodeIds.get(sourceKey) ?? node.id;
      canonicalNodeIds.set(sourceKey, canonicalId);
      if (!nodes.has(canonicalId)) nodes.set(canonicalId, { ...node, id: canonicalId });
    }
  }

  for (const graph of graphs) {
    const localNodeMap = new Map();
    for (const node of graph.nodes ?? []) {
      const sourceKey = sourceNodeKey(node) ?? node.id;
      localNodeMap.set(node.id, canonicalNodeIds.get(sourceKey) ?? node.id);
    }

    for (const edge of graph.edges ?? []) {
      const from = localNodeMap.get(edge.from) ?? edge.from;
      const to = localNodeMap.get(edge.to) ?? edge.to;
      const id = `${graph.region ?? 'bundle'}:${edge.id}`;
      edges.set(id, { ...edge, id, from, to });
    }

    for (const op of graph.operational_points ?? []) {
      const node_id = localNodeMap.get(op.node_id) ?? op.node_id;
      const existing = operationalPoints.get(op.id);
      operationalPoints.set(op.id, existing ? { ...existing, ...op, node_id } : { ...op, node_id });
    }
  }

  return {
    schema: 'railatlas.graph/1',
    region: graphs.map(graph => graph.region).filter(Boolean).join('+') || 'journey',
    nodes: [...nodes.values()],
    edges: [...edges.values()],
    operational_points: [...operationalPoints.values()],
    source_metadata: {
      status: 'virtual-journey-graph',
      bundles: graphs.map(graph => graph.region).filter(Boolean),
      stitch_key: 'source_refs.osm_node_id',
    },
  };
}
