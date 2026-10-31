# RailAtlas 44 – Mexikanische Busbahnhöfe, Richtungen und Einstiegsstellen

Sites-Quellcommit `e0dcc42424cb6130abee85accf58fc3036485b77`.
1.041 bytegleich gespiegelte Quelldateien. Das generierte `tsconfig.tsbuildinfo`
bleibt ausgenommen. 167 Regressionen, TypeScript und Worker-, Standalone- sowie
Pages-Build erfolgreich. Die verwaltete Vorschau war nach Entfernen ihrer
veralteten Laufmarkierung gesund, ihre Browserroute lieferte weiterhin
`ERR_CONNECTION_REFUSED`. Die Bedienprüfung erfolgt am regulären öffentlichen Host.

## ADO-/Distribusion-Suche

Die öffentliche ADO-International-Suche verwendet die anonyme Distribusion-
Stationssuche mit `rpn=343401`, `locale=es`. Physische Terminals werden anhand
der tatsächlich zurückgegebenen Stationskennung über die Stations-API mit
`retailer_partner_number=343401` aufgelöst. Originalnamen, mexikanische
Koordinaten, Ortskontext und Quellenkennungen bleiben erhalten. Der fehlerhafte
frühere Camelcase-Partnerparameter wird auch in der Verbindungssuche ersetzt.
Die Quelle und der tatsächliche Fahrtenbetreiber werden getrennt gespeichert.

Keine landesweite Komplettabfrage: begrenzte Nutzersuche, maximal sechs native
Stationsauflösungen, Zeit-/Größenlimits und kurzlebiger Cache. Ein fehlgeschlagener
Stationsabruf verwirft andere gültige Treffer nicht. Auslandsorte und falsche
Stationskennungen bleiben ausgeschlossen. Vier tatsächliche Terminalantworten
(Cancún T2/T3/T4, ADO Tulum) dienen als begrenzter Ausfallkatalog. CUN zeigt
Flughafenareal, Tren-Maya-Bahnhof und drei ADO-Terminals getrennt.

Live-Prüfung der gemeinsamen API am 31.10.2026, Reisedatum 01.11.2026:

| Abfrage | Ergebnis | Erste Fahrt in Ortszeit |
| --- | --- | --- |
| TAPO San Lázaro → Puebla CAPU, ab 09:00 Mexico City | HTTP 200, sechs Reisen | ADO, 09:00–11:00 |
| Cancún Flughafen T2 → ADO Tulum, ab 09:00 Cancún | sechs Reisen | ADO, 12:00–14:20 |

Weitere tatsächliche Stationsantworten wurden für Terminal Norte, Mérida und
Puebla einschließlich Tehuacán geprüft. Quellzeitzonen Guatemala/Bogotá werden
für die Anzeige auf die gleichzeitigen unterstützten mexikanischen Zonen
abgebildet; gelieferte Fahrzeiten verwenden weiterhin ihre originale Quellzone.

## Colectivo-Richtungen und zentrale Einstiege

Der bestehende Riviera-Prüfausschnitt enthält 39 gerichtete OSM-Relationen mit
23 verschiedenen Kennungen CL01–CL23 sowie 158 kartierte Punkte. Dies sind
Kartenkennungen, keine nachgewiesenen Beschriftungen auf Fahrzeugen. Frühere
Generierung hatte `from`, `to`, `via`, Betreiber und genaue Relationsmitgliedschaft
verworfen. Diese Metadaten wurden aus denselben Originalrelationen wiederhergestellt;
ihre Zeitstempel sind älter als die bereits gespeicherten Geometrien. Ein Import
abweichender Kennungen, Namen oder jüngerer Metadaten wird abgelehnt.

Hin- und Rückrichtung mit gleicher CL-Kennung bleiben über ihre Relations-ID
getrennt. Halte erhalten nur tatsächliche Relationsmitgliedschaften. Ein
allgemeines Bushaltestellentag allein macht daraus keine gewöhnliche Buslinie.
Wiederholte Einstiegs-/Ausstiegsrollen werden kombiniert. Beispiel CL05:
Centro 30 → Cristo Rey und Cristo Rey → Centro 30 bleiben getrennte Kartenpfade.
Der OSM-Punkt `node/13479430519` (Centro 30 Avenida / Avenida Juárez) enthält
u. a. CL02, CL03, CL05 und CL07 mit den jeweiligen Quellrichtungen. Benachbarte
Halte werden nicht allein wegen ihrer Nähe derselben Linie zugeordnet.

