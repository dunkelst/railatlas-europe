# Reale Prüfung der privaten Fahrplanauskunft, 21.10.2026

Die folgenden Antworten wurden über die veröffentlichte private Sites-API abgefragt. Alle Reisezeiten in dieser Tabelle gelten in Europe/Berlin; Reisetag 22.10.2026, sofern kein Folgetag genannt ist. Die Abdeckung von Echtzeit und Sperrungen bleibt partiell.

| Strecke | Tatsächliches Ergebnis | Geometrie |
| --- | --- | --- |
| Hameln–Bad Münder | 22.10. 09:20:00–22.10. 09:27:00: S5 (Zug-Nr. 34540) | 26 gelieferte Koordinaten |
| Heilbronn–Würzburg | 22.10. 09:48:00–22.10. 11:20:00: RE8 (Zug-Nr. 19062) | 524 gelieferte Koordinaten |
| Bern–Amsterdam | 22.10. 08:04:00–22.10. 17:05:00: IC 10960 / ICE 200 / RB27 (Zug-Nr. 10616) / RE13 (Zug-Nr. 20078) / IC 3556 / IC 3054 | 2512 gelieferte Koordinaten |
| Amsterdam–Berlin (mind. 60 Min. Aufenthalt) | 22.10. 18:10:00–23.10. 05:53:00: ICE 221 / ICE 1541 | 2116 gelieferte Koordinaten |
| VRR: Hbf → Düsseldorf Heinrich-Heine-Allee | 22.10. 09:02:30–22.10. 09:06:00: U77 | 70 gelieferte Koordinaten |
| VRR: Hbf → Düsseldorf, Vogelsanger Weg (aus Vorschlägen gewählt) | 22.10. 09:17:00–22.10. 09:32:30: S1 / 756 | 118 gelieferte Koordinaten |

Bern → Amsterdam erreichte Amsterdam um 17:05; die Weiterfahrt nach Berlin startete um 18:10, also nach 65 Minuten. Die Ankunft in Berlin erfolgte am 23.10. um 05:53. Die Teilreisen wurden nacheinander mit mindestens 60 Minuten Aufenthalt abgefragt.

Die echte VRR-Antwort liefert U79-Störungsmeldungen zu Haltestellenausfällen und dem gesperrten U-Bahnhof Nordstraße. Der Anbieter kennzeichnet die Änderungen als nicht im Routing berücksichtigt. Daher wird der U79-Vorschlag verworfen; die Gründe bleiben sichtbar. Die gewählte U77 wird aus der Quelle übernommen, keine Umleitung wird erfunden.

Der offene VRR-Server wird ausschließlich für die private Hobby-Anwendung verwendet. Er kann vom Anbieter für Tests verwendet werden und ersetzt keinen garantierten Produktivzugang. EFA-BW und Trainline Partner Solutions sind nicht integriert.

Die App-Regressionen und die bestehende Graph-/OSM-Suite wurden lokal ausgeführt; TypeScript-Prüfung und Sites-Produktionsbuild bestanden. Interne Vorschauzugriffe auf ÖBB scheiterten; die oben genannten API-Nachweise stammen ausdrücklich aus der veröffentlichten privaten Anwendung.

## Exakte Auswahl aus dem GitHub-Screenshot

Auch „Hameln → Bahnhof Bad Münder am Deister“ wurde nach der Korrektur über die veröffentlichte private Version 10 abgefragt: HTTP 200, S5 (34540), 22.10.2026 09:20–09:27, 26 gelieferte Geometriekoordinaten. Die bestätigte Zuordnung des sechsstelligen Katalogeintrags zum Bahnhof Bad Münder(Deister) steht ausdrücklich im Ergebnis. Der anders benannte benachbarte Bus-Halt wird nicht auf den Bahnhof umgebogen.

25 App-Regressionen, TypeScript-Prüfung, Sites-Produktionsbuild und die unveränderte Graph-/OSM-Regression bestanden.
