Manual prototype evidence fetched on 26 October 2026 from the documented
production API at https://api.transitous.org, MOTIS v2.11.4. This prototype is not
connected to the public application. The API policy permits light prototype
testing before the project receives an appropriate open-source licence.

`transitous-heilbronn-sample.json` contains the unmodified seven returned places
from `/api/v6/map/stops`, BUS/grouped, bounding box
49.138,9.224,49.147,9.243. It also retains one unmodified native polyline object
from the experimental map/routes response for
49.1403,9.227,49.1436,9.238. Its precision is six; its route pathSource is ROUTED,
which means calculated geometry, not a source-confirmed bus path. Tests create
synthetic route metadata around that actual polyline to check this distinction.
No fixture is used as runtime data.

Attribution and underlying source licences:

- Transitous data sources: https://transitous.org/sources/.
- DELFI e.V.: CC BY 4.0 according to that source catalogue.
- KVV GmbH: CC0 1.0 according to that source catalogue.
- OpenStreetMap contributors, ODbL 1.0 for the calculated road geometry:
  https://www.openstreetmap.org/copyright.

API policy: https://transitous.org/api/. The RailAtlas owner approved AGPLv3 on
26 October 2026. The stable stop API is now integrated through lib/transitous.mjs;
the experimental calculated-line probe remains disconnected from the public app.
Data and third-party licences remain separate from the project's own code.
Do not contact the service maintainers without the owner's instruction.

`transitous-heilbronn-roemer-plan.json.gz` is the unmodified bounded response
from the stable `/api/v6/plan` endpoint on 26 October 2026. The query used
de-DELFI_de:08121:17:0:0 to de-DELFI_de:08121:175:0:0, departure
2026-10-26T19:51:00Z, three alternatives, routed transfers and no direct-only
journeys. It contains actual DELFI bus schedules and OSM pedestrian paths.
The source licences above apply. Tests mutate copies for negative cases.
No fixture is runtime data. The application's journey fallback now uses this
stable endpoint once after the original sources fail, with cache, cancellation,
size and timeout limits. `/plan` does not identify whether a transit geometry
is a GTFS shape or inferred; since version 28, supplied vehicle paths are
retained with their original points and explicitly marked as unverified
provider paths, rather than being claimed as original GTFS shapes.

`transitous-faro-madrid.json.gz` wraps the unmodified coordinate-plan response,
the unmodified native-stop plan response and the first two unmodified geocoder
records obtained on 27 October 2026, alongside the original catalogue entries.
Both plan requests used departure 2026-10-31T08:00:00Z. The native request starts
at eu-flixbus_9e4eeb3c-2721-4e9d-bc41-63cd76b509a4, selected only after exact
name/country/proximity validation. The original coordinate plan demonstrates
the 245-m unconfirmed access gap; it is not accepted by relaxing point checks.
The native plan demonstrates station-access offsets of 62 m and 44 m in Seville.
Tests retain source coordinates and explicitly partial geometry. Underlying
GTFS providers include Faro, FlixBus, Seville, RENFE and Ouigo; their licences are
listed at https://transitous.org/sources/. Street geometry uses OpenStreetMap,
https://www.openstreetmap.org/copyright. These data are not relicensed by AGPL.

## Tavira-Linienkarte, 28.10.2026

`transitous-tavira-routes.json.gz` ist eine vollständige, unveränderte JSON-
Antwort (nur gzip-komprimiert) von `https://api.transitous.org/api/experimental/map/routes`
mit `min=37.108,-7.69`, `max=37.145,-7.62`, `zoom=14`. 88 Varianten und 567
Polylinien; 55 TIMETABLE-, 26 ROUTED- und sieben NONE-Einträge. Verwendet für
Regressionen zu Linien 42/67, Herkunft, Originalpunkten und fehlender Geometrie.
Keine Testfixture wird als Laufzeitersatz verwendet.

Der Endpunkt steht im offiziellen MOTIS-OpenAPI-Dokument:
https://github.com/motis-project/motis/blob/master/openapi.yaml

Datenquellen und deren Lizenzen: https://transitous.org/sources/ .
Nutzungsrichtlinie: https://transitous.org/api/ . Die öffentliche App ist AGPLv3,
nichtkommerzieller Testbetrieb; begrenzte Ausschnittsabfragen, Cache und
Quellenattribution bleiben aktiv. Die experimentelle API kann sich ändern.
