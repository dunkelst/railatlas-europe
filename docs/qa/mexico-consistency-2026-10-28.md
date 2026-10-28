# Mexiko: Schnittstellen, Colectivos und Kartenhalte – 28.10.2026

Version 31 erweitert die bestehende RailAtlas-Anwendung. Geprüft wurden 43 kleine Innenstadt-Ausschnitte: die Hauptstädte aller 32 Bundesstaaten sowie Playa del Carmen, Cancún, Tulum, Tijuana, Puerto Escondido, Salina Cruz, Jilotepec, Zamora, Uruapan, Zitácuaro und Ixmiquilpan. Dies ist eine geografisch breite Stichprobe, keine flächendeckende Erhebung oder Zusage des aktuellen Verkehrsangebots.

## Änderungen und Konsequenzen

- Eigene Region Mexiko; mexikanische Stationssuche verwendet Transitous, Photon und echte importierte Kartenhalte. Europäische Katalogvorschläge werden für diese Suche nicht eingesetzt.
- Colectivo / Combi ist eine eigenständig schaltbare Ebene. Linien und Halte sind unabhängig voneinander einblendbar; normale Busse und Metro bleiben getrennt. Die generische Bezeichnung „Transporte colectivo“ wird nicht als Sammeltaxi interpretiert.
- Kartierte Haltepunkte behalten Namen, Originalkoordinaten, Kennungen, Quelle und Datenstand. Gegenüberliegende Punkte derselben Quelle bleiben getrennt. Start, Ziel und Zwischenziel verwenden dieselben Stations- und Reisewege wie bisher.
- 497 ausdrücklich virtuelle Haltepunkte aus Salina Cruz werden im regionalen Kartenimport ausgeschlossen. Weitere informelle Einstiege können fehlen; ein kartierter Halt bestätigt weder Beschilderung noch aktuelle Bedienung.
- Mexikanische IANA-Zeitzonen gelten für Eingabe, Ergebnis, Kopieren und Neuplanung. Europa bleibt über den Regionsschalter verfügbar.
- Nationale OSM-Daten werden in 798 räumlichen Zellen geladen. Fehlende Referenzen bleiben Geometrielücken. Verläufe werden nicht interpoliert und Kartenquellen ersetzen keine Fahrplandaten.

## Quellen und Datenalter

