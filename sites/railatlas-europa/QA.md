# RailAtlas Europa – geprüfter Stand vom 20.10.2026

## Ausgeführt

- 17 Node-Regressionen bestanden, einschließlich Stationskatalog, Zeitzonen, Zwischenziel-Aufenthalt, Endpunktkontrolle, Ausfälle, GPA-Geometrie, Geometrielücken, ÖPNV-Produkte, temporäre Gültigkeits-/Ereignisfenster und nicht bediente Grenzpunkte.
- TypeScript-Prüfung und Sites-Produktionsbuild erfolgreich.
- Private veröffentlichte Worker-Auskunft mit echten Anfragen für den 21.10.2026:

| Strecke | Ergebnis | Gelieferte Geometrie |
| --- | --- | --- |
| Heilbronn Hbf → Würzburg Hbf, ab 08:00 | RE8, 08:48–10:20 | 524 Koordinaten |
| Bern → Amsterdam, ab 08:00 | 08:04–17:05, reale IC/ICE/RB/RE-Abschnitte | 2.512 Koordinaten |
| Amsterdam → Berlin, nach mindestens 60 Min. Aufenthalt | 21:34–06:19 am Folgetag, ES 453 + S15 | 1.579 Koordinaten |
| Wien Karlsplatz → Stephansplatz | U1 | 15 Koordinaten |
| Wien Berggasse → Schottentor | Bus 40A | 5 Koordinaten |

- Die veröffentlichten Verbindungen Heilbronn–Würzburg und Bern–Amsterdam–Berlin zusätzlich im Browser über das Formular ausgeführt und den vollständigen Verlauf geprüft. Ankunftstag, Aufenthalt, Betreiber, Richtung, S-Bahn und Datenabdeckungs-Hinweis erscheinen korrekt.
- Autovervollständigung Amsterdam, Stationsauswahl, Start/Ziel-Tausch und Übernahme eines Kartenpunkts ausschließlich ins Ziel in der internen Vorschau praktisch geprüft.
- Private Veröffentlichung nativ bestätigt; Anmeldung ist erforderlich, Freigabe nur für den Eigentümer.

## Grenzen der Nachweise

- Die Gültigkeits- und Sperrungstests verwenden gezielte Testmeldungen in einer aufgezeichneten echten ÖBB-Antwort. In den genannten Live-Abfragen wurde keine aktive Streckensperrung geliefert. Keine behauptete Prüfung einer tatsächlichen europäischen Sperrung.
- Eine vollständige europaweite Echtzeit-/Sperrungsabdeckung ist nicht bestätigt. Die Oberfläche nennt diese Grenze auch bei leerer Meldungsliste.
- Der erfolgreiche GPS-Fall mit echten Gerätekoordinaten wurde nicht neu ausgeführt. Die örtliche Zuordnung ist automatisiert geprüft; verweigerter Standortzugriff und Kartenauswahl wurden bereits praktisch geprüft.
- Keine Testfixture dient als Laufzeit-Fallback. Geometrie und Verbindungen kommen ausschließlich aus der jeweiligen aktuellen Fahrplanantwort.
- Manche Bahnhofsumstiege enthalten in der Quelle nur einen Zeitpunkt und keine eigene Gehzeit. Die Oberfläche nennt die Gehzeit dann ausdrücklich als nicht separat geliefert.

## Nächste sachliche Datenlücke

Für eine nachweislich umfassende Sperrungsberücksichtigung wären weitere verlässlich abgedeckte, lizenzierte Betreiber-/Verbundmeldungen und reale Störungsfälle als Prüfgrundlage erforderlich. Nicht aus einer leeren Meldungsliste auf freie Fahrt schließen.

## Ergänzung 20.10.2026, 23 Uhr

