# Bus- und Metroebenen am 4. November 2026

Der [Sites-Abgleich](https://github.com/dunkelst/railatlas-europe/pull/10) bestätigt
1.044 bytegleiche Dateien zu Sites 45. Dieser Schritt baut auf
[`review/eu-native-stop-search`](https://github.com/dunkelst/railatlas-europe/tree/review/eu-native-stop-search)
auf. Die Änderungen gehören zum Entwicklungsstand für das Review.

## Kartenverhalten

Beim Einschalten von Linien konnte die Karte während der Abfrage die Zähler
einer früheren Antwort anzeigen, die nur Halte enthielt. Zähler und Quellenangabe
erscheinen jetzt, sobald die Antwort Region, Ausschnitt, Verkehrsmittel und
Detailebene abdeckt. Beim Verschieben bleiben geladene Quellsegmente, die den neuen
Ausschnitt schneiden, sichtbar. Beim Zoomen bleibt der Cache unverändert.

## Abfragen mit aktuellen Quelldaten

Der lokale gemeinsame Handler `GET /api/network` mit `region=europe` und
`detail=all` lieferte für alle sechs Ausschnitte HTTP 200. Der nähere Ausschnitt
verwendet das mittlere Viertel der Fläche der jeweiligen Antwort. Zahlen geben
Linienverläufe und Halte aus den Antwortdaten wieder.

| Ort | Bounding Box (S,W,N,E) | Ebene | Ursprünglicher Ausschnitt | Näherer Ausschnitt |
| --- | --- | --- | --- | --- |
| Heilbronn | 49.135,9.195,49.151,9.230 | Bus | 9 / 31 | 9 / 9 |
| Wien | 48.200,16.360,48.216,16.385 | Metro | 4 / 9 | 3 / 2 |
| Amsterdam | 52.366,4.881,52.382,4.911 | Bus, Metro | 2 / 12, 5 / 4 | 0 / 1, 5 / 1 |
| Brüssel | 50.841,4.343,50.858,4.366 | Metro | 4 / 7 | 2 / 2 |
| Paris | 48.844,2.356,48.860,2.384 | Metro | 7 / 11 | 5 / 2 |
| Prag | 50.080,14.398,50.098,14.430 | Metro | 4 / 8 | 2 / 4 |

- Die Metrogeometrie stammt aus den MOTIS-`TIMETABLE`-Verläufen für Wien,
  Amsterdam, Brüssel und Paris und aus der EFA-Kartenquelle für Prag.
- Die Busgeometrie für Heilbronn und Amsterdam stammt aus EFA. In Heilbronn
  meldete die Quelle eine begrenzte Auswahl und lieferte in diesem Ausschnitt
  Ersatzverkehrsvarianten.
- Die Sichtprüfung auf Datenebene bestätigte Originalkoordinaten und
  zusammenhängende Quellsegmente beim Zoomen und Verschieben. Zwei Amsterdamer
  Busverläufe reichten noch in den verschobenen Ausschnitt hinein. Die
  Ursprungsantwort deckte diesen Ausschnitt nicht ab.
- Die öffentliche Sites-API antwortete aus der Arbeitsumgebung mit HTTP 403.
  Der lokale Handler erreichte die Datenquellen. Die Interaktion und die
  angezeigten Zähler im Browser stehen zur Sichtprüfung aus.

173 App-Tests, TypeScript und der Standalone-Build bestanden. Die gezielten
Regressionen prüfen den Wechsel von Halten zu Linien, Zoom, Verschieben,
Region und die Zuordnung einer Antwort mit reinen Busverläufen zu einer
kombinierten Bus- und Bahnanfrage.
