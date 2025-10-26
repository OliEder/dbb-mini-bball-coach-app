#!/usr/bin/env python3
"""
Optimierter Club-Discovery-Algorithmus v2.0
==========================================

Neuer Ansatz mit /rest/wam/liga/list Endpunkt:
- Paginierung über startAtIndex Parameter
- Direkte Liga-Listen ohne 10-Liga-Limit
- Club-Name-Ableitung aus Team-Namen
- Optimierte Verband-Suche (Heimat + Sonstige)

Autor: AI Assistant
Datum: Oktober 2025
"""

import requests
import json
import time
import re
from typing import Dict, List, Optional, Set, Tuple
from dataclasses import dataclass
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

@dataclass
class ClubInfo:
    """Informationen über einen Club"""
    club_name: str
    team_variations: Set[str]  # Alle Team-Namen-Varianten
    ligen: List[Dict]  # Ligen wo Club aktiv ist
    teams: List[Dict]  # Alle Teams des Clubs

@dataclass
class LigaInfo:
    """Erweiterte Liga-Informationen"""
    liga_id: int
    liga_name: str
    verband_id: int
    verband_name: str
    bezirk_name: Optional[str]
    kreis_name: Optional[str]
    altersklasse: str
    geschlecht: str
    spielklasse: str
    ebene_name: str
    teams: List[Dict] = None