Die gemeinsame Karte kann eine Bus-/Colectivo-Richtung einzeln zeigen.
Passende Halte werden anhand der Quellenmitgliedschaft gefiltert; Zähler folgen
dem sichtbaren Ausschnitt. Halte-Popups enthalten die einzelnen Richtungen.
Ausgewählte Richtung und Betreiber sind zusätzlich ohne abgeschnittenen Namen
lesbar. Eine aufklappbare alphabetische Halteliste ergänzt zentrale Einstiegsnamen;
sie behauptet keine chronologische Haltefolge. Eigene Texte sind DE/EN/ES.

## Weitere Anbieter und tatsächliche Oriente-Geometrien

- Turicún: offizielles Linienverzeichnis https://www.turicun.com/rutas mit R-1,
  R-2, R-5, R-6, R-11, R-15, R-21, R-27, R-28, R-44, R-68, R-237 und MOBI.
  Verlinkte Google-Straßenrouten werden nicht als Busgeometrien übernommen.
- Ahorrobus / Mayab / Oriente / SUR: https://ahorrobus.com.mx/es/quintana-roo
  nennt u. a. Mayab 481/482 und 489/490 sowie Oriente 608/609.
- Für Oriente 608 (Playa → Valladolid) und 609 (Rückrichtung) liefert der öffentliche
  Betreiber-Portlet tatsächlich GeoJSON mit 1.086 bzw. 1.103 Koordinaten und fünf
  benannten Halten: Playa del Carmen, Puerto Aventuras, Tulum, Cobá, Valladolid.
  Genau diese Punkte und Pfade werden übernommen; keine Straßenberechnung.
  Der gebundene Auszug und seine SHA-256 stehen in der Quellenliste.
- Playa Express: im Betreiberhinweis für den Korridor Playa ↔ Cancún verlinkt;
  keine Flughafenbedienung oder Fahrplananbindung daraus abgeleitet.

Ahorrobus nennt keine offene Datenlizenz. Der Quelleneintrag enthält deshalb
`license: null` mit Rechtehinweis; er wird nicht unter die ODbL-Quellen subsumiert.
Die originalen OSM-Daten behalten ihren eigenen ODbL-Nachweis.

Reproduzierbare Aktualisierung aus den gespeicherten, anonymen Quellenauszügen:

```bash
node scripts/enrich-mexico-routes.mjs tests/fixtures/osm-playa-route-metadata.json.gz
node scripts/import-mexico-bus-routes.mjs tests/fixtures/ahorrobus-riviera.json.gz
```

## Offene Datenlücken

Die ADO-Verbindungsliste enthält Endpunkte und Fahrzeiten, jedoch keine nutzbare
Zwischenhaltfolge oder Fahrtgeometrie. Der dokumentierte öffentliche Ride-Abruf
wurde mit tatsächlichen frischen Fahrtkennungen geprüft und lieferte HTTP 422
`NOT_FOUND`; daraus wird kein Verlauf ergänzt. Oriente-Geometrien werden keiner
ADO-Fahrt zugeschrieben. Datumsbezogene Oriente-/Colectivo-Fahrten, Echtzeit,
Störungen und automatische Bus-Bahn-Anschlüsse sind weiterhin unbestätigt.
Ein zentraler Einstieg oder eine Kartenlinie bestätigt noch keinen Anschluss.

## Veröffentlichte Bedienprüfung

Die öffentliche Oberfläche bestätigte CUN mit fünf getrennten Quellenpunkten,
TAPO San Lázaro und Terminal Norte als native Vorschläge in der Suche nach
Mexico. CL05 Centro 30 → Cristo Rey reduzierte die Colectivo-Ebene auf einen
Verlauf und 17 Halte im sichtbaren Playa-Ausschnitt. DE → EN erhielt Richtung
und Zähler. Der abschließende Stand ergänzt die vollständig lesbare Richtung
und die alphabetische Halteliste.

Der finale öffentliche Stand 44 bestätigt CL05 mit vollständig lesbarer Richtung,
Betreiber und 17 aufgeführten Halten; Centro 30 Avenida / Avenida Juárez ist
ausdrücklich enthalten. DE → ES → DE erhielt Auswahl und 17 Halte; die neuen
Listenüberschriften und Erläuterungen wurden übersetzt. Oriente 608 zeigt
PLAYA DEL CARMEN → VALLADOLID, ORIENTE und im engen Playa-Ausschnitt einen
sichtbaren zugehörigen Halt. Die Zahl bezieht sich auf den Ausschnitt, nicht auf
die insgesamt fünf gelieferten Betreiberhalte.
