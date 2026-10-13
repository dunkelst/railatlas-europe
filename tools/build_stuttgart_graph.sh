#!/usr/bin/env bash
set -euo pipefail

latest_url="https://download.geofabrik.de/europe/germany/baden-wuerttemberg/stuttgart-regbez-latest.osm.pbf"
pbf="/tmp/stuttgart-regbez.osm.pbf"
graph="data/de-bw-stuttgart.graph.json"
qa="/tmp/de-bw-stuttgart-graph-qa.json"
trap 'rm -f "$pbf"' EXIT

source_url="$(curl --fail --location --silent --show-error --retry 3 --retry-delay 5 --output "$pbf" --write-out '%{url_effective}' "$latest_url")"
snapshot="$(basename "$source_url" | sed -E 's/.*-([0-9]{6})\.osm\.pbf/\1/')"
if [[ ! "$snapshot" =~ ^[0-9]{6}$ ]]; then
  echo "Could not pin Geofabrik snapshot URL: $source_url" >&2
  exit 1
fi
source_date="20${snapshot:0:2}-${snapshot:2:2}-${snapshot:4:2}"
echo "Building from OSM snapshot $source_date ($source_url)"

python3 tools/osm_pbf_builder.py "$pbf" "$graph" \
  --region de-bw-stuttgart --country DE \
  --source-url "$source_url" --source-date "$source_date"
python3 tools/graph_qa.py "$graph" --json "$qa"
python3 tools/route_smoke.py "$graph"
