# Basketball-Trainer-App – Vollständige Anforderungserhebung
Inhaltsverzeichnis
	1.	Einleitung
	2.	Fachliche Spezifika & Domänenübersicht
	3.	Datenmodelle & ER-Diagramm
	4.	User Stories Referenzliste
	5.	Prozessbeschreibungen
	6.	Userflows Übersicht
	7.	Metriken und Gewichtungen
	8.	Validierung und Wechselmanagement
	9.	Inventarmanagement
	10.	Nachspiel-Reflexion
	11.	Ergänzungen und offene Punkte
## 1. Einleitung
Dieses Dokument erfasst umfassend die ganzheitlichen Anforderungen an die App zur Unterstützung von Basketballtrainern im Minibasketball-Bereich (U10). Die App soll Coaches in Vor-, In- und Nachspielphasen assistieren, mit starker Fokussierung auf DBB-Miniregeln, kindgerechte Metriken, übersichtliche Visualisierungen sowie Datenmanagement.
## 2. Fachliche Spezifika & Domänenübersicht
	•	Spielerstammdaten: Vollständige Erfassung von personalisierten Daten, EU-Konfektionsgrößen, Lieblingsnummer, 1–3 Bewertungsmöglichkeiten der Kernmetriken.
	•	Inventarverwaltung: Herstellergebundene Trikotgrößen, saisonales Nutzungstracking, Nummernkonfliktmanagement mit Warnungen.
	•	Einsatzplanung: Automatisierte Erstellung von regelkonformen Einsatzplänen (4x4 und 3x3), mit Validierungen und taktischen Empfehlungen.
	•	Coaching-Unterstützung: Minimal invasive 5-Felder Achtel-Checks, Mann-Mann-Verteidigungs-Tool für Trainer, InGame-Sonderfallmeldungen.
	•	Wechselmanagement: Bestätigungspflichtige Wechsel, manuelle Änderungen mit Validierung.
	•	Nachspiel-Reflexion: Coach-Report mit Compliance, Team-Checks und DSS-Import zur Metrik-Verfeinerung.
	•	Data Governance: Lokal gespeicherte Daten mit Export-/Importmöglichkeiten, DSGVO-konform.
## 3. Datenmodelle & ER-Diagramm
	•	Spieler: SpielerID (PK), Vorname, Nachname, Konf Gr Jersey, Konf Gr. Hose, Geburtsdatum, Erz.berechtigter 1 (Name, Tel., Kontakt-Email) 	gemeldet	in easyVerein	TNA-NrName, Geburtsdatum, TNA, Jersey/Hose Größe (EU), Lieblingsnummer, Kernmetriken, Historie (letzte Änderungen).
	•	Inventar: ArtikelID, Typ, Herstellergröße, EU-Größe, Saison, Verfügbarkeit.
	•	Einsatzplan: PlanID, SpielID, Modus, SpielerID, AchtelNr, Einsatz (ja/nein), Sonderfall.
	•	AchtelCheck: CheckID, SpielID, AchtelNr, BallhandlerVorhanden, PassenFangen, Laufbereitschaft, Teamplay, Rebound, SonderfallGrund, Notizen.
	•	Spielbericht: SpielberichtID, SpielID, SpielerID, Punkte, Fouls, Einsatzzeiten.
	•	MMV Zuordnung: ZuordnungID, SpielID, AchtelNr, SpielerDef, GegnerSpieler, MissmatchSignal.
(Diagramm als Anhang oder anklickbares digitales Format empfehlenswert.)
## 4. User Stories Referenzliste (Auswahl)
	•	US-SD1: Basisdaten Spieler erfassen
	•	US-SD4: Kernmetriken mit Erklärungstexten und Gewichtung erfassen
	•	US-EIN1: Automatischer Einsatzplan 8x8/3x3 mit DBB-Regeln
	•	US-EIN5: Wechsel erst nach Trainer-Bestätigung wirksam
	•	US-NACH1: Umfassender Coach-Report zur Spielreflexion
	•	US-INV3: Nummernduplizierung erkennen und lösen
	•	… (komplette Liste mit IDs, Titel, Storyline, Akzeptanz und Value)
## 5. Prozessbeschreibungen
	•	P1: Vorbereiten des Einsatzplans mit Verfügbarkeitscheck und automatischer DBB-Regelprüfung.
	•	P2: Durchführung der InGame Achtel-Checks und Mann-Mann Verteidigungszuordnung mit Trainingsfokus.
	•	P3: Nachbereitung und Reflexion mit dem Coach-Report, DSS-Datenabgleich, und Metrik-Adjustment.
	•	P4: Validierte manuelle Planänderungen und Bestätigungsprozesse bei Wechseln.
	•	P5: Inventarmanagement mit Größe-Nummern-Überwachung und Saison-Tracking.
