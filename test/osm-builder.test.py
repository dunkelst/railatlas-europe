import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILDER = ROOT / "tools" / "osm_pbf_builder.py"
FIXTURE = ROOT / "test" / "fixtures" / "rail-mini.osm"

class OsmBuilderTest(unittest.TestCase):
    def test_xml_fixture_builds_topology_and_attributes(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "graph.json"
            subprocess.run([
                sys.executable, str(BUILDER), str(FIXTURE), str(out),
                "--region", "test-mini", "--country", "DE"
            ], check=True, cwd=ROOT)

            graph = json.loads(out.read_text(encoding="utf-8"))
            self.assertEqual(graph["schema"], "railatlas.graph/1")
            self.assertEqual(graph["region"], "test-mini")
            self.assertEqual(graph["source_metadata"]["status"], "osm-derived")

            edges = graph["edges"]
            self.assertGreaterEqual(len(edges), 8)
            way100 = [e for e in edges if e["source_refs"]["osm_way_id"] == 100]
            self.assertTrue(way100)
            infra = way100[0]["infrastructure"]
            self.assertEqual(infra["tracks"], 2)
            self.assertEqual(infra["gauge_mm"], 1435)
            self.assertEqual(infra["voltage_v"], 15000)
            self.assertEqual(infra["frequency_hz"], 16.7)
            self.assertEqual(infra["maxspeed_kmh"], 160)
            self.assertEqual(infra["line_ref"], "4711")

            # Shared node 3 creates a graph junction.
            self.assertIn("osm:n3", {n["id"] for n in graph["nodes"]})

            # Station 2 lies on the track and must be a split/routing node.
            alpha = next(op for op in graph["operational_points"] if op["name"] == "Alpha")
            self.assertEqual(alpha["node_id"], "osm:n2")

            # Off-track halt snaps to a real rail node, not a geometric crossing.
            bravo = next(op for op in graph["operational_points"] if op["name"] == "Bravo Halt")
            self.assertTrue(bravo["node_id"].startswith("osm:n"))

            # Way 102 crosses geometrically but shares no node ID with way 101.
            way101_nodes = {
                e["from"] for e in edges if e["source_refs"]["osm_way_id"] == 101
            } | {
                e["to"] for e in edges if e["source_refs"]["osm_way_id"] == 101
            }
            way102_nodes = {
                e["from"] for e in edges if e["source_refs"]["osm_way_id"] == 102
            } | {
                e["to"] for e in edges if e["source_refs"]["osm_way_id"] == 102
            }
            self.assertTrue(way101_nodes.isdisjoint(way102_nodes))

if __name__ == "__main__":
    unittest.main()
