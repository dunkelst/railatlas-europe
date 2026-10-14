import importlib.util
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("tiler",ROOT/"tools"/"tile_graph_bundles.py"); tiler=importlib.util.module_from_spec(spec); spec.loader.exec_module(tiler)

class GraphTilerTest(unittest.TestCase):
    def test_cross_tile_edge_creates_neighbours_and_stable_portals(self):
        graph={"region":"source","generated_at":"2026-10-14T00:00:00Z","source_metadata":{"source":"fixture.osm"},
          "nodes":[{"id":"osm:n1","lon":1.9,"lat":50.0,"source_refs":{"osm_node_id":1}},{"id":"osm:n2","lon":2.1,"lat":50.0,"source_refs":{"osm_node_id":2}}],
          "edges":[{"id":"e1","from":"osm:n1","to":"osm:n2"}],
          "operational_points":[{"id":"op1","node_id":"osm:n1","country":"DE"},{"id":"op2","node_id":"osm:n2","country":"DE"}]}
        graphs,portals,neighbours=tiler.tile_graph(graph,2.0)
        self.assertEqual(len(graphs),2)
        ids=sorted(graphs); self.assertIn(ids[1],neighbours[ids[0]]); self.assertIn(ids[0],neighbours[ids[1]])
        self.assertEqual({p["source_ref"] for ps in portals.values() for p in ps},{1,2})
        for g in graphs.values(): self.assertEqual([e["id"] for e in g["edges"]],["e1"])
        reg=tiler.registry(graphs,portals,neighbours)
        self.assertEqual(reg["schema"],"railatlas.bundles/1"); self.assertTrue(all(b["status"]=="routable" for b in reg["bundles"]))

if __name__=="__main__": unittest.main()
