# Europaweite Schnittstellen- und Datenprüfung – 28.10.2026

Geprüft wurden 50 Länder beziehungsweise Gebiete mit je einer kleinen Innenstadt-Box und einer Stationssuche. Das Testset umfasst auch Kleinstaaten, Kosovo, die Türkei und den Kaukasus. Es ist eine geografisch breite Stichprobe, keine Erhebung aller Linien, Stationen oder Länderflächen.

## Ergebnis und Konsequenzen

Der Stand 29 enthielt gemeinsame Verarbeitungsfehler. Die Korrekturen betreffen dieselbe Anwendung und denselben API-Handler auf Sites, GitHub Pages und im eigenständigen Server.

| Befund | Konsequenz | Nachweis |
| --- | --- | --- |
| Griechische, kyrillische und georgische Namen wurden leer; verschiedene Halte konnten gleich erscheinen. | Alle Schriften bleiben erhalten; gängige lateinische Sonderzeichen werden konsistent gefaltet. | 50 Suchproben nach dem Fix HTTP 200; negative Zuordnungstests und getrennte Hinweise. |
| EFA-Halte wurden pauschal DE; schwedische globale IDs verworfen. | Länderpräfix aus globaler ID erhalten; numerische Schlüssel bleiben bei unbekanntem Land leer. Fremde IDs bleiben im EFA-Namensraum. | Vollständige echte Stockholm-Antwort als Fixture. |
| Eine zu große Zürcher Linienantwort pausierte auch andere Städte. | Größenfehler bleiben auf die Anfrage beschränkt; Schutzgrenzen, echte Ausfallpausen und Retry-After bleiben. | Live Größenüberschreitung und Regression für zwei verschiedene Ausschnitte. |
| Zoombegrenzung/Attribution gingen beim Zusammenführen verloren. | Beide bleiben in der gemeinsamen Netzantwort erhalten. | Parser-/Merge-Regression mit echter Tavira-Antwort. |
| Ungültige Netzparameter lieferten wie Anbieterausfälle HTTP 502. | HTTP 400, ohne upstream request; echte Ausfälle weiterhin 502. | Parameter- und CORS-Regression. |
| Vier Amsterdam-Reisen wurden bei Amsterdam Centraal → Amsterdam, Centraal Station verworfen. | Stadtpräfix und generischer Stationszusatz werden innerhalb 250 m erkannt. | Echte Antwort: 0 → 4 geparste Reisen, 94 m Abstand; falsche Stadt/Bahnhof/entfernte Punkte abgewiesen. |

## Messwerte und Grenzen

- Katalog: 54.114 Einträge, 38 Länder, eindeutige IDs und gültige Koordinaten. Die 50er-Auswahl enthält zwölf Gebiete ohne Katalogeintrag. Nationale Katalogabdeckung ist stark ungleich.
- Erste öffentliche Stationsrunde: 48 HTTP-200-Antworten; in sechs weiteren Fällen war die Antwort wegen der gelöschten Schrift leer. Nach der Unicode-Korrektur liefert der gemeinsame Handler 50 HTTP-200-Antworten mit Treffern. Treffer können außerhalb der getesteten Stadt liegen; die JSON-Datei enthält Anzahl und räumliche Nähe.
- Netz-Kandidatenrunde: 45 Ausschnitte mit Halten, 41 mit mindestens einem Linienverlauf. In den gelieferten Antworten wurden keine ungültigen Koordinaten, doppelten Ebenen-IDs, widersprüchlichen Station-/Stopkoordinaten oder unmarkierten ROUTED-Verläufe gefunden.
- Netzfehler in den Proben: Armenien/Yerevan, Malta/Valletta, Russland/Moskau, San Marino und Türkei/Istanbul. Fehlende Bestätigung folgt hier aus leeren bisherigen Quellen und nicht erreichbarer/pausierter Ergänzung; sie belegt keinen fehlenden Verkehr.
- Zürich: geschützte 8-MiB-Grenze der Linienantwort wird überschritten; Halte und vorhandene EFA-Linien bleiben nutzbar. Die App behauptet keine Vollständigkeit. Die Begrenzung ist jetzt konkret benannt und pausiert nicht den nächsten Ort.
- London und weitere Orte wurden in einer Runde durch eine echte Quellenpause beeinflusst. Wiederholungen sind deshalb keine kontrollierte Vorher/Nachher-Studie. Die JSON-Snapshots enthalten Zeitstempel und beide Messrunden.
- Alle fünf bestehenden Kartenebenen wurden angefragt. Bahnlinien im allgemeinen Overlay bleiben die vorhandene separate Schieneninfrastruktur; Null bei rail paths bedeutet nicht das Fehlen der Hintergrundkarte.
- Ein Linienverlauf ist eine gelieferte Variante, keine eindeutige Linie. Halte werden je Modus gezählt; die Summe kann einen multimodalen Halt mehrfach enthalten.

