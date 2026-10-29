#!/usr/bin/env bash
set -euo pipefail

latest_url="https://download.geofabrik.de/europe/germany/baden-wuerttemberg/stuttgart-regbez-latest.osm.pbf"
directory_url="https://download.geofabrik.de/europe/germany/baden-wuerttemberg/"
pbf="/tmp/stuttgart-regbez.osm.pbf"
graph="data/de-bw-stuttgart.graph.json"
qa="/tmp/de-bw-stuttgart-graph-qa.json"
trap 'rm -f "$pbf"' EXIT

resolve_snapshot_url() {
  local resolved_url resolved_name index snapshot_name

  resolved_url="$(curl --fail --head --location --silent --show-error --retry 3 --retry-delay 5 \
    --output /dev/null --write-out '%{url_effective}' "$latest_url" || true)"
  resolved_name="$(basename "${resolved_url%%\?*}")"
  if [[ "$resolved_name" =~ ^stuttgart-regbez-[0-9]{6}\.osm\.pbf$ ]]; then
    printf '%s\n' "$resolved_url"
    return 0
  fi

  # Some mirrors/proxies may keep the stable -latest URL instead of exposing
  # the redirect target. Fall back to Geofabrik's own directory index, but
  # still select and download an immutable dated artifact.
  index="$(curl --fail --silent --show-error --retry 3 --retry-delay 5 "$directory_url")"
  snapshot_name="$(printf '%s' "$index" \
    | grep -Eo 'stuttgart-regbez-[0-9]{6}\.osm\.pbf' \
    | sort -u \
    | tail -n 1 || true)"
  if [[ ! "$snapshot_name" =~ ^stuttgart-regbez-[0-9]{6}\.osm\.pbf$ ]]; then
    echo "Could not resolve a dated Geofabrik snapshot from $latest_url or $directory_url" >&2
    return 1
  fi

  printf '%s%s\n' "$directory_url" "$snapshot_name"
}

source_url="$(resolve_snapshot_url)"
source_name="$(basename "${source_url%%\?*}")"
snapshot="${source_name#stuttgart-regbez-}"
snapshot="${snapshot%.osm.pbf}"
if [[ ! "$snapshot" =~ ^[0-9]{6}$ ]]; then
  echo "Could not pin Geofabrik snapshot URL: $source_url" >&2
  exit 1
fi
source_date="20${snapshot:0:2}-${snapshot:2:2}-${snapshot:4:2}"

echo "Downloading pinned OSM snapshot $source_date ($source_url)"
curl --fail --location --silent --show-error --retry 3 --retry-delay 5 --output "$pbf" "$source_url"

echo "Building from OSM snapshot $source_date ($source_url)"
python3 tools/osm_pbf_builder.py "$pbf" "$graph" \
  --region de-bw-stuttgart --country DE \
  --source-url "$source_url" --source-date "$source_date"
python3 tools/graph_qa.py "$graph" --json "$qa"
python3 tools/route_smoke.py "$graph"
