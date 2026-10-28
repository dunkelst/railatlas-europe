# GitHub Pages – aktueller Veröffentlichungsnachweis

## 28.10.2026: Gemeinsame App-Version 28 auf GitHub Pages

Veröffentlicht und im Browser geprüft:
https://dunkelst.github.io/railatlas-europe/

- Implementierungscommit: `8384a3a477f125f536ffb0ef7ac5ef232a041e01`.
- Sites-Version 28, Quelle `4cf457308db624fc5e141151d7a09a5da41a2caf`.
  Alle 200 App-Dateien sind bytegleich; acht Änderungen gegenüber Version 27.
- 111 Node-Regressionen erfolgreich. CI und gemeinsame App-Prüfung erfolgreich.
- Pages-Workflow mit API-/CORS-Prüfung, Build und Deployment erfolgreich:
  https://github.com/dunkelst/railatlas-europe/actions/runs/40740909681

Die automatische Faro–Madrid-Suche für 31.10.2026 ab 09:00 Europe/Berlin wurde
auf der tatsächlich veröffentlichten GitHub-Seite ausgeführt. Drei Alternativen
mit den gleichen Zeiten wie auf Sites, erste 10:30–17:13. Die gelieferten
Fahrzeugverläufe sind sichtbar und als Anbieterverlauf ohne bestätigte Original-
GTFS-Herkunft benannt. Flughafenhalt-Zuordnung und Stationszugang bleiben sichtbar.
Kein Navigieren auf eine Sites-Seite, keine Anmeldung nötig. Die öffentliche
Auskunfts-API bleibt die bestehende Abhängigkeit der GitHub-Testausgabe.

[Browsernachweis auf beiden Veröffentlichungen](qa/railatlas-v28.md).
Allgemeine Tavira-Linienabdeckung und kurzfristige Betriebslage sind weiterhin
nur teilweise bestätigt. Dieser Dokumentationsnachtrag verändert den App-Code
nicht und löst keinen weiteren Pages-Rollout aus.

![Version 28 direkt auf GitHub Pages](qa/railatlas-v28-github-results.jpg)

## Historisch: 28.10.2026, gemeinsame App-Version 27 auf GitHub Pages

Veröffentlichte und im Browser geprüfte Adresse:
https://dunkelst.github.io/railatlas-europe/

- GitHub-Veröffentlichungscommit: `8b7cf887f414bc68841dd51e78c2d55f5efd227e`.
- Unveränderter gemeinsamer App-Stand: Sites-Version 27, Quelle
  `2ac3e41f0a72fdc25e28b8d1ea56f672a47e7952`; alle 200 Dateien des
  Herkunftsmanifests stimmen weiterhin überein.
