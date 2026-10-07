import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load_tool(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / "tools" / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


bundle_manifest = load_tool("bundle_manifest")
manifest_index = load_tool("manifest_index")


class BundleManifestTests(unittest.TestCase):
    def test_boundary_nodes_keep_stable_osm_identity(self):
        graph = {
            "region": "a",
            "nodes": [
                {"id": "a:1", "lon": 9.0, "lat": 49.5, "source_refs": {"osm_node_id": 123}},
                {"id": "a:2", "lon": 9.5, "lat": 49.5, "source_refs": {"osm_node_id": 456}},
            ],
            "edges": [],
            "operational_points": [],
        }
        manifest = bundle_manifest.build_manifest(graph, Path("a.json"), [9.0, 49.0, 10.0, 50.0])
        self.assertEqual(manifest["boundary_nodes"], [{"node_id": "a:1", "osm_node_id": 123}])

    def test_index_derives_reciprocal_neighbors_from_shared_osm_node(self):
        a = {"schema": "railatlas.bundle/1", "id": "a", "boundary_nodes": [{"node_id": "a:1", "osm_node_id": 123}]}
        b = {"schema": "railatlas.bundle/1", "id": "b", "boundary_nodes": [{"node_id": "b:9", "osm_node_id": 123}]}
        c = {"schema": "railatlas.bundle/1", "id": "c", "boundary_nodes": [{"node_id": "c:4", "osm_node_id": 999}]}
        index = manifest_index.build_index([a, b, c])
        bundles = {bundle["id"]: bundle for bundle in index["bundles"]}
        self.assertEqual(bundles["a"]["neighbors"], [{"bundle_id": "b", "shared_boundary_nodes": ["a:1"]}])
        self.assertEqual(bundles["b"]["neighbors"], [{"bundle_id": "a", "shared_boundary_nodes": ["b:9"]}])
        self.assertEqual(bundles["c"]["neighbors"], [])

    def test_duplicate_bundle_ids_fail_closed(self):
        manifest = {"schema": "railatlas.bundle/1", "id": "a", "boundary_nodes": []}
        with self.assertRaises(ValueError):
            manifest_index.build_index([manifest, manifest])


if __name__ == "__main__":
    unittest.main()