class OptimizedClubDiscovery:
    """
    Optimierter Club-Discovery mit neuem /rest/wam/liga/list Endpunkt

    Workflow:
    1. Verband-Setup: Heimatverband + Sonstige (id > 20)
    2. Liga-Discovery: Paginierte Suche durch alle Ligen
    3. Team-Extraction: Teams aus gefundenen Ligen
    4. Club-Derivation: Club-Namen aus Team-Namen ableiten
    5. Club-Selection: User wählt Club aus
    6. Complete-Analysis: Alle Ligen/Teams des gewählten Clubs
    """

    def __init__(self, base_url: str = "https://www.basketball-bund.net"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Optimized Club Discovery/2.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })

        # Caching
        self.liga_cache = {}
        self.team_cache = {}
        self.request_lock = threading.Lock()
        self.request_count = 0

        # Club-Name-Patterns
        self.team_number_patterns = [
            r'\s+([1-9]\d*)$',      # " 1", " 2", " 10" am Ende
            r'\s+([IVX]+)$',         # " I", " II", " III" (römisch)
            r'\s+(\d+)\.$',        # " 1.", " 2." mit Punkt
            r'\s+([A-Z])$'           # " A", " B" für Parallel-Teams
        ]

    def discover_clubs_by_verband(self, heimat_verband_id: int) -> List[ClubInfo]:
        """
        Hauptmethode: Entdeckt alle Clubs in einem Verband

        Args:
            heimat_verband_id: ID des Heimatverbands (< 20)

        Returns:
            Liste aller gefundenen Clubs zur Auswahl
        """
        print(f"🏀 Club-Discovery v2.0 - Verband {heimat_verband_id}")
        print("=" * 60)

        # Phase 1: Verband-Setup
        print("\n📍 Phase 1: Verband-Setup")
        target_verbaende = self._setup_target_verbaende(heimat_verband_id)

        # Phase 2: Liga-Discovery (paginiert)
        print(f"\n🔍 Phase 2: Liga-Discovery ({len(target_verbaende)} Verbände)")
        all_ligen = []
        for verband_id in target_verbaende:
            ligen = self._discover_ligen_paginated(verband_id)
            all_ligen.extend(ligen)
            print(f"   ✅ Verband {verband_id}: {len(ligen)} Liga(s)")

        print(f"\n📊 Insgesamt {len(all_ligen)} Liga(s) gefunden")

        # Phase 3: Team-Extraction
        print("\n🏀 Phase 3: Team-Extraction")
        all_teams = []
        for liga in all_ligen:
            teams = self._extract_teams_from_liga(liga.liga_id)
            if teams:
                liga.teams = teams
                all_teams.extend(teams)

        print(f"   📋 Insgesamt {len(all_teams)} Team(s) extrahiert")

        # Phase 4: Club-Derivation
        print("\n🏢 Phase 4: Club-Derivation")
        clubs = self._derive_clubs_from_teams(all_teams, all_ligen)

        print(f"\n✅ Discovery abgeschlossen: {len(clubs)} Club(s) gefunden")
        print(f"📊 API-Requests: {self.request_count}")

        return clubs

    def _setup_target_verbaende(self, heimat_verband_id: int) -> List[int]:
        """
        Setup der Ziel-Verbände: Heimatverband + Sonstige (id > 20)

        Args:
            heimat_verband_id: Heimatverband (< 20)

        Returns:
            Liste der Verband-IDs zum Durchsuchen
        """
        # Basis: Heimatverband
        target_verbaende = [heimat_verband_id]

        # Erweitert: Alle Verbände > 20 (regionale/spezielle Verbände)
        # Diese IDs sind empirisch ermittelt und können erweitert werden
        sonstige_verbaende = [
            21, 22, 23, 24, 25, 26, 27, 28, 29, 30,  # Regionale Verbände
            31, 32, 33, 34, 35, 36, 37, 38, 39, 40,  # Spezial-Verbände
            41, 42, 43, 44, 45, 46, 47, 48, 49, 50   # Weitere Verbände
        ]

        target_verbaende.extend(sonstige_verbaende)

        print(f"   🎯 Heimatverband: {heimat_verband_id}")
        print(f"   📋 Zusätzliche Verbände: {len(sonstige_verbaende)}")

        return target_verbaende

    def _discover_ligen_paginated(self, verband_id: int) -> List[LigaInfo]:
        """
        Entdeckt alle Ligen eines Verbands mit Paginierung

        Args:
            verband_id: ID des Verbands

        Returns:
            Liste aller Ligen in diesem Verband
        """
        ligen = []
        start_index = 0
        page_size = 50  # Anfangs-Seitengröße

        while True:
            # Request mit Paginierung
            payload = {
                "token": 0,
                "verbandIds": [verband_id],
                "gebietIds": [],
                "ligatypIds": [],
                "akgGeschlechtIds": [],
                "altersklasseIds": [],
                "spielklasseIds": [],
            }

            url = f"{self.base_url}/rest/wam/liga/list?startAtIndex={start_index}"

            try:
                response = self._make_request('POST', url, payload)
                if not response or 'data' not in response:
                    break

                data = response['data']
                current_ligen = data.get('ligen', [])

                # Konvertiere zu LigaInfo-Objekten
                for liga_data in current_ligen:
                    liga = LigaInfo(
                        liga_id=liga_data.get('ligaId'),
                        liga_name=liga_data.get('liganame', ''),
                        verband_id=liga_data.get('verbandId'),
                        verband_name=liga_data.get('verbandName', ''),
                        bezirk_name=liga_data.get('bezirkName'),
                        kreis_name=liga_data.get('kreisname'),
                        altersklasse=liga_data.get('akName', ''),
                        geschlecht=liga_data.get('geschlecht', ''),
                        spielklasse=liga_data.get('skName', ''),
                        ebene_name=liga_data.get('skEbeneName', '')
                    )
                    ligen.append(liga)

                # Paginierung prüfen
                if not data.get('hasMoreData', False):
                    break

                # Nächste Seite
                current_size = data.get('size', len(current_ligen))
                start_index += current_size

                # Sicherheits-Break bei zu vielen Ligen
                if start_index > 10000:
                    print(f"   ⚠️ Sicherheits-Break bei {start_index} Ligen")
                    break

            except Exception as e:
                print(f"   ❌ Error bei Verband {verband_id}, Index {start_index}: {e}")
                break

        return ligen

    def _extract_teams_from_liga(self, liga_id: int) -> Optional[List[Dict]]:
        """
        Extrahiert Teams aus Liga (cached)

        Args:
            liga_id: ID der Liga

        Returns:
            Liste der Teams oder None
        """
        if liga_id in self.team_cache:
            return self.team_cache[liga_id]

        try:
            response = self._make_request('GET', f'/rest/competition/table/id/{liga_id}')
            if response and 'teams' in response:
                teams = response['teams']
                self.team_cache[liga_id] = teams
                return teams
        except Exception as e:
            # Nicht alle Ligen haben Teams/Tabellen
            pass

        return None

    def _derive_clubs_from_teams(self, all_teams: List[Dict], all_ligen: List[LigaInfo]) -> List[ClubInfo]:
        """
        Leitet Club-Namen aus Team-Namen ab und gruppiert

        Args:
            all_teams: Alle gefundenen Teams
            all_ligen: Alle Ligen für Zuordnung

        Returns:
            Liste der gefundenen Clubs
        """
        club_map = {}  # club_name -> ClubInfo

        # Liga-Lookup für Teams
        liga_lookup = {liga.liga_id: liga for liga in all_ligen}

        for team in all_teams:
            team_name = team.get('teamName', '').strip()
            if not team_name:
                continue

            # Club-Name aus Team-Name ableiten
            club_name = self._derive_club_name(team_name)

            # ClubInfo erstellen/erweitern
            if club_name not in club_map:
                club_map[club_name] = ClubInfo(
                    club_name=club_name,
                    team_variations=set(),
                    ligen=[],
                    teams=[]
                )

            club_info = club_map[club_name]
            club_info.team_variations.add(team_name)
            club_info.teams.append(team)

            # Liga zuordnen (falls nicht bereits vorhanden)
            team_liga_id = team.get('ligaId')  # Muss aus Context ermittelt werden
            if team_liga_id and team_liga_id in liga_lookup:
                liga = liga_lookup[team_liga_id]
                if liga not in club_info.ligen:
                    club_info.ligen.append(liga)

        # Nach Anzahl Teams sortieren (größte Clubs zuerst)
        clubs = list(club_map.values())
        clubs.sort(key=lambda c: len(c.teams), reverse=True)

        return clubs

    def _derive_club_name(self, team_name: str) -> str:
        """
        Leitet Club-Namen aus Team-Namen ab

        Logik:
        - Entfernt Zahlen/Buchstaben am Ende (1, 2, I, II, A, B)
        - Entfernt typische Team-Suffixe
        - Normalisiert Vereins-Namen

        Args:
            team_name: Original Team-Name

        Returns:
            Abgeleiteter Club-Name
        """
        original_name = team_name.strip()
        club_name = original_name

        # Pattern 1: Zahlen am Ende entfernen ("Team 1" -> "Team")
        for pattern in self.team_number_patterns:
            match = re.search(pattern, club_name)
            if match:
                club_name = club_name[:match.start()].strip()
                break

        # Pattern 2: Typische Suffixe entfernen
        suffixes_to_remove = [
            ' e.V.', ' e. V.', ' eV', ' EV',
            ' Basketball', ' Baskets', ' BC', ' BBV',
            ' Damen', ' Herren', ' Ladies', ' Men'
        ]

        for suffix in suffixes_to_remove:
            if club_name.endswith(suffix):
                club_name = club_name[:-len(suffix)].strip()

        # Pattern 3: Mehrfache Leerzeichen normalisieren
        club_name = re.sub(r'\s+', ' ', club_name)

        # Fallback: Wenn zu stark gekürzt, Original verwenden
        if len(club_name) < 3:
            club_name = original_name

        return club_name

    def select_club_interactive(self, clubs: List[ClubInfo]) -> Optional[ClubInfo]:
        """
        Interaktive Club-Auswahl durch User

        Args:
            clubs: Liste verfügbarer Clubs

        Returns:
            Gewählter Club oder None
        """
        if not clubs:
            print("❌ Keine Clubs gefunden")
            return None

        print(f"\n📋 {len(clubs)} Club(s) gefunden:")
        print("=" * 60)

        # Top 20 Clubs anzeigen
        display_clubs = clubs[:20]

        for i, club in enumerate(display_clubs, 1):
            team_count = len(club.teams)
            liga_count = len(club.ligen)

            # Beispiel-Teams anzeigen
            example_teams = list(club.team_variations)[:3]
            teams_str = ", ".join(example_teams)
            if len(club.team_variations) > 3:
                teams_str += f" (+{len(club.team_variations) - 3} weitere)"

            print(f"  {i:2d}. {club.club_name}")
            print(f"      🏀 {team_count} Team(s) in {liga_count} Liga(s)")
            print(f"      📝 Teams: {teams_str}")
            print()

        if len(clubs) > 20:
            print(f"  ... und {len(clubs) - 20} weitere Clubs")

        # User-Auswahl
        while True:
            try:
                choice = input(f"\n🎯 Wähle Club (1-{len(display_clubs)}) oder 'q' zum Beenden: ").strip()

                if choice.lower() == 'q':
                    return None

                if not choice:
                    continue

                idx = int(choice) - 1
                if 0 <= idx < len(display_clubs):
                    selected_club = display_clubs[idx]
                    print(f"\n✅ Gewählt: {selected_club.club_name}")
                    return selected_club
                else:
                    print(f"❌ Ungültige Auswahl. Bitte 1-{len(display_clubs)} eingeben.")

            except (ValueError, KeyboardInterrupt):
                print("\n🚫 Abgebrochen")
                return None

    def analyze_club_complete(self, club: ClubInfo) -> Dict:
        """
        Vollständige Analyse des gewählten Clubs

        Args:
            club: Gewählter Club

        Returns:
            Detaillierte Club-Analyse
        """
        print(f"\n📊 Vollständige Analyse: {club.club_name}")
        print("=" * 60)

        analysis = {
            'club_name': club.club_name,
            'total_teams': len(club.teams),
            'total_ligen': len(club.ligen),
            'team_variations': list(club.team_variations),
            'ligen_by_category': {},
            'teams_by_altersklasse': {},
            'geographic_distribution': {},
            'detailed_teams': []
        }

        # Kategorisierung der Ligen
        for liga in club.ligen:
            category = f"{liga.altersklasse} {liga.geschlecht}"
            if category not in analysis['ligen_by_category']:
                analysis['ligen_by_category'][category] = []
            analysis['ligen_by_category'][category].append({
                'liga_name': liga.liga_name,
                'spielklasse': liga.spielklasse,
                'ebene': liga.ebene_name,
                'verband': liga.verband_name
            })

        # Teams nach Altersklasse
        for team in club.teams:
            # Team der Liga zuordnen (vereinfacht)
            altersklasse = "Unbekannt"  # Müsste aus Liga-Context ermittelt werden

            if altersklasse not in analysis['teams_by_altersklasse']:
                analysis['teams_by_altersklasse'][altersklasse] = []

            analysis['teams_by_altersklasse'][altersklasse].append({
                'team_name': team.get('teamName'),
                'position': team.get('position'),
                'points': team.get('points'),
                'wins': team.get('wins'),
                'losses': team.get('losses')
            })

        # Geografische Verteilung
        verband_count = {}
        bezirk_count = {}

        for liga in club.ligen:
            verband = liga.verband_name
            bezirk = liga.bezirk_name or "Verbandsebene"

            verband_count[verband] = verband_count.get(verband, 0) + 1
            bezirk_count[bezirk] = bezirk_count.get(bezirk, 0) + 1

        analysis['geographic_distribution'] = {
            'verbaende': verband_count,
            'bezirke': bezirk_count
        }

        # Ausgabe der Analyse
        print(f"📊 Zusammenfassung:")
        print(f"   🏀 Teams: {analysis['total_teams']}")
        print(f"   🏆 Ligen: {analysis['total_ligen']}")
        print(f"   📝 Team-Varianten: {len(analysis['team_variations'])}")

        print(f"\n🏀 Teams nach Kategorie:")
        for category, ligen in analysis['ligen_by_category'].items():
            print(f"   {category}: {len(ligen)} Liga(s)")

        print(f"\n🗺️ Geografische Verteilung:")
        for verband, count in analysis['geographic_distribution']['verbaende'].items():
            print(f"   {verband}: {count} Liga(s)")

        return analysis

    def _make_request(self, method: str, url: str, data=None) -> Optional[Dict]:
        """Thread-safe Request mit Rate Limiting"""
        with self.request_lock:
            self.request_count += 1
            time.sleep(0.3)  # Rate Limiting

        try:
            if method == 'POST':
                response = self.session.post(url, json=data)
            else:
                response = self.session.get(url)

            response.raise_for_status()
            return response.json()

        except requests.RequestException as e:
            return None

