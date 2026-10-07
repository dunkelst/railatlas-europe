# RailAtlas bundle manifest v1

Bundle manifests are generated build artifacts that sit between raw RailGraph files and the Europe-scale bundle metagraph. They keep topology discovery out of the hand-maintained region registry.

```json
{
  "schema": "railatlas.bundle/1",
  "id": "de-bw-stuttgart",
  "graph": "railgraph-de-bw-stuttgart.json",
  "bbox": [8.8, 48.6, 9.4, 49.1],
  "node_count": 0,
  "edge_count": 0,
  "operational_point_count": 0,
  "boundary_nodes": [
    {"node_id":"osm:n123", "osm_node_id":123}
  ],
  "neighbors": [
    {"bundle_id":"de-bw-north", "shared_boundary_nodes":["osm:n123"]}
  ],
  "source": {},
  "qa": {}
}
```

## Build contract

* `id` MUST equal the RailGraph `region`.
* `bbox`, counts and `source` MUST be generated from the graph, not maintained manually.
* `boundary_nodes` MUST use stable physical source identifiers. For OSM-derived bundles this is the OSM node id.
* `neighbors` MUST be derived by comparing boundary/source-node identities between manifests. They are not authored by hand.
* A bundle may be published only after Graph QA succeeds. QA summary data SHOULD be embedded in the manifest.
* The location index references bundle ids; it does not encode inter-bundle topology.

## Europe-scale loading

Runtime resolution is: location/OP -> endpoint bundle ids -> manifest metagraph -> required bundle chain -> RailGraph stitch -> physical route. Timetable providers join at OP identifiers (EVA/UIC/IFOPT) and remain separate from physical topology.

## Next implementation

1. Add `--manifest` and optional geographic boundary input to `tools/osm_pbf_builder.py`.
2. Mark graph nodes on the extract boundary and emit their stable OSM ids.
3. Add a manifest-index builder that derives reciprocal neighbors from matching boundary ids.
4. Make `regions.json` a discovery/catalog layer; use generated manifests for connectivity.
5. Run the pipeline on the first real second bundle, Heilbronn/Stuttgart, before adding more regions.
