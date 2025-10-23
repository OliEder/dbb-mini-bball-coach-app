# Datenschutzerklärung für PWA Scouting-App

## 1. Verantwortlicher
**Trainer/Scouter**

## 2. Datenverarbeitung

### 2.1 Öffentliche Daten (DBB)
Die App ruft ausschließlich öffentlich zugängliche Liga-Daten des Deutschen Basketball Bundes (DBB) ab. Diese Daten sind einwilligungsfrei.

### 2.2 Scouting-Daten in IndexedDB
- **Fremdspieler**: Temporäre Speicherung bis Ende der Altersklasse bzw. Saisonende. Danach automatische Löschung.
- **Eigene Spieler**: Speicherung zur Leistungsanalyse; bei Weitergabe an Folgetrainer erfolgt Export und anschließende Löschung beim Scouter nach erfolgreicher Übergabe.
- **Datenarten**: Scouting-Metriken (Spielerfähigkeiten, Spielstatistiken), individuelle Notizen.
- **Speicherort**: Browser-IndexedDB (dezentral, lokal). Keine Übertragung an zentrale Server ohne explizite Export-Anfrage.

### 2.3 Einwilligung & Weitergabe
- Export eigener Spieler erfolgt nur nach ausdrücklicher Zustimmung der Erziehungsberechtigten oder volljähriger Spieler.
- Einwilligungs-Dialog wird vor jedem Export angezeigt und lokal protokolliert.

## 3. Datenminimierung & Zweckbindung
- Es werden nur die zur Scouting-Analyse notwendigen Daten erhoben.
- Fremdspieler-Daten werden automatisch gelöscht, um eine zweckgebundene Speicherung sicherzustellen.

## 4. Sicherheitsmaßnahmen
- **Verschlüsselung**: IndexedDB-Daten können optional im Client verschlüsselt werden.
- **Transport**: Alle externen Verbindungen (z.B. Export-API) erfolgen ausschließlich via HTTPS mit TLS.
- **Service Worker**: Caching nur von First-Party-Ressourcen.

## 5. Rechte der Betroffenen
- **Auskunft**: Kein zentrales Profil vorhanden. Scouter speichert die Daten lokal.
- **Löschung**: Fremdspieler-Daten werden automatisch gelöscht. Eigene Spieler-Daten können beim Scouter manuell gelöscht werden.

## 6. Kontakt
Bei Fragen zum Datenschutz wenden Sie sich an den Trainer/Scouter.