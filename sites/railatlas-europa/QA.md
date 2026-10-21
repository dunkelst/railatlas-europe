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