- Den separaten ÖBB-HimSearch-Störungsfeed für Start und Ziel in die jeweilige Live-Reiseabfrage integriert. Meldungen werden nur übernommen, wenn beide von ÖBB genannten betroffenen Punkte tatsächlich im gelieferten Reiseweg liegen; dadurch werden fremde durchlaufende Linien nicht als Reisestörung ausgegeben.
- Die Abfrage ist auf die konkrete Reisezeit und den Produktfilter 7167 begrenzt. Fehlschläge des Zusatzfeeds werden nicht als störungsfrei interpretiert; die Abdeckung bleibt ausdrücklich partiell.
- Reale veröffentlichte Störungsantwort vom 21.10.2026 nachgewiesen: Wels Hbf → Linz/Donau Hbf lieferte REX 50 (5909), 08:06–08:24, vollständige Geometrie und genau einen gültigen Hinweis zum außer Betrieb befindlichen Personenlift in Wels Hbf (ÖBB-Gültigkeit 09.09.–06.11.2026).
- Doppelte Darstellung desselben Hinweises aus Fahrt- und Stationsfeed anhand von Titel, bereinigtem Meldungstext, Ort und Gültigkeit verhindert.

## Ergänzung 21.10.2026: VRR / EFA

- 24 Node-Regressionen bestanden; TypeScript-Prüfung und Sites-Produktionsbuild erfolgreich.
- VRR OpenService als explizit auswählbare zweite Fahrplanquelle angebunden. Nutzung für die private Hobby-Anwendung, kein zugesicherter Produktivserver. Die Oberfläche nennt diese Grenze vor der Suche und beim Ergebnis. Zugangsbedingungen: https://www.opendata-oepnv.de/ht/de/api und /ht/de/standards/nutzungsvereinbarung-api. Einzelne Live-Anfragen, keine systematische Fahrplandatenübernahme.
- Echte VRR-Antwort vom 21.10.2026 für Düsseldorf Hbf → Heinrich-Heine-Allee am 22.10.2026, ab 09:00: U77 09:02:30–09:06:00, 70 gelieferte Koordinaten. Eine frühere U75 wird wegen Abfahrt vor der Anfragezeit ausgeschlossen.
- Dieselbe echte Antwort enthält U79-Meldungen mit „nicht berücksichtigt“ im Routinghinweis, darunter Nordstraße U (gesperrter Ein-/Ausstieg). Der U79-Vorschlag wird konservativ verworfen. Die zeitlich gültigen Ausschlussgründe bleiben als Meldungen zum verworfenen Vorschlag sichtbar. Keine aus dem Störungstext erfundene Ersatzverbindung.
- Regressionen decken diese tatsächlichen Störungsdaten, deren Ende der Gültigkeit, abgesagte/unmögliche Fahrten, falsche Endpunkte, Zeitkonflikte und fehlende Geometrie ab. Mutationen dieser Quelle sind als Regressionen zu verstehen, nicht als zusätzliche Live-Nachweise.
- VRR-Produktidentitäten und Station-/Steig-IDs werden getrennt von DB-/ÖBB-IDs übernommen. Ein geliefertes Schätzzeitfeld allein genügt nicht als Nachweis einer live überwachten Fahrt.
- Interne Browser-Vorschau: Vorschläge für Hameln und Bad Münder funktionieren; der ausgehende ÖBB-Aufruf scheiterte in dieser Vorschau. Produktionsnachweise müssen an der privaten Veröffentlichung erfolgen.
- EFA-BW, die konkrete efa.de-Instanz und Trainline Partner Solutions sind nicht freigeschaltet oder integriert. Es wurden keine Zugänge beantragt und keine Kontaktformulare versandt.

### Katalogkennung Bad Münder – zusätzliche Regression

Der genau im Screenshot gewählte Eintrag „Bahnhof Bad Münder am Deister“ besitzt die lokale sechsstellige Katalogkennung 265126; diese ist keine unmittelbar nutzbare ÖBB/EVA-ID. Eine echte ÖBB-LocGeoPos-Antwort liefert den gleichnamigen Bahnhof Bad Münder(Deister), EVA 8000725, in 168 Metern Entfernung. Der Resolver übergibt die lokale Kennung nicht mehr als EVA-ID. Er akzeptiert eine Zuordnung nur mit passendem Stationsnamen und Lage innerhalb desselben kleinen Bahnhofskomplexes; die Zuordnung erscheint ausdrücklich im Reiseergebnis. Der benachbarte, anders benannte Bus-Halt „Am Deisterbahnhof“ wird im Regressionstest nicht auf den Bahnhof umgebogen.