## Länderproben

Suchspalte: Treffer im Handler nach Unicode-Fix. Netzspalten: Summe der vorhandenen Modusebenen im Kandidatenlauf. HTTP 200 ist bei Netzen stets eine mögliche Teilantwort, kein Vollständigkeitsnachweis.

| Land/Gebiet | Suchbegriff / Ort | Katalogeinträge | Suchtreffer | Netz-HTTP | Halte je Ebene summiert | Linienverläufe |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| AD | Andorra la Vella | 0 | 8 | 200 | 43 | 15 |
| AL | Tirana | 1 | 4 | 200 | 82 | 49 |
| AM | Yerevan | 0 | 3 | 502 | 0 | 0 |
| AT | Wien | 827 | 26 | 200 | 126 | 65 |
| AZ | Baku | 0 | 19 | 200 | 1 | 0 |
| BA | Sarajevo | 11 | 8 | 200 | 117 | 100 |
| BE | Bruxelles | 564 | 21 | 200 | 106 | 269 |
| BG | София | 64 | 8 | 200 | 96 | 80 |
| BY | Мінск | 3 | 8 | 200 | 1 | 12 |
| CH | Zürich | 22165 | 20 | 200 | 121 | 2 |
| CY | Lefkosia | 0 | 8 | 200 | 124 | 91 |
| CZ | Praha | 441 | 16 | 200 | 112 | 46 |
| DE | Berlin | 13472 | 25 | 200 | 110 | 41 |
| DK | København | 350 | 6 | 200 | 83 | 26 |
| EE | Tallinn | 1 | 11 | 200 | 59 | 236 |
| ES | Madrid | 1401 | 19 | 200 | 13 | 66 |
| FI | Helsinki | 208 | 18 | 200 | 86 | 561 |
| FR | Paris | 5848 | 26 | 200 | 109 | 104 |
| GB | London | 2674 | 26 | 200 | 115 | 0 |
| GE | თბილისი | 0 | 7 | 200 | 49 | 0 |
| GR | Αθήνα | 1 | 2 | 200 | 149 | 0 |
| HR | Zagreb | 107 | 14 | 200 | 69 | 12 |
| HU | Budapest | 146 | 26 | 200 | 105 | 1 |
| IE | Dublin | 169 | 19 | 200 | 159 | 227 |
| IS | Reykjavík | 0 | 5 | 200 | 35 | 21 |
| IT | Roma | 3953 | 26 | 200 | 153 | 154 |
| LI | Vaduz | 2 | 16 | 200 | 30 | 1 |
| LT | Vilnius | 3 | 10 | 200 | 40 | 232 |
| LU | Luxembourg | 65 | 13 | 200 | 103 | 3 |
| LV | Rīga | 4 | 18 | 200 | 51 | 232 |
| MC | Monaco | 0 | 9 | 200 | 76 | 29 |
| MD | Chișinău | 0 | 8 | 200 | 30 | 36 |
| ME | Podgorica | 6 | 8 | 200 | 66 | 40 |
| MK | Скопје | 11 | 7 | 200 | 71 | 110 |
| MT | Valletta | 0 | 8 | 502 | 0 | 0 |
| NL | Amsterdam | 421 | 26 | 200 | 65 | 21 |
| NO | Oslo | 641 | 22 | 200 | 60 | 141 |
| PL | Warszawa | 192 | 19 | 200 | 102 | 145 |
| PT | Lisboa | 47 | 15 | 200 | 178 | 128 |
| RO | București | 17 | 19 | 200 | 68 | 90 |
| RS | Београд | 36 | 8 | 200 | 77 | 135 |
| RU | Москва | 14 | 5 | 502 | 0 | 0 |
| SE | Stockholm | 117 | 21 | 200 | 59 | 223 |
| SI | Ljubljana | 30 | 13 | 200 | 63 | 11 |
| SK | Bratislava | 57 | 19 | 200 | 73 | 100 |
| SM | San Marino | 0 | 8 | 502 | 0 | 0 |
| TR | İstanbul | 3 | 12 | 502 | 0 | 0 |
| UA | Київ | 42 | 8 | 200 | 11 | 33 |
| VA | Vaticano | 0 | 8 | 200 | 153 | 73 |
| XK | Prishtina | 0 | 4 | 200 | 1 | 18 |

