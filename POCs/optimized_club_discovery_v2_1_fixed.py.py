#!/usr/bin/env python3
"""
Optimized Club Discovery v2.1 (KORRIGIERT)
==========================================

Fehlerbehebungen:
1. ✅ Verbände aus /rest/wam/data laden (nicht hardcoded)
2. ✅ Korrekte Team-Extraktion aus entries[].team
3. ✅ Optimiertes Rate Limiting (100ms statt 300ms)

Autor: AI Assistant
Datum: Oktober 2025
"""

import requests
import json
import time
import re
from typing import Dict, List, Optional, Set, Tuple
from dataclasses import dataclass, field
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

@dataclass
class ClubInfo:
    """Informationen über einen Club"""
    club_id: int
    club_name: str
    team_variations: Set[str] = field(default_factory=set)
    ligen: List[Dict] = field(default_factory=list)
    teams: List[Dict] = field(default_factory=list)

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
    Optimierter Club-Discovery v2.1 (KORRIGIERT)
    """

    def __init__(self, base_url: str = "https://www.basketball-bund.net"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Optimized Club Discovery/2.1',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        })

        # Caching
        self.liga_cache = {}
        self.team_cache = {}
        self.verband_cache = None
        self.request_lock = threading.Lock()
        self.request_count = 0

        # Club-Name-Patterns
        self.team_number_patterns = [
            r'\s+([1-9]\d*)$',      # " 1", " 2", " 10" am Ende
            r'\s+([IVX]+)$',         # " I", " II", " III" (römisch)
            r'\s+(\d+)\.$',        # " 1.", " 2." mit Punkt
            r'\s+([A-Z])$'           # " A", " B" für Parallel-Teams
        ]

    def discover_clubs_by_verband(self, heimat_verband_id: int, max_workers: int = 5) -> List[ClubInfo]:
        """
        Hauptmethode: Entdeckt alle Clubs in einem Verband

        Args:
            heimat_verband_id: ID des Heimatverbands (< 20)
            max_workers: Parallel Workers für Team-Extraction

        Returns:
            Liste aller gefundenen Clubs zur Auswahl
        """
        print(f"🏀 Club-Discovery v2.1 (KORRIGIERT) - Verband {heimat_verband_id}")
        print("=" * 70)

        # Phase 1: Verband-Setup (KORRIGIERT: Aus API laden)
        print("\n📍 Phase 1: Verband-Setup")
        target_verbaende = self._setup_target_verbaende_from_api(heimat_verband_id)

        if not target_verbaende:
            print("❌ Keine Verbände gefunden")
            return []

        # Phase 2: Liga-Discovery (paginiert)
        print(f"\n🔍 Phase 2: Liga-Discovery ({len(target_verbaende)} Verbände)")
        all_ligen = []

        for verband_id in target_verbaende:
            ligen = self._discover_ligen_paginated(verband_id)
            if ligen:
                all_ligen.extend(ligen)
                print(f"   ✅ Verband {verband_id}: {len(ligen)} Liga(s)")

        print(f"\n📊 Insgesamt {len(all_ligen)} Liga(s) gefunden")

        if not all_ligen:
            print("❌ Keine Ligen gefunden")
            return []

        # Phase 3: Team-Extraction (KORRIGIERT: entries[].team)
        print(f"\n🏀 Phase 3: Team-Extraction (parallel, max_workers={max_workers})")

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_liga = {
                executor.submit(self._extract_teams_from_liga, liga.liga_id): liga 
                for liga in all_ligen
            }

            for future in as_completed(future_to_liga):
                liga = future_to_liga[future]
                try:
                    teams = future.result()
                    if teams:
                        liga.teams = teams
                except Exception as e:
                    pass  # Nicht alle Ligen haben Tabellen

        # Zähle extrahierte Teams
        all_teams = []
        ligen_with_teams = []
        for liga in all_ligen:
            if liga.teams:
                all_teams.extend([(team, liga) for team in liga.teams])
                ligen_with_teams.append(liga)

        print(f"   📋 {len(all_teams)} Team(s) aus {len(ligen_with_teams)} Liga(s) extrahiert")

        if not all_teams:
            print("❌ Keine Teams gefunden")
            return []

        # Phase 4: Club-Derivation
        print("\n🏢 Phase 4: Club-Derivation")
        clubs = self._derive_clubs_from_teams(all_teams)

        print(f"\n✅ Discovery abgeschlossen: {len(clubs)} Club(s) gefunden")
        print(f"📊 API-Requests: {self.request_count}")

        return clubs

    def _setup_target_verbaende_from_api(self, heimat_verband_id: int) -> List[int]:
        """
        KORRIGIERT: Lädt Verbände aus API statt hardcoded

        Args:
            heimat_verband_id: Heimatverband (< 20)

        Returns:
            Liste der Verband-IDs zum Durchsuchen
        """
        # Hole alle Verbände aus API
        if not self.verband_cache:
            print("   🔄 Lade Verbände aus API...")
            try:
                response = self._make_request('POST', '/rest/wam/data', {})
                if response and 'verbaende' in response:
                    self.verband_cache = response['verbaende']
                    print(f"   ✅ {len(self.verband_cache)} Verbände geladen")
                else:
                    print("   ❌ Keine Verbände in API-Response")
                    return [heimat_verband_id]  # Fallback
            except Exception as e:
                print(f"   ❌ Fehler beim Laden der Verbände: {e}")
                return [heimat_verband_id]  # Fallback

        # Extrahiere Verband-IDs
        all_verband_ids = [v['id'] for v in self.verband_cache if 'id' in v]

        # Filtere: Heimat + Sonstige (id > 20)
        target_verbaende = [heimat_verband_id]
        sonstige = [vid for vid in all_verband_ids if vid > 20]
        target_verbaende.extend(sonstige)

        print(f"   🎯 Heimatverband: {heimat_verband_id}")
        print(f"   📋 Zusätzliche Verbände (>20): {len(sonstige)}")
        print(f"   📊 Gesamt zu durchsuchen: {len(target_verbaende)}")

        return target_verbaende

    def _discover_ligen_paginated(self, verband_id: int, batch_size: int = 100) -> List[LigaInfo]:
        """
        Entdeckt alle Ligen eines Verbands mit Paginierung

        Args:
            verband_id: ID des Verbands
            batch_size: Initiale Batch-Größe

        Returns:
            Liste aller Ligen in diesem Verband
        """
        ligen = []
        start_index = 0

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

                # Sicherheits-Break
                if start_index > 5000:
                    print(f"   ⚠️ Sicherheits-Break bei {start_index} Ligen für Verband {verband_id}")
                    break

            except Exception as e:
                print(f"   ❌ Error bei Verband {verband_id}, Index {start_index}: {e}")
                break

        return ligen

    def _extract_teams_from_liga(self, liga_id: int) -> Optional[List[Dict]]:
        """
        KORRIGIERT: Extrahiert Teams aus entries[].team

        Args:
            liga_id: ID der Liga

        Returns:
            Liste der Teams oder None
        """
        if liga_id in self.team_cache:
            return self.team_cache[liga_id]

        try:
            response = self._make_request('GET', f'/rest/competition/table/id/{liga_id}')

            if not response or 'data' not in response:
                return None

            data = response['data']

            # KORRIGIERT: Teams aus tabelle.entries[].team extrahieren
            if 'tabelle' in data and 'entries' in data['tabelle']:
                teams = []
                for entry in data['tabelle']['entries']:
                    if 'team' in entry:
                        team = entry['team']

                        # Erweitere Team-Daten um Tabellen-Stats
                        team_with_stats = {
                            **team,
                            'rang': entry.get('rang'),
                            'anzspiele': entry.get('anzspiele'),
                            'anzGewinnpunkte': entry.get('anzGewinnpunkte'),
                            'anzVerlustpunkte': entry.get('anzVerlustpunkte'),
                            's': entry.get('s'),  # Siege
                            'n': entry.get('n'),  # Niederlagen
                            'koerbe': entry.get('koerbe'),
                            'gegenKoerbe': entry.get('gegenKoerbe'),
                            'korbdiff': entry.get('korbdiff'),
                            'liga_id': liga_id  # Wichtig für Zuordnung!
                        }
                        teams.append(team_with_stats)

                self.team_cache[liga_id] = teams
                return teams

        except Exception as e:
            # Nicht alle Ligen haben Tabellen
            pass

        return None

    def _derive_clubs_from_teams(self, teams_with_ligen: List[Tuple[Dict, LigaInfo]]) -> List[ClubInfo]:
        """
        Leitet Club-Namen aus Team-Namen ab und gruppiert

        Args:
            teams_with_ligen: Liste von (team, liga) Tuples

        Returns:
            Liste der gefundenen Clubs
        """
        club_map = {}  # club_id -> ClubInfo

        for team, liga in teams_with_ligen:
            club_id = team.get('clubId')
            team_name = team.get('teamname', '').strip()

            if not club_id or not team_name:
                continue

            # Club-Name aus Team-Name ableiten
            club_name = self._derive_club_name(team_name)

            # ClubInfo erstellen/erweitern
            if club_id not in club_map:
                club_map[club_id] = ClubInfo(
                    club_id=club_id,
                    club_name=club_name,
                    team_variations=set(),
                    ligen=[],
                    teams=[]
                )

            club_info = club_map[club_id]

            # Aktualisiere Club-Name falls konsistenter
            if len(club_name) < len(club_info.club_name):
                club_info.club_name = club_name

            # Team-Variante hinzufügen
            club_info.team_variations.add(team_name)
            club_info.teams.append(team)

            # Liga hinzufügen (falls noch nicht vorhanden)
            if liga not in club_info.ligen:
                club_info.ligen.append(liga)

        # Nach Anzahl Teams sortieren (größte Clubs zuerst)
        clubs = list(club_map.values())
        clubs.sort(key=lambda c: len(c.teams), reverse=True)

        return clubs

    def _derive_club_name(self, team_name: str) -> str:
        """
        Leitet Club-Namen aus Team-Namen ab

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

        # Pattern 2: Typische Suffixe entfernen (optional)
        # Vorsicht: Manche Club-Namen enthalten diese!
        # Nur entfernen wenn danach noch genug Text übrig
        suffixes_optional = [
            ' e.V.', ' e. V.', ' eV', ' EV'
        ]

        for suffix in suffixes_optional:
            if club_name.endswith(suffix):
                potential_name = club_name[:-len(suffix)].strip()
                if len(potential_name) >= 5:  # Mindestens 5 Zeichen
                    club_name = potential_name

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
        print("=" * 70)

        # Top 30 Clubs anzeigen
        display_clubs = clubs[:30]

        for i, club in enumerate(display_clubs, 1):
            team_count = len(club.teams)
            liga_count = len(club.ligen)

            # Beispiel-Teams anzeigen
            example_teams = sorted(list(club.team_variations))[:3]
            teams_str = ", ".join(example_teams)
            if len(club.team_variations) > 3:
                teams_str += f" (+{len(club.team_variations) - 3} weitere)"

            print(f"  {i:2d}. {club.club_name} (ClubID: {club.club_id})")
            print(f"      🏀 {team_count} Team(s) in {liga_count} Liga(s)")
            print(f"      📝 Teams: {teams_str}")
            print()

        if len(clubs) > 30:
            print(f"  ... und {len(clubs) - 30} weitere Clubs")

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
                    print(f"\n✅ Gewählt: {selected_club.club_name} (ClubID: {selected_club.club_id})")
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
        print("=" * 70)

        analysis = {
            'club_id': club.club_id,
            'club_name': club.club_name,
            'total_teams': len(club.teams),
            'total_ligen': len(club.ligen),
            'team_variations': list(club.team_variations),
            'ligen_by_category': {},
            'teams_detailed': [],
            'geographic_distribution': {},
            'best_teams': []
        }

        # Kategorisierung der Ligen
        for liga in club.ligen:
            category = f"{liga.altersklasse} {liga.geschlecht}"
            if category not in analysis['ligen_by_category']:
                analysis['ligen_by_category'][category] = []

            analysis['ligen_by_category'][category].append({
                'liga_id': liga.liga_id,
                'liga_name': liga.liga_name,
                'spielklasse': liga.spielklasse,
                'ebene': liga.ebene_name,
                'verband': liga.verband_name,
                'bezirk': liga.bezirk_name
            })

        # Teams detailliert
        for team in club.teams:
            analysis['teams_detailed'].append({
                'team_name': team.get('teamname'),
                'team_name_small': team.get('teamnameSmall'),
                'rang': team.get('rang'),
                'anzspiele': team.get('anzspiele'),
                'siege': team.get('s'),
                'niederlagen': team.get('n'),
                'punkte': team.get('anzGewinnpunkte'),
                'koerbe': team.get('koerbe'),
                'gegen_koerbe': team.get('gegenKoerbe'),
                'korbdifferenz': team.get('korbdiff')
            })

        # Beste Teams (nach Rang)
        teams_with_rank = [t for t in club.teams if t.get('rang') is not None]
        teams_with_rank.sort(key=lambda t: t.get('rang', 999))

        for team in teams_with_rank[:5]:
            analysis['best_teams'].append({
                'team_name': team.get('teamname'),
                'rang': team.get('rang'),
                'punkte': team.get('anzGewinnpunkte'),
                'bilanz': f"{team.get('s', 0)}:{team.get('n', 0)}"
            })

        # Geografische Verteilung
        verband_count = {}
        bezirk_count = {}
        ebene_count = {}

        for liga in club.ligen:
            verband = liga.verband_name
            bezirk = liga.bezirk_name or "Verbandsebene"
            ebene = liga.ebene_name

            verband_count[verband] = verband_count.get(verband, 0) + 1
            bezirk_count[bezirk] = bezirk_count.get(bezirk, 0) + 1
            ebene_count[ebene] = ebene_count.get(ebene, 0) + 1

        analysis['geographic_distribution'] = {
            'verbaende': verband_count,
            'bezirke': bezirk_count,
            'ebenen': ebene_count
        }

        # Ausgabe der Analyse
        print(f"\n📊 Zusammenfassung:")
        print(f"   🆔 Club-ID: {analysis['club_id']}")
        print(f"   🏀 Teams: {analysis['total_teams']}")
        print(f"   🏆 Ligen: {analysis['total_ligen']}")
        print(f"   📝 Team-Varianten: {len(analysis['team_variations'])}")

        print(f"\n🏆 Top 5 Teams (nach Tabellenplatz):")
        for team in analysis['best_teams']:
            print(f"   {team['rang']:2d}. {team['team_name']}")
            print(f"       Bilanz: {team['bilanz']}, Punkte: {team['punkte']}")

        print(f"\n🏀 Teams nach Kategorie:")
        for category, ligen in sorted(analysis['ligen_by_category'].items()):
            print(f"   {category}: {len(ligen)} Liga(s)")
            for liga in ligen[:3]:
                print(f"      • {liga['spielklasse']} - {liga['liga_name']}")

        print(f"\n🗺️ Geografische Verteilung:")
        print(f"   Verbände: {', '.join([f'{k} ({v})' for k, v in analysis['geographic_distribution']['verbaende'].items()])}")
        if len(analysis['geographic_distribution']['bezirke']) > 1:
            print(f"   Bezirke: {', '.join([f'{k} ({v})' for k, v in list(analysis['geographic_distribution']['bezirke'].items())[:5]])}")

        return analysis

    def _make_request(self, method: str, endpoint_or_url: str, data=None) -> Optional[Dict]:
        """
        KORRIGIERT: Optimiertes Rate Limiting (100ms statt 300ms)
        """
        with self.request_lock:
            self.request_count += 1
            time.sleep(0.1)  # 100ms Rate Limiting (vorher 300ms)

        try:
            # Prüfe ob endpoint oder full URL
            if endpoint_or_url.startswith('http'):
                url = endpoint_or_url
            else:
                url = f"{self.base_url}{endpoint_or_url}"

            if method == 'POST':
                response = self.session.post(url, json=data, timeout=10)
            else:
                response = self.session.get(url, timeout=10)

            response.raise_for_status()
            return response.json()

        except requests.RequestException as e:
            return None