- [Pages-Veröffentlichung erfolgreich](https://github.com/dunkelst/railatlas-europe/actions/runs/40677990238).
  API-Health, Browserfreigabe für JSON-Verbindungsanfragen, Installation,
  Produktionsbuild und Deployment sind erfolgreich.
- [Gemeinsame App-Prüfung erfolgreich](https://github.com/dunkelst/railatlas-europe/actions/runs/40677990113).
  [CI mit Typprüfung, Pages-Build und Regressionen](https://github.com/dunkelst/railatlas-europe/actions/runs/40677990103).
- Zusätzlich lokal: Pages-Produktionsbuild, alle vier Pages-/CORS-Regressionen,
  API-Health und Journey-Preflight sowie Herkunftsmanifest erfolgreich.

Im echten veröffentlichten GitHub-Formular wurden Faro Airport und Madrid Atocha
aus den Vorschlägen gewählt, 31.10.2026 ab 09:00 Europe/Berlin eingestellt und
die automatische Verbindungssuche ausgeführt. Sichtbar sind drei Alternativen:

| Abfahrt–Ankunft in Europe/Berlin | Verkehrsmittel |
| --- | --- |
| 31.10. 10:30–17:13 | FlixBus 1794 / Bus EA / AVE über Sevilla |
| 31.10. 12:00–19:47 | FlixBus 785 / Bus EA / TGV über Sevilla |
| 31.10. 12:40–01.11. 00:00 | FlixBus 1011 / FlixBus N1149 / C5 über Lissabon |

Der 523-m-Hinweis zur Flughafenhalt-Zuordnung und der 62-m-Stationszugang in
Sevilla sind sichtbar. Die Seite bleibt auf der GitHub-Adresse, ohne Anmeldung.
Katalog mit 54.114 Halten aus 38 Ländern, Karte, Quellenlinks und die neuen
Netz-/Reiseoptionen werden direkt vom GitHub-Pfad geladen. Die angezeigten
Fahrplan-/Geometriegrenzen bleiben bestehen; kein neuer GPS-Nachweis.

Die öffentliche Testausgabe behält ihre bisherige öffentliche RailAtlas-API
unter `https://railatlas-europa.cocoaamber33.chatgpt.site` bei. GitHub Pages führt
selbst keine serverseitigen Anbieterabfragen aus. Dies ist keine vollständig
von dieser API unabhängige Veröffentlichung. Eigene HTTPS-Server bleiben über
Workflow, Repository-Variable oder die bestehende Verbindungsmaske konfigurierbar;
der vollständige eigenständige Node-Server bleibt im Repository.

Künftige Änderungen an der gemeinsamen App lösen den Pages-Rollout automatisch
aus. API und CORS werden vor der Veröffentlichung geprüft. Es wurden weder
bezahlte Infrastruktur noch neue Hostingkonten eingerichtet.

## Historisch: Prüfung vom 23.10.2026

## Gemeinsamer Stand und Veröffentlichung

- Die App läuft direkt unter https://dunkelst.github.io/railatlas-europe/ und blieb bei allen Formularprüfungen auf dieser Adresse. Keine Weiterleitung, auch keine Anmeldung nötig.
- 153 Quelldateien stimmen bytegenau mit Sites-Version 12, Quellcommit `4487d1c3111ef4a0678a48c92d224bfd99bf0e74`, überein. Herkunftsprüfung bestanden.
- 30 App-Regressionen, TypeScript, Worker- und Pages-Produktionsbuild bestanden. Die bestehende Node-/Python-Graph-Regression ist weiterhin erfolgreich.
- Der GitHub-Rollout von Version 11 ist durch Actions erfolgreich bestätigt. Ein dabei aufgedeckter Workflowfehler wurde behoben: Die Quellprüfung läuft vor der Installation, welche eine lokale pnpm-Store-Einstellung schreibt. Der anschließende Abgleich ergänzt Version 12 mit der DB-Prüflinkkorrektur und der zusätzlichen Regression.

## Praktisch im veröffentlichten GitHub-Formular ausgeführt

| Fall | Beobachtetes Ergebnis |
| --- | --- |
| Katalog und Karte | 54.114 Einträge / 38 Länder; Katalog, Styles und Leaflet vom GitHub-Pfad geladen |
| Eingabevorschläge | Hameln und Bad Münder lokal plus Online-Suche; VRR-Halte Düsseldorf Hbf, Heinrich-Heine-Allee und Vogelsanger Weg ausschließlich aus der echten Online-Auskunft |
| Heilbronn → Würzburg, 23.10.2026 | RE8 (19072), 14:48–16:20, Gleise 3 → 2; gleiches Ergebnis auf Sites |
| Hameln → exakt „Bahnhof Bad Münder am Deister“, 24.10.2026 ab 09:00 | S5 (34540), 09:20–09:27; bestätigte Namens-/Lagezuordnung zum Quellbahnhof sichtbar |
| Bern → Amsterdam → Berlin, 24./25.10.2026 ab 08:00 | Bern 09:04 → Amsterdam 17:50 mit ICE 372/918/124; weiter 20:40 mit IC 60403 und ICE 1541 über Duisburg, Berlin 05:39; gleiche Verbindung auf Sites |
| Aufenthalt und Nachtfahrt | Gewünscht 60 Min., tatsächlicher Aufenthalt Amsterdam 2 Std. 50 Min.; Ankunft am Folgetag und Zeitumstellung korrekt |
| VRR Düsseldorf Hbf → Heinrich-Heine-Allee U, 24.10.2026 ab 09:00 | U77, 09:02–09:06, Rheinbahn; echter gelieferter Streckenverlauf |
| VRR-Sperrungen | U79-Vorschlag mit laut Quelle nicht berücksichtigter Änderung ausgeschlossen; Gründe einschließlich temporärem eingleisigem Betrieb bis 26.10. und Nordstraße-Meldung sichtbar, ausdrücklich dem verworfenen Vorschlag zugeordnet |
| VRR Düsseldorf Hbf → Vogelsanger Weg, 24.10.2026 ab 09:00 | Keine bestätigte Verbindung angezeigt. Die direkte Anbieterantwort wurde kontrolliert: tatsächlich keine `journeys`, Broker-Warnungen -10015/-4000. Keine erfundene Busverbindung als Ersatz |
| Kartenauswahl als Start | Châtelet-les-Halles übernommen, Amsterdam und Berlin unverändert; fünf nahe Halte zur Auswahl |
| Kartenauswahl als Ziel | Hamburg Airport übernommen, Start Châtelet-les-Halles und Zwischenziel Amsterdam unverändert |

## Behobener DB-Prüflink

Der Bad-Münder-Katalogeintrag besitzt die lokale Kennung 265126. Diese wurde beim Live-Test noch als `zoei` in den externen DB-Prüflink übernommen. Version 12 lässt ausschließlich sieben- bis neunstellige EVA-Kennungen zu; ohne diese bleibt der Bahnhofsnamen-Parameter erhalten. Die neue Regression prüft genau diesen Fall und die Berliner Zeit im Link.

## Grenzen

- Echtzeit und Sperrungen sind weiterhin partiell abgedeckt. Eine leere Meldungsliste bedeutet keine bestätigte freie Fahrt. Die Nordstraße-Meldung wird als Quellmeldung mit deren tatsächlichem Gültigkeitsfenster angezeigt; sie ist keine selbst ermittelte Sperrung.
- VRR / EFA OpenService ist ein Testzugang ohne garantierte Verfügbarkeit oder Produktionsdatenqualität. Für den 24.10. kam auf der Bus-Teststrecke keine Verbindung zurück; ein funktionierender Bus-/S-Bahn-Fall vom 22.10. ist im gemeinsamen `QA.md` dokumentiert. Keine neue Behauptung vollständiger Busabdeckung.
- Kein gesonderter direkter DB-, VBB/Fahrinfo-, EFA-BW- oder Trainline-Partnerzugang. DB-Züge kommen aus der ÖBB-Auskunft, VRR aus EFA.
- Die erfolgreiche Geräte-GPS-Abfrage mit echten Nutzerkoordinaten wurde hier nicht neu ausgeführt. Die gemeinsame Zuordnungslogik ist automatisiert geprüft; Start- und Zielübernahme von Kartenkoordinaten wurden praktisch geprüft.
- Verbindungen und Geometrie kommen nur aus aktuellen Anbieterantworten. Testfixtures werden zur Laufzeit nicht als Ersatz verwendet; fehlende Geometrie bleibt offen.