25 Regressionen bestanden. TypeScript-Prüfung und Produktionsbuild wurden nach dieser Korrektur erneut ausgeführt.


## Ergänzung 23.10.2026: identische Oberfläche auf GitHub Pages

- Öffentliche Testnutzung ist vom Eigentümer freigegeben. Die UI kennzeichnet sich als Testversion; die VRR-Auskunft bleibt ein Testzugang ohne Verfügbarkeitsgarantie.
- Der statische Vite-Build importiert dieselbe `app/page.tsx`, dieselben Komponenten und Styles wie Sites. Keine Weiterleitung und keine zweite Routing-Implementierung. Der Stationskatalog und Leaflet werden mit dem Repository-Präfix geladen.
- GitHub Pages verwendet die bestehende Sites-Serverauskunft. Für genau `https://dunkelst.github.io` sind CORS-JSON-Antworten und OPTIONS freigegeben; keine Zugangsdaten im Browser oder Repository.
- 29 Node-Regressionen bestanden, darunter neue Prüfungen für beide URL-Kontexte, CORS-Preflight, unzulässige Browser-Ursprünge und lesbare API-Fehler. TypeScript-Prüfung und beide Produktionsbuilds erfolgreich.
- Neue Live- und Browser-Prüfungen der GitHub-Veröffentlichung werden im GitHub-Repository unter `docs/github-pages-qa.md` dokumentiert. Dieser Quellstand behauptet diese noch nicht als ausgeführt.

### Praktische GitHub-Prüfung und DB-Prüflink

Die veröffentlichte GitHub-Seite blieb bei allen folgenden Formularabfragen unter `https://dunkelst.github.io/railatlas-europe/`. Der Katalog und die Karte wurden lokal von GitHub geladen; Live-Auskunft und Online-Vorschläge funktionierten über die gemeinsame öffentliche API.

- Heilbronn–Würzburg am 23.10.2026: RE8 (19072), 14:48–16:20, Arverio, Gleise 3 → 2.
- Hameln → genau der Katalogeintrag „Bahnhof Bad Münder am Deister“ am 24.10.2026: S5 (34540), 09:20–09:27. Namens-/Lagezuordnung zum echten EVA-Bahnhof sichtbar.
- Bern–Amsterdam–Berlin am 24./25.10.2026: Bern 09:04 → Amsterdam 17:50 (ICE 372/918/124), Weiterfahrt 20:40 über Duisburg mit IC 60403 und ICE 1541, Berlin 05:39. Gewünschter Aufenthalt 60 Min., tatsächlicher Aufenthalt 2 Std. 50 Min.; Zeitumstellung korrekt berücksichtigt. Dasselbe Ergebnis auf Sites geprüft.
- Der externe DB-Prüflink enthielt bei Bad Münder noch die lokale sechsstellige Katalogkennung. Der gemeinsame Link-Generator übergibt jetzt ausschließlich echte sieben- bis neunstellige EVA-Kennungen; sonst bleibt die Bahnhofssuche über den Namen erhalten. Zusätzliche Regression bestanden, insgesamt 30.


## Fortführung 24.10.2026: Netzebenen und eigenständiger Server

