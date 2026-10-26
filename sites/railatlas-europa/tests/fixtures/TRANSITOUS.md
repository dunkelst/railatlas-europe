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

API policy: https://transitous.org/api/. Existing public source code alone is
not an open-source licence. The RailAtlas owner has not yet approved such a
licence. Do not activate this prototype as the application's public source or
contact the service maintainers without the owner's instruction.