## 6. Userflows Übersicht
	•	Vor dem Spiel: Verfügbarkeit → Stammdatenprüfung → Inventarabgleich → Einsatzplan-Auto → Startaufstellung Export
	•	Während des Spiels: Achtel Pause → Team-Checks + Sonderfälle erfassen → MMV Anpassungen → Wechselbestätigung
	•	Nach dem Spiel: DSS/Spielbericht-Import → Coach-Report → Metrik‑Update → Export an Folgetrainer
## 7. Metriken und Gewichtungen
Diese Meriken gibt es im Minibasketball-Bereich (U10), mit den entsprechenden Gewichtungen und Beschreibungen:

| Metrik | Gewichtung | Beschreibung |
|-------------------------------|------------|--------------------------------------------------|
| Ballhandling unter Druck	| 0,16	| Ballkontrolle und Entscheidungsfindung |
| Passen und Fangen                | 0,16       | Präzise Pässe, Ballkontrolle im Teamspiel        |
| Spielübersicht/Entscheiden       | 0,12       | Wahrnehmung, Passfreude, altersgerechte Entscheidungen |
| Laufbereitschaft/Belastbarkeit   | 0,12       | Ausdauer über 8 Achtel, sportgerechte Belastung  |
| Abschlussbereitschaft            | 0,12       | Mut zum Abschluss, Trefferpotenzial in Korbnähe  |
| Teamplay/Fair‑Play               | 0,11       | Ball teilen, Regeln, Fairness                    |
| On‑Ball‑Defense/Bereitschaft     | 0,09       | Verteidigung, Grundhaltung                       |
| Rebound‑Bereitschaft             | 0,06       | Aktiv am Ball, Ballbesitzgewinn                  |
| Positionsflexibilität            | 0,06       | Einsatz auf verschiedenen Positionen             |

Da Zahlenwerte für Kinder schwer zu interpretieren sind, gibt es eine 3‑stufige verbale Bewertungsskala mit den folgenden Beschreibungen:

| Wertung | Ballhandling unter Druck         | Passen und Fangen         | Spielübersicht/Entscheiden         | Teamplay/Fair‑Play         | On‑Ball‑Defense/Bereitschaft | Laufbereitschaft/Belastbarkeit | Rebound‑Bereitschaft | Positionsflexibilität                                                                 | Abschlussbereitschaft                                                                                                   |
|---------|----------------------------------|--------------------------|------------------------------------|----------------------------|-----------------------------|-------------------------------|---------------------|--------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------|
| 1       | oft Ballverlust/Stoppen          | häufig ungenau           | sieht selten Optionen              | braucht oft Erinnerung     | häufig zu spät              | braucht oft Pausen            | selten dabei        | nur in einem Bereich sicher                                                          | Zögert häufig, traut sich kaum, einfache Chancen werden selten genutzt.                                                 |
| 2       | meist sicher                     | meist ankommend          | sieht und nutzt manchmal           | hält meist ein             | meist präsent               | hält meist mit                | manchmal aktiv      | in beiden Bereichen grundlegend                                                      | Nimmt Abschlüsse manchmal, nutzt freie Korblagen und trifft solide.                                                     |
| 3       | sicher auch gegen Druck          | präzise und rechtzeitig  | erkennt früh und handelt passend   | ist Vorbild                | stabil und aufmerksam       | hält gut durch                | konsequent aktiv    | flexibel in beiden Bereichen, entsprechend der Mini‑Empfehlung ‚alle lernen alles‘ | Sucht aktiv Abschlusschancen, zeigt Mut und trifft oft unter Mini-Bedingungen (Korbnähe, einfache Situationen).         |

## 8. Validierung und Wechselmanagement
    •	Automatisierte DBB-Regelprüfungen bei Einsatzplanerstellung.
    •	Wechsel nur nach Trainerbestätigung wirksam, mit Validierung auf Mindestspielzeiten.
    •	Manuelle Änderungen mit Echtzeit-Validierung und Konfliktwarnungen.
    •	Sonderfallmeldungen mit vordefinierten Kategorien und Freitextoptionen.
## 9. Inventarmanagement
    •	Erfassung von Trikot- und Hosengrößen nach EU-Norm.
    •	Nummernverwaltung mit Konflikterkennung und Lösungsvorschlägen.
    •	Saisonales Tracking der Inventarnutzung.
    •	Warnungen bei Größen- oder Nummernkonflikten.
## 10. Nachspiel-Reflexion
    •	Coach-Report mit Spielübersicht, Metrik-Entwicklung, Team-Checks und Sonderfällen.
    •	DSS-Import zur Verfeinerung der Metriken.
    •	Exportfunktionen für Trainerübergabe.
    •	Datenschutzkonforme Speicherung und Verwaltung der Daten.
## 11. Ergänzungen und offene Punkte
    •	Integration von Videoanalysen (zukünftige Erweiterung).
    •	Erweiterung der Metriken basierend auf Trainerfeedback.
    •	Mobile App-Version für InGame Nutzung.
    •	Regelmäßige Updates zur Anpassung an DBB-Regeländerungen.
    •	Feedback-Mechanismus für Trainer zur kontinuierlichen Verbesserung der App. 