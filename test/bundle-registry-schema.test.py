#!/usr/bin/env python3
import json
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = ROOT / "schema" / "railatlas.bundles.schema.json"
REGISTRY = ROOT / "data" / "bundles.json"

schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
registry = json.loads(REGISTRY.read_text(encoding="utf-8"))

validator = Draft202012Validator(schema, format_checker=FormatChecker())
errors = sorted(validator.iter_errors(registry), key=lambda error: list(error.absolute_path))
if errors:
    for error in errors:
        path = ".".join(str(part) for part in error.absolute_path) or "<root>"
        print(f"{path}: {error.message}")
    raise SystemExit(1)

print(f"bundle registry schema ok: {len(registry.get('bundles', []))} bundle(s)")