| Quelle | Stand | Nutzung / Lizenz |
| --- | --- | --- |
| [OSM / Geofabrik Mexiko](https://download.geofabrik.de/north-america/mexico.html) | 27.10.2026, 21:23:59 UTC | Original-OSM-Geometrien und Halte, ODbL 1.0 |
| [SEMOVI CDMX](https://hdtp.codeandomexico.org/datos/mex-cdmx-cdmx) | 19.12.2024 | GTFS-Kartendaten, CC BY 4.0; deutlich älter als der OSM-Auszug |
| [Ayuntamiento Jilotepec](https://hdtp.codeandomexico.org/datos/mex-mex-jilotepec) | 16.08.2025 | GTFS-Kartendaten, CC BY 4.0 |
| [SEMOVI Oaxaca / Salina Cruz](https://hdtp.codeandomexico.org/datos/mex-oax-salinacruz) | 07.07.2026 | GTFS-Kartendaten, ODC By 1.0 |
| [OSM Playa del Carmen](https://api.openstreetmap.org/api/0.6/map?bbox=-87.08,20.62,-87.065,20.635) | Abruf 28.10.2026 | Kleiner aktueller Ergänzungsauszug, ODbL 1.0 |

Der nationale Auszug enthält 140 unterschiedliche Colectivo-/Combi-Routenrelationen mit nutzbarer Geometrie und 1.753 zugeordnete Kartenpunkte. Das sind keine 140 garantierten betriebenen Linien; Hin-/Rückrichtungen und Varianten besitzen eigene Relationen. Halte können mehreren Verkehrsmitteln angehören. Original-URLs, Lizenzen und SHA-256 stehen in den mitgelieferten `public/data/mexico-*-source*.json` beziehungsweise `mexico-sources.json` der Anwendung.

## Messwerte und Grenzen

43 Netzproben und 43 Stationssuchen liefern HTTP 200 ohne Fehler der gemeinsamen Struktur-/Koordinatenprüfung; CORS für GitHub Pages ist vorhanden. In 42 Netzausschnitten liegen Halte, in 31 mindestens ein Linienverlauf. Mexicali bleibt im geprüften Ausschnitt leer. Elf weitere Ausschnitte enthalten nur Halte. Auch eine gültige HTTP-200-Antwort kann eine Teilantwort sein und belegt keine flächendeckende Abdeckung.

Colectivo-Verläufe erscheinen im engen Stichprobenausschnitt von Oaxaca, Playa del Carmen, Uruapan, Zitácuaro und Ixmiquilpan. Ein Nullwert in anderen Ausschnitten ist keine Aussage darüber, ob dort Colectivos verkehren. Außerhalb der städtischen Testboxen können weitere Quellobjekte vorhanden sein.

Die erneute veröffentlichte API-Probe bestätigt Playa del Carmen mit 38 Colectivo-Verläufen / 38 Halten und Uruapan mit 35 Verläufen / keinem gelieferten Colectivo-Halt. Die Playa-Browseransicht ist größer und zeigt entsprechend 39 Verläufe / 92 Halte; diese Zahlen sind nicht unmittelbar mit der festen Testbox vergleichbar.

Ein tatsächlicher Transitous-Aufruf für CDMX Buenavista (Fórum Buenavista) → Puebla Explanada, 31.10.2026 ab 09:00 America/Mexico_City, liefert drei Reisealternativen; die erste endet 11:15 Ortszeit. Dies bestätigt diese Fernbusprobe. Unabhängige Colectivo-Fahrpläne sind damit nicht bestätigt.

## Ortsproben

Linienverläufe sind die gelieferten Varianten je Ebene. Halte sind je Verkehrsmittel summiert und deshalb keine Anzahl eindeutig verschiedener nationaler Haltestellen. Rohmessungen mit Zeitstempeln stehen in der benachbarten JSON-Datei.

| Ort | Suchtreffer | Netz-HTTP | Halte je Ebene summiert | Linienverläufe | Colectivo-Verläufe / Halte |
| --- | ---: | ---: | ---: | ---: | ---: |
| Aguascalientes | 7 | 200 | 16 | 10 | 0 / 0 |
| Mexicali | 1 | 200 | 0 | 0 | 0 / 0 |
| La Paz | 10 | 200 | 1 | 0 | 0 / 0 |
| Campeche | 17 | 200 | 34 | 1 | 0 / 3 |
| Tuxtla Gutiérrez | 5 | 200 | 18 | 0 | 0 / 1 |
| Chihuahua | 16 | 200 | 25 | 1 | 0 / 0 |
| Saltillo | 13 | 200 | 13 | 1 | 0 / 0 |
| Colima | 9 | 200 | 23 | 0 | 0 / 0 |
| Durango | 11 | 200 | 20 | 5 | 0 / 0 |
| Guanajuato | 11 | 200 | 97 | 4 | 0 / 0 |
| Chilpancingo | 9 | 200 | 3 | 0 | 0 / 0 |
| Pachuca | 9 | 200 | 72 | 16 | 0 / 0 |
| Guadalajara | 11 | 200 | 341 | 8 | 0 / 0 |
| Toluca | 18 | 200 | 51 | 519 | 0 / 0 |
| Morelia | 18 | 200 | 7 | 165 | 0 / 0 |
| Cuernavaca | 16 | 200 | 30 | 6 | 0 / 0 |
| Tepic | 14 | 200 | 46 | 0 | 0 / 2 |
| Monterrey | 16 | 200 | 31 | 8 | 0 / 0 |
| Oaxaca de Juárez | 10 | 200 | 325 | 164 | 54 / 198 |
| Puebla | 18 | 200 | 297 | 11 | 0 / 1 |
| Querétaro | 18 | 200 | 234 | 121 | 0 / 0 |
| Chetumal | 8 | 200 | 9 | 0 | 0 / 5 |
| San Luis Potosí | 17 | 200 | 26 | 1 | 0 / 0 |
| Culiacán | 2 | 200 | 5 | 1 | 0 / 0 |
| Hermosillo | 6 | 200 | 7 | 4 | 0 / 0 |
| Villahermosa | 1 | 200 | 44 | 1 | 0 / 0 |
| Ciudad Victoria | 5 | 200 | 2 | 0 | 0 / 0 |
| Tlaxcala | 12 | 200 | 45 | 0 | 0 / 0 |
| Xalapa | 6 | 200 | 50 | 2 | 0 / 0 |
| Mérida | 11 | 200 | 41 | 12 | 0 / 0 |
| Zacatecas | 18 | 200 | 7 | 0 | 0 / 2 |
| Ciudad de México | 1 | 200 | 369 | 187 | 0 / 23 |
| Playa del Carmen | 9 | 200 | 79 | 38 | 38 / 38 |
| Cancún | 10 | 200 | 10 | 0 | 0 / 0 |
| Tulum | 12 | 200 | 32 | 0 | 0 / 4 |
| Tijuana | 15 | 200 | 2 | 2 | 0 / 0 |
| Puerto Escondido | 4 | 200 | 8 | 32 | 0 / 0 |
| Salina Cruz | 12 | 200 | 99 | 88 | 0 / 0 |
| Jilotepec | 1 | 200 | 81 | 152 | 0 / 0 |
| Zamora | 7 | 200 | 55 | 86 | 0 / 0 |
| Uruapan | 3 | 200 | 3 | 83 | 35 / 0 |
| Zitácuaro | 3 | 200 | 11 | 148 | 4 / 1 |
| Ixmiquilpan | 4 | 200 | 5 | 1 | 1 / 0 |

## Prüfung und Veröffentlichung

132 Regressionen erfolgreich, einschließlich der bisherigen europäischen Verarbeitung, echter Playa-OSM-Objekte, Kartenzellen-Grenzen, getrennten Gegenrichtungshalten, mexikanischer Suche und Zeitzonen sowie der echten CDMX–Puebla-Antwort. TypeScript und Worker-, Standalone- und GitHub-Pages-Build erfolgreich.

Sites-Version 31 ist veröffentlicht. Im Browser sind violette Colectivo-Verläufe und kartierte Einstiege sichtbar; die beiden Schalter wurden unabhängig geprüft. Die GitHub-Pages-Veröffentlichung und die abschließenden Bedienungsproben stehen im Versionsprotokoll.