- 42 Node-Regressionen bestanden. Neu: unabhängige Vorgaben/Schalter, OSM-Produktzuordnung, gemeinsame Bahn-/S-Bahn-Halte, mehrere Geometriefragmente, Ausschnittbegrenzung, unvollständige Overpass-Antworten, echter lokaler HTTP-Server einschließlich Dateien, CORS, JSON-/Größenfehlern sowie gültiger Serverkonfiguration. Gezielte OSM-Objekte in diesen Tests sind synthetische Parserfälle, keine behaupteten Live-Kartendaten.
- TypeScript, Sites-Produktionsbuild, GitHub-Pages-Build und eigenständiger Clientbuild erfolgreich.
- Die Netzebenen werden ohne vorherige Reiseabfrage geladen. Bahn-Schieneninfrastruktur ist voreingeschaltet; OSM-Linien und Halte der übrigen Modi sind unabhängig schaltbar. Abruf nur für kleine Ausschnitte ab Zoom 12, kurze Begrenzung der Antwortzeit und Antwortgröße. Abgebrochene oder unvollständige Daten werden nicht als vollständiges Netz ausgegeben. Keine Verbindung über Geometrielücken.
- Die Bahnübersicht zeigt OpenRailwayMap-Schieneninfrastruktur, welche auch gemeinsam genutzte Infrastruktur enthalten kann. Die Betriebsart einer S-Bahn wird aus OSM-Routenkennzeichnung abgeleitet, nicht aus der bloßen Existenz eines Gleises. Keine Behauptung vollständiger europaweiter Netzdaten oder aktueller Bedienung.
- Sites und Node rufen denselben API-Handler und dieselbe Anbieter-/Routinglogik auf. Die eigenständige Anwendung benötigt keine ChatGPT-Seite. Für Pages wird eine eigene Serveradresse ausdrücklich eingerichtet; es gibt keinen versteckten Rückfall auf Sites.
- Die interne Vorschau wurde vom Dienst als laufend gemeldet, war im Browser jedoch mit ERR_CONNECTION_REFUSED nicht erreichbar. Die Browserprüfung dieser Vorschau ist daher nicht als bestanden zu werten. Die direkte Overpass-Abfrage aus der Entwicklungsumgebung lieferte HTTP 406; dies ist kein Live-Nachweis einer gültigen Overpass-Antwort.

### Live-Prüfung der Fortführung

- Sites-Version 13 nativ erfolgreich veröffentlicht. Die neue Oberfläche und ihre Schalter wurden im Browser geladen. Die echte ÖBB-Stationssuche liefert weiterhin Wien Karlsplatz (U) und Wien Stephansplatz (U).
- Beide Stylesheet-URLs werden in dieser Prüfumgebung mit HTTP 403 / Cloudflare „error code: 1010“ abgewiesen; der Browser meldet beim direkten CSS-Aufruf ERR_BLOCKED_BY_CLIENT. Die Dateien sind in Clientbuild und Bereitstellungspaket enthalten. Kein CSS-Inlining als Umgehung. Eine vollständige visuelle Abnahme bleibt damit offen.
- Die erste veröffentlichte Overpass-Abfrage an die Hauptinstanz lieferte HTTP 521. Laut aktueller OSM-Dokumentation ist diese Instanz überlastet; deshalb wird die dokumentierte globale private.coffee-Instanz verwendet. Aus der Entwicklungsumgebung kam dort HTTP 429. Rate-Limit- und Serverfehler lösen nun eine Pause von mindestens 30 Sekunden aus, bevor weitere Ausschnitte angefragt werden. Keine automatischen Wiederholungsserien und keine erfundenen Netzdaten.

## Fortsetzung: Kartenhalte und Abrufgrenzen

