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
