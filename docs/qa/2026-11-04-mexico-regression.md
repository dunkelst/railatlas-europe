# Mexiko-Regression am 4. November 2026

Geprüft auf dem Entwicklungsstand über `review/eu-journey-validation`
(`b06d1c1`). Sites steht auf Version 45 und GitHub main auf `88b132e`.
[Draft-PR #10](https://github.com/dunkelst/railatlas-europe/pull/10)
enthält den separat geprüften Abgleich von 1.044 bytegleichen Dateien.

- `GET /api/stations?region=mexico&q=CUN` lieferte fünf eigenständige
  Ortskennungen. Das Flughafenareal `airport:MMUN`, Tren Maya `22` sowie
  ADO `MXCUNCIF`, `MXCUNCFT` und `MXCUNCFU` liegen an getrennten
  Koordinaten. Die drei ADO-Punkte sind Terminal 2, 3 und 4.
- Bei „ADO Tulum“ erschien zuvor der OSM-Halt Av. Tulum ADO in Cancún
  vor dem Betreiberterminal in Tulum. Die gemeinsame Suche priorisiert bei
  ausdrücklich genanntem ADO die Anbietertreffer, zuerst diejenigen mit
  passender Namensfolge. Die Regression enthält auch Tulum Ruins als
  konkurrierenden Anbieterpunkt und prüft die allgemeine Straßensuche separat.

## Datierte Abfragen

Gemeinsamer API-Handler, Reise am 6. November 2026, Anfrage ab 09:00 Uhr
in `America/Cancun`. Die Quelle lieferte bei beiden Fahrten Zeiten und
Halte, der Verlauf bleibt als fehlend gekennzeichnet.

| Anbieter und explizite Endpunkte | Ergebnis | Erste Fahrt |
| --- | --- | --- |
| ADO Terminal 2 Cancún → ADO Terminal de Autobuses Tulum | HTTP 200, fünf Optionen | ADO Aeropuerto, 12:00–14:20 |
| Tren Maya Cancún Aeropuerto → Tren Maya Tulum | HTTP 200, fünf Optionen bei Wiederholung | Tren Maya 601, 09:00–10:33 |

Die erste Tren-Maya-Abfrage meldete `UPSTREAM_UNAVAILABLE`. Danach lieferten
der direkte Anbieterabruf und die erneute Anfrage an die gemeinsame API
jeweils fünf Fahrten. Der ursprüngliche Fehler ist ein vorübergehender
Fehler beim Quellenabruf.

## Kartenquellen

- CL05 Centro 30 → Cristo Rey und Rückrichtung wurden aus den gespeicherten
  OSM-Geometrien getrennt ausgewählt. Im geprüften Gesamtbereich zeigte jede
  Richtung 23 zugeordnete Quellhalte. Die Mitgliedschaft von Centro 30 Avenida /
  Avenida Juárez wird über die Originalrelation geprüft.
  [Hinrichtung](https://www.openstreetmap.org/relation/20131595) ·
  [Rückrichtung](https://www.openstreetmap.org/relation/20131748)
- Oriente 608 Playa del Carmen → Valladolid ergab einen Betreiberverlauf
  mit 1.086 Koordinaten und fünf physischen Halten. Die App isoliert diese
  Richtung unabhängig von 609 und von den Colectivo-Verläufen.
  [Betreiberkarte](https://ahorrobus.com.mx/detalle-linea?idBusLine=608)
- R901 La Plancha ↔ Mérida Teya und Tren Maya Conecta zum Flughafen Cancún
  sind Quellenhinweise ohne Fahrzeiten, Wege oder Anschlussversprechen.
  [ATY-Karte](https://transporteyucatan.org.mx/rutas/R901) ·
  [Tren-Maya-Mitteilung](https://www.trenmaya.gob.mx/comunicado150826.php)

43 gezielte Tests, TypeScript und `git diff --check` bestanden.
Offen bleibt der vollständige Browser-Sichttest für EU-Ortsauswahl und
Kartenzähler am Review-Stand.