## Fahrten und Zeitzonen

Anfrage am 31.10.2026 ab 09:00 UTC (10:00 Europe/Berlin). Jede Quelle behält ihre gelieferten Fahrzeiten; Anzeigen verwenden weiterhin die in der App benannte Berliner Zeitbasis. Regressionen vergleichen UTC-Zeitpunkte bei Quelloffsets 0, 60, 120 und 180 Minuten sowie über Mitternacht.

19 nationale Proben liefern nutzbare Reisen: AT, BE, BG, CH, CZ, DE, DK, ES, FI, FR, GB, HU, IT, NL, NO, PL, PT, SE und UA. Die automatische Wahl nutzte in 13 Fällen ÖBB/Scotty und in sechs Transitous. Rumänien und Türkei wurden in dieser Katalogphase ausdrücklich übersprungen: Die gewählte automatische Regel fand kein geeignetes Stationspaar im Abstand 10–100 km. Das ist kein negativer Fahrplannachweis.

Zusatzproben:

| Fall | Ergebnis vor dem letzten Amsterdam-Fix |
| --- | --- |
| 1η ΛΥΚΑΒΗΤΤΟΥ → ΕΥΦΡΟΝΙΟΥ | Keine bestätigte Reise (HTTP 502) |
| Amsterdam Centraal → Amsterdam, Nieuwe Willemsstraat | Keine bestätigte Reise (HTTP 502) |
| Trafalgar Square/Charing Cross → Oxford Street / John Lewis | 2 Reisen; Transitous / MOTIS (GTFS) |
| Georgenstr./Am Kupfergraben (Berlin) → Heinrich-Heine-Str./Annenstr. (Berlin) | 3 Reisen; Region Hannover / EFA Deutschland |
| London St Pancras International → Paris Gare du Nord | 3 Reisen; ÖBB / Scotty |
| København → Malmö Central | 3 Reisen; ÖBB / Scotty |
| Wien Hbf → Bratislava hl.st. | 3 Reisen; ÖBB / Scotty |
| Rohdenthal, Rohdental → Heilbronn, Finanzamt | Keine bestätigte Reise (HTTP 502) |

Amsterdam wurde anschließend bis zur Originalantwort verfolgt: vier Reisen vorhanden, Null wegen der Namenszuordnung übernommen; der Fix übernimmt alle vier mit unveränderten Zeiten und Quellgeometrien. Athen wurde ebenfalls separat beim Quellanbieter geprüft: die native v6-Antwort enthält tatsächlich keine Itineraries. Rohdental → Heilbronn am gewählten Samstag blieb bei expliziter EFA-Auswahl unbestätigt; das ist kein Nachweis eines generellen EFA-Ausfalls.

## Reproduzierbarkeit und Validierung

- Manuelles Skript: `sites/railatlas-europa/scripts/audit-europe.mjs`; gleiche Handler und Parser wie in der Anwendung, sequenzielle Aufrufe, eine Sekunde Abstand, kleine Boxen, keine Quellwiederholungen oder Hintergrundjobs.
- Proben speichern Status, CORS, exakte Eingaben, Länder, räumliche Nähe, Moduszähler, Fehler und Zeiten. Vollständige Messwerte: [europe-consistency-2026-10-28.json](europe-consistency-2026-10-28.json).
- Originalantworten für Stockholm und Amsterdam sind als kleine komprimierte Test-Fixtures versioniert. Die übrigen Quellantworten wurden zur Diagnose aufgezeichnet; sie sind keine Produktionsdaten.
- Die Browseranbindung war in dieser Prüfrunde nicht verfügbar. Diese API-/Parserprüfung ist keine neue visuelle Browserabnahme.
- Die API-Quelle ist best effort; ihre öffentliche Linienkarte experimentell. Primärquellen: [Transitous-Nutzung](https://transitous.org/api/), [MOTIS-Schema](https://github.com/motis-project/motis/blob/master/openapi.yaml), [EFA-API-Dokumentation](https://mobidata-bw.de/daten/portal/efa-json/EFA_JSON_API_Training_EN_2.9.pdf).

Der aktuelle Rollout-Nachweis wird nach Veröffentlichung ergänzt.
