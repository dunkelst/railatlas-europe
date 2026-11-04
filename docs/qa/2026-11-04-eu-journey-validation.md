# Zwischenhalt, Sperrung und Stationsidentität am 4. November 2026

Sites 45 und GitHub `main` (`88b132e`) wurden bestätigt. Im separaten
[Draft-PR #10](https://github.com/dunkelst/railatlas-europe/pull/10) stimmen
1.044 Dateien mit dem Sites-Manifest überein. Dieser Schritt baut auf
`review/network-viewport` (`c9b24f2`) auf.

## Bern–Amsterdam–Berlin

Abfrage für den 5. November 2026 ab 06:00 Uhr, mindestens 60 Minuten Aufenthalt
in Amsterdam. Beide Teilstrecken lieferten in der gemeinsamen API HTTP 200
und jeweils drei Optionen von ÖBB / Scotty. Die zweite Anfrage begann
planmäßig um 16:05 Uhr, 60 Minuten nach der ersten Ankunft.

| Teilstrecke | Abfahrt | Ankunft |
| --- | --- | --- |
| Bern Hbf → Amsterdam-Centraal | 05.11. 06:04 | 05.11. 15:05 |
| Amsterdam-Centraal → Berlin Hbf | 05.11. 16:38 | 06.11. 00:58 |

Ortszeit Europe/Berlin. Die Kettenprüfung akzeptierte 93 Minuten Aufenthalt.
Die [öffentliche Sites-Oberfläche](https://railatlas-europa.dunkelst.chatgpt.site/)
zeigte dieselbe Fahrt und Amsterdam-Centraal sowohl im Formular als auch im
Marker. Der VRR-Test mit der gespeicherten U79-Sperrung verwarf den betroffenen
Vorschlag, zeigte die datierten Hinweise und blendete abgelaufene Hinweise aus.

## Wiederholungsproben in Heilbronn und Wien

- Heilbronn Hbf → Rathaus, 05.11. ab 10:00 Uhr. Die unveränderte
  Transitous-ID `al-ShowMeBus_station-413` wurde in Suche und Fahrtantwort
  einmal als „Heilbronn Hbf“ und einmal als „Heilbronn Hauptbahnhof“
  bezeichnet. Die bisherige Prüfung lehnte die Fahrt deshalb ab. Der Fix
  akzeptiert die Schreibweisen bei identischer nativer ID und plausiblen
  Koordinaten. Die gemeinsame API bestätigte eine Fahrt um 10:08–10:14 Uhr
  mit geliefertem Fußweg und Bus 10. Andere Startpunkte bleiben separate
  Vorschläge. Die Regression nutzt die aufgezeichnete Anbieterfahrt.
- Wien Hauptbahnhof → Stephansplatz, 05.11. ab 10:00 Uhr. Die drei
  Transitous-Vorschläge begannen an einem anderen Quellpunkt, 301 m von der
  Auswahl entfernt. RailAtlas liefert HTTP 422 mit dem tatsächlichen
  Quellpunkt zur ausdrücklichen Übernahme.
- Sites 45 zeigte in Heilbronn den ausgewählten Rathaus-Halt im Formular und
  Marker sowie bei eingeschalteten Busebenen 11 Linienverläufe und 245 Halte
  im dortigen Ausschnitt. Beim Zoom und Ebenenwechsel erschienen weiterhin
  die alten Zähler während der Folgeabfrage. Die Korrektur ist im vorherigen
  Review-Schritt enthalten. Der Sichttest des Entwicklungsstands steht aus.

93 gezielte Tests, TypeScript und `git diff --check` bestanden.
