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
    def test_xml_fixture_builds_topology_attributes_and_location_index(self):
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "graph.json"
            locations = Path(tmp) / "locations.json"
            subprocess.run([
                sys.executable, str(BUILDER), str(FIXTURE), str(out),
                "--region", "test-mini", "--country", "DE",
                "--location-index", str(locations)
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

            self.assertIn("osm:n3", {n["id"] for n in graph["nodes"]})
            alpha = next(op for op in graph["operational_points"] if op["name"] == "Alpha")
            self.assertEqual(alpha["node_id"], "osm:n2")
            bravo = next(op for op in graph["operational_points"] if op["name"] == "Bravo Halt")
            self.assertTrue(bravo["node_id"].startswith("osm:n"))

            way101_nodes = {e["from"] for e in edges if e["source_refs"]["osm_way_id"] == 101} | {e["to"] for e in edges if e["source_refs"]["osm_way_id"] == 101}
            way102_nodes = {e["from"] for e in edges if e["source_refs"]["osm_way_id"] == 102} | {e["to"] for e in edges if e["source_refs"]["osm_way_id"] == 102}
            self.assertTrue(way101_nodes.isdisjoint(way102_nodes))

            index = json.loads(locations.read_text(encoding="utf-8"))
            self.assertEqual(index["schema"], "railatlas.locations/1")
            alpha_location = next(x for x in index["locations"] if x["name"] == "Alpha")
            self.assertEqual(alpha_location["bundle_ids"], ["test-mini"])
            self.assertEqual(alpha_location["country"], "DE")
            self.assertEqual(alpha_location["node_id"], "osm:n2")
            self.assertEqual(alpha_location["identifiers"]["osm"], ["2"])

if __name__ == "__main__":
    unittest.main()
