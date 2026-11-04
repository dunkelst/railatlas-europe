# EU-Haltestellensuche · 4. November 2026

Vergleichsbasis: Sites-Version 45 und Draft-PR #10 (`7c0cca6`). Der Suchfix liegt separat über dieser Basis. Der Quellenabgleich im Draft-PR bleibt prüfbar. Das Versionsmanifest des Draft-PR beschreibt den veröffentlichten Sites-Stand.

Die veröffentlichte Suche antwortete für Amsterdam Leidseplein und Paris Bastille mit HTTP 502. Der Transitous-Geocoder lieferte für beide gültige Einträge. Die EU-Automatik übernimmt jetzt auch passende native Transitous-Halte. Bei gleichnamigen Punkten bleiben die Anbieter-IDs bei der Zusammenführung erhalten.

## Live-Prüfung des lokalen API-Handlers

Für jedes Paar wurden die vom Geocoder gelieferten Objekte aus der Suche übernommen und als Start und Ziel an die gemeinsame RailAtlas-API gesendet. Abfahrt angefragt für 04.11.2026 um 10:00 Uhr Ortszeit.

| Stadt | Bahnhof / lokaler Halt | Suchantwort | Fahrtantwort |
| --- | --- | --- | --- |
| Heilbronn | Heilbronn Hbf / Heilbronn Rathaus | 200 / 200 | 422 · abweichender Anbieter-Endpunkt |
| Wien | Wien Hauptbahnhof / Wien Stephansplatz | 200 / 200 | 422 · abweichender Anbieter-Endpunkt |
| Amsterdam | Amsterdam Centraal / Amsterdam Leidseplein | 200 / 200 | 200 · Transitous |
| Brüssel | Bruxelles Central / Bruxelles De Brouckère | 200 / 200 | 200 · Transitous |
| Paris | Paris Gare du Nord / Paris Bastille | 200 / 200 | 200 · Transitous |
| Prag | Praha hlavní nádraží / Praha Malostranská | 200 / 200 | 200 · Transitous |

Bei erfolgreichen Fahrten kann der Anbieter eine eigene Bahnsteig- oder Halte-ID aus demselben von der App akzeptierten Stationsbereich zurückgeben. In Heilbronn und Wien verwarf die Endpunktprüfung die gelieferten Vorschläge.

## Prüfungen und offener Schritt

- 47 gezielte Tests bestanden. Die neue Regression verwendet aufgezeichnete Geocoder-Antworten und prüft die unveränderte Übergabe der Halt-IDs an Transitous.
- TypeScript, Standalone-Build und `git diff --check` bestanden.
- Formular und Marker nutzen im Code dasselbe gewählte Stationsobjekt. Der Browser-Sichttest für diesen Branch steht aus, da der Browser-Zugriff auf die laufende verwaltete Vorschau mit `ERR_CONNECTION_REFUSED` scheiterte.
