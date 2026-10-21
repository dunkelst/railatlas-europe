# RailAtlas Europa

Private europäische Reiseplanung für steffen_fun|x. Der frühere feste Demo-Fahrplan wurde vollständig ersetzt.

## Funktionsumfang

- 54.114 katalogisierte Bahnhöfe und Halte aus 38 Ländern, inklusive lokaler Autovervollständigung, Akzentnormalisierung und HN/WÜ-Kürzeln.
- Auswahl per Maus, Touch oder Pfeiltasten/Enter. Lokale Vorschläge erscheinen sofort; ab drei Zeichen ergänzt der Fahrplandienst aktuelle Bahnhöfe und ÖPNV-Haltestellen.
- Browserstandort wird lokal dem nächsten Halt zugeordnet und unmittelbar in Start oder Ziel übernommen. Fünf nahe Halte stehen zur Auswahl. Bei verweigertem Zugriff, Zeitüberschreitung oder fehlender Abdeckung erscheint ein Hinweis; Kartenauswahl bleibt möglich.
- Bis zu fünf Zwischenziele mit Aufenthalten von zehn Minuten bis 24 Stunden. Jede Teilreise wird erst nach tatsächlicher Ankunft und gewähltem Aufenthalt gesucht. Zeitkonflikte, Zugausfälle, falsche Endpunkte und unvollständige Antworten werden verworfen.
- Serverabfrage der europäischen ÖBB/Scotty-Fahrplanauskunft oder der auswählbaren VRR/EFA-Auskunft für die private Hobby-Nutzung, kein Fahrplan-Zwischenspeicher, begrenzte Antwortzeit und verständlichem Fehlerzustand. Es gibt keinen erfundenen oder hartkodierten Ersatzfahrplan. Die Abdeckung ist je Land und Reisetag unterschiedlich.
- Die Karte zeigt ausschließlich vom Fahrplandienst gelieferte Streckenfragmente (ÖBB GPA / VRR WGS84), einschließlich Bus und Fußwegen. Fehlende Fragmente werden nicht verbunden; bloße Transfer-Luftlinien werden nicht als Weg dargestellt. OSM und optional OpenRailwayMap.
- Bahn, S-Bahn, U-Bahn, Bus, Tram, Fähre und Ersatzbus erhalten eigene Produktkennzeichnungen aus dem ÖBB-Produktprofil. Betreiber, Richtung, Halte, Soll-/Prognosezeiten und Gleis-/Steigänderungen bleiben sichtbar. Nicht bediente Durchfahrts-/Grenzpunkte werden nicht als Fahrplanhalte aufgeführt.
- Meldungen auf Reise-, Abschnitts-, Fahrt-, Fußweg- und Haltebene werden dedupliziert und ihren Gültigkeits-/Ereigniszeiträumen entsprechend angezeigt. Betriebs- und Sperrhinweise bleiben auch bei geschlossenem Reiseverlauf sichtbar. Ausfälle, nicht erreichbare Fahrten und gesperrter Ein-/Ausstieg werden ausgeschlossen. Eine vollständige europaweite Sperrungs- oder Echtzeitabdeckung kann die öffentliche Quelle nicht bestätigen und wird nie behauptet; keine aus Text erratenen Umleitungen. Erneute Suche fragt ohne Fahrplan-Cache neu ab.
- Alle angezeigten Reisezeiten in Europe/Berlin, einschließlich korrektem Tageswechsel und Sommer-/Winterzeit. Die Eingabemaske weist darauf hin.
- Private Sites-Bereitstellung; keine zusätzlichen Nutzer oder öffentlichen Freigaben.

## Daten und Lizenzen

`public/data/stations.json` ist die kompakte, abgeleitete Stationsdatenbank aus [Trainline EU / stations](https://github.com/trainline-eu/stations), unter ODbL 1.0. Die Reihenfolge der Felder ist in `public/data/meta.json` beschrieben. Attributionshinweise, Download und Lizenz stehen in der Website unter „Daten & Hinweise“. Der Katalog enthält auch ÖPNV-Halte und möglicherweise nicht mehr bediente Betriebsstellen. Der Fahrplandienst entscheidet über tatsächlich verfügbare Verbindungen.

Leaflet 1.9.4 liegt lokal unter `public/vendor` inklusive Lizenz. Es werden keine Standortkoordinaten für die Suche an die Fahrplanquelle gesendet; die ausgewählten Bahnhöfe werden bei der Routenanfrage übertragen. Kartenkacheln werden von externen Kartenanbietern geladen.

## Entwicklung und Prüfung

- `node --test tests/*.test.mjs`: Katalogbreite und Ranking, Kürzel und Umlaute, Standortzuordnung, Zeitzonen, aufgezeichnete echte DB-Antworten, Zugausfälle, Endpunktkontrolle und zeitlich erreichbare Zwischenziele.
- `node node_modules/typescript/bin/tsc --noEmit`: Typprüfung.
- `node /root/.codex/plugins/cache/openai-curated-remote/sites/1.1.0/scripts/build-site.mjs`: Sites-Build im vorgesehenen Laufzeitprofil.

Die DB- und ÖBB-Testfixtures sind tatsächlich abgefragte Fahrplanantworten vom 20.10.2026 für Reisen am 21.10.2026. Sie dienen der Parserregression, nicht als Laufzeit-Fallback.

VRR / EFA OpenService: https://www.opendata-oepnv.de/ht/de/api. Der offene Server darf laut Anbieter für Entwicklung, Tests und Hobbyzwecke verwendet werden und kann vom Anbieter für eigene Tests verwendet werden. Ergebnisse und Verfügbarkeit sind eingeschränkt; für einen verlässlichen Produktivzugang ist eine gesonderte Projektfreigabe erforderlich. Keine Serienabfragen und kein Fahrplan-Cache. Explizit nicht im Routing berücksichtigte Störungen führen zum Ausschluss des betroffenen Vorschlags. Die gespeicherte VRR-Testantwort stammt aus einer einzelnen echten Anfrage vom 21.10.2026 für eine Reise am 22.10.2026.