- 46 Node-Regressionen, TypeScript und alle drei Produktionsbuilds erfolgreich. Die vier neuen Prüfungen betreffen Warteschlangen-/Timeout-Verhalten, Nutzerabbruch, OSM-/ÖBB-Namenszuordnung und die VRR-Zuordnung einschließlich der aufgezeichneten echten U77-Antwort.
- Der Netzdatenabruf erlaubt 40 Sekunden Gesamtzeit: Die dokumentierte Overpass-Warteschlange von bis zu 15 Sekunden kommt zur angeforderten Verarbeitungszeit von 20 Sekunden hinzu. Ein Zeitablauf erhält eine verständliche Fehlermeldung und 30 Sekunden Abrufpause; ein bewusster Nutzerabbruch wird davon unterschieden. Bereits abgebrochene Aufrufe liefern auch keine Cacheantwort mehr.
- OSM-Kartenhalte dürfen den Stadtpräfix der Quelle weglassen. Die Zuordnung verlangt passenden Namen und höchstens 250 Meter Entfernung innerhalb desselben kleinen Stationskomplexes. U-/S-Gruppenkennzeichnungen werden berücksichtigt; andere Namenszusätze bleiben erhalten. Explizit als U-/S-Halt bezeichnete Quellpunkte werden nicht aus benachbarten Bus-/Tram-Kartenpunkten abgeleitet. Die bestehende Zuordnung regulärer Katalog-/Quellkennungen bleibt erhalten.
- Echtzeitintegration über den unabhängigen Node-Pfad: Testeingaben „Karlsplatz“ und „Stephansplatz“, mit live von ÖBB geladenen Stationskoordinaten, wurden den Quellhalten „Wien Karlsplatz (U1)“ und „Wien Stephansplatz (U1)“ zugeordnet. Geliefert wurde U1 am 24.10.2026, 19:57–19:59 Europe/Berlin. Diese Eingaben simulieren das Kartenformat; sie sind kein behaupteter Download tatsächlicher OSM-Kartenobjekte.
- Die echte aufgezeichnete VRR-Antwort enthält „Düsseldorf, Heinrich-Heine-Allee U“ und unterschiedliche Koordinaten für Station und Bahnsteig. Dieser Fall wird mit den kürzeren Kartennamen erfolgreich durch den vorhandenen U77-Parser geführt. Gegenfälle für entfernte oder anders benannte Halte werden abgewiesen.
- Die aktuell gebaute eigenständige Anwendung wurde zusätzlich über einen echten lokalen HTTP-Server geprüft: Leaflet-CSS (14.806 Byte), App-CSS (119.809 Byte) und Leaflet-JS (147.552 Byte) liefern HTTP 200, korrekte MIME-Typen und bytegenau den gebauten Inhalt. Dies ist ein Auslieferungsnachweis, keine visuelle Browserabnahme.
- Eine Karte ohne messbare Zeichenfläche meldet nun ein Darstellungsproblem und fragt keine ungültige Bounding Box ab. Unveränderte Stationsauswahl wird bei sonstigen Seitenzustandsänderungen nicht neu erzeugt.
- Die externe CSS-Sperre wurde als Cloudflare 1010 eingeordnet: https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1010/. Es wurden keine Sicherheitsregeln abgeschaltet oder Ersatz-URLs zur Umgehung eingebaut.
- Die Overpass-Quelle war auch bei einer winzigen Diagnoseabfrage nicht rechtzeitig erreichbar. Der tatsächliche Download neuer OSM-Netze und die vollständige visuelle Kartenabnahme bleiben offen. Keine Umdeklarierung der Parser-/HTTP-Prüfungen zu bestandenen Live-Kartentests.


## Ergänzung 24.10.2026: regionale EFA-Halte

- 52 App-Regressionen, TypeScript-Prüfung und Sites-, Pages- sowie eigenständiger Clientbuild erfolgreich.

- Öffis' öffentliche Stationssuche und deren EFA-Frontend lieferten die konkrete
  Instanz https://www.efa.de/efa/. Deren StopFinder bestätigt Rohdental mit
  DHID `de:03252:2320`, Koordinate 52.200076 / 9.249135 und Gemeinde
  Hessisch Oldendorf. ÖBB lieferte für dieselbe Namenssuche unpassende Treffer.
- Echte EFA-Fahrtantworten für den 26.10.2026 ab 08:00 Europe/Berlin:
  Rohdental → Hessisch Oldendorf Bahnhof, Bus 27, 08:18–08:32, 232 Quellkoordinaten;
  Heilbronn Finanzamt → Rohdental, 09:25–15:17, S4 / Fußweg / RE 8 / ICE 682 /
  RE2 / RB77 / Bus 27. Alle sieben Abschnitte enthalten vollständige Quellgeometrie,
  dazu vier deduplizierte Betriebshinweise in der gesamten Verbindung.