# Hauptfunktion für Demo
def main_discovery_flow():
    """Hauptflow für Club-Discovery"""
    print("🏀 Optimized Club Discovery v2.0")
    print("=" * 50)

    # Input: Heimatverband
    print("\n📍 Verfügbare Heimatverbände (Auswahl):")
    print("   1 = Berlin")
    print("   2 = Bayern") 
    print("   3 = Baden-Württemberg")
    print("   4 = Brandenburg")
    print("   5 = Bremen")
    print("   6 = Hamburg")
    print("   7 = Hessen")
    print("   8 = Mecklenburg-Vorpommern")
    print("   9 = Niedersachsen")
    print("  10 = Nordrhein-Westfalen")
    print("  11 = Rheinland-Pfalz")
    print("  12 = Saarland")
    print("  13 = Sachsen")
    print("  14 = Sachsen-Anhalt")
    print("  15 = Schleswig-Holstein")
    print("  16 = Thüringen")

    try:
        heimat_verband = int(input("\n🏠 Heimatverband wählen (1-16): "))
        if not 1 <= heimat_verband <= 16:
            print("❌ Ungültiger Verband")
            return
    except (ValueError, KeyboardInterrupt):
        print("\n🚫 Abgebrochen")
        return

    # Discovery starten
    discovery = OptimizedClubDiscovery()

    try:
        # Phase 1-4: Club-Discovery
        clubs = discovery.discover_clubs_by_verband(heimat_verband)

        if not clubs:
            print("❌ Keine Clubs gefunden")
            return

        # Phase 5: Club-Selection
        selected_club = discovery.select_club_interactive(clubs)

        if not selected_club:
            print("🚫 Keine Auswahl getroffen")
            return

        # Phase 6: Complete Analysis
        analysis = discovery.analyze_club_complete(selected_club)

        # Export-Option
        export_choice = input("\n💾 Analyse als JSON exportieren? (j/n): ").strip().lower()
        if export_choice == 'j':
            timestamp = int(time.time())
            filename = f"club_analysis_{selected_club.club_name.replace(' ', '_')}_{timestamp}.json"

            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(analysis, f, ensure_ascii=False, indent=2)

            print(f"✅ Exportiert: {filename}")

    except Exception as e:
        print(f"❌ Fehler: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main_discovery_flow()