# Hauptfunktion
def main_discovery_flow():
    """Hauptflow für Club-Discovery"""
    print("🏀 Optimized Club Discovery v2.1 (KORRIGIERT)")
    print("=" * 50)

    # Input: Heimatverband
    print("\n📍 Verfügbare Heimatverbände:")
    verbands_map = {
        1: "Berlin", 2: "Bayern", 3: "Baden-Württemberg", 
        4: "Brandenburg", 5: "Bremen", 6: "Hamburg",
        7: "Hessen", 8: "Mecklenburg-Vorpommern", 
        9: "Niedersachsen", 10: "Nordrhein-Westfalen",
        11: "Rheinland-Pfalz", 12: "Saarland", 
        13: "Sachsen", 14: "Sachsen-Anhalt",
        15: "Schleswig-Holstein", 16: "Thüringen"
    }

    for vid, vname in verbands_map.items():
        print(f"  {vid:2d} = {vname}")

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
        start_time = time.time()

        # Phase 1-4: Club-Discovery
        clubs = discovery.discover_clubs_by_verband(heimat_verband)

        discovery_time = time.time() - start_time
        print(f"\n⏱️ Discovery-Zeit: {discovery_time:.1f}s")

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
            filename = f"club_analysis_{selected_club.club_name.replace(' ', '_').replace('.', '')}_{timestamp}.json"

            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(analysis, f, ensure_ascii=False, indent=2)

            print(f"✅ Exportiert: {filename}")

        total_time = time.time() - start_time
        print(f"\n⏱️ Gesamt-Zeit: {total_time:.1f}s")

    except Exception as e:
        print(f"❌ Fehler: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main_discovery_flow()