- Derselbe Such- und Routenpfad wurde live durch den eigenständigen Node-Server
  über `/api/stations` und `/api/journeys` ausgeführt: jeweils HTTP 200, Fahrten
  mit `Cache-Control: no-store`. Rohdental erscheint in der Standardsuche.
- Die EFA-Fixtures enthalten echte erste Verbindungen, keine erfundenen Fahrten;
  weitere Alternativen wurden weggelassen (siehe `tests/fixtures/EFA.md`).
- Neue Regressionen prüfen automatische Quellwahl, fremde Namensvorschläge,
  eigene Anbieter-ID-Räume, Abbruch und Anbieterfehler, Zeit-/Endpunktkontrolle
  und die räumlich begrenzte Übernahme von OSM-Halten. Frühere Bahn-, VRR-,
  Zwischenziel-, Karten- und eigenständige Serverregressionen bleiben erhalten.
- Browserprüfung dieser Änderung noch nicht bestätigt: Die verwaltete Vorschau
  meldet ihren laufenden Zustand, der Cloud-Browser erhält am exakt ausgegebenen
  Vorschau-URL jedoch `ERR_CONNECTION_REFUSED`. Keine Änderung am Anwendungscode
  zur Umgehung dieser Infrastrukturgrenze.


## Ergänzung 24.10.2026: automatische Verkehrsmittelkombination

- Sites-, Pages- und eigenständiger Clientbuild erfolgreich.

- 58 App-Regressionen und TypeScript bestanden. Echte Photon-Suchantworten
  bestätigen Aldwych (GB), Buikslotermeerplein (NL), Carl Berners plass (NO),
  Vychovatelna (CZ), Place d’Italie (FR), Cibeles (ES) und Milchbuck (CH).
  OSM-IDs und Länder werden erhalten, falsche Typen/Koordinaten und fuzzy
  Rosental-Treffer für Rohdental ausgeschlossen.
- Gemeinsamer Node-HTTP-Pfad: automatische Suche liefert u.a. London,
  Amsterdam, Prag, Madrid, Zürich und Rohdental. Nach einer beobachteten
  Suchpause wurde die Warteschlange statt eines sofortigen Fehlers eingebaut;
  Madrid und Amsterdam sind danach wieder mit HTTP 200 bestätigt.
- Die automatische API plant Rohdental → Heilbronn Finanzamt für 26.10.2026
  ab 06:00 Europe/Berlin und liefert mehrere echte EFA-Alternativen, darunter
  Bus 27 / Bus 20 / S5 / ICE / RE 8 / Fußweg / S4. Die reale Antwort enthält
  Produktklasse 97, „nicht umsteigen“: der Bus-Linienwechsel bleibt im Fahrzeug.
  Diese Durchbindung zählt korrekt als vier statt sechs Umstiege.
- Auswahl und Sortierung beruhen auf vollständigen Quellenverbindungen.
  Fehlende Gehzeit gilt beim Sortieren nicht als null Minuten.
  Frühere Bahn-, Zwischenziel-, VRR-, Karten- und Serverregressionen bleiben erhalten.
- Fahrplanlücke tatsächlich sichtbar: Zürich Milchbuck und Bucheggplatz werden
  gefunden, die getestete Verbindung ist mit den bisherigen Auskünften nicht
  bestätigt (HTTP 502). Keine Behauptung einer vollständigen europäischen
  Bus-Fahrplanabdeckung. OSM-Halte werden entsprechend gekennzeichnet.
- Die visuelle Abnahme der neuen Auswahlliste ist offen. Die verwaltete Vorschau
  war in dieser Sitzung nicht erreichbar, die Browser-Übergabe wurde zusätzlich
  durch die Browser-Sicherheitsrichtlinie blockiert. Keine erneute Umgehung.
