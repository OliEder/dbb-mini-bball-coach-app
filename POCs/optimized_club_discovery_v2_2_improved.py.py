#!/usr/bin/env python3
"""
Optimized Club Discovery v2.2 (IMPROVED)
========================================

Neue Features:
1. ✅ Paginierte Club-Auswahl (vor/zurück navigieren)
2. ✅ Erweiterte team_variations mit teamPermanentIds
3. ✅ Verbesserte Top-Teams mit Liga-Name und Korbdifferenz
4. ✅ Sortierung nach Rang und Punkten
5. ✅ Nur Teams die bereits gespielt haben

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
from collections import defaultdict
import threading

@dataclass
class TeamVariation:
    """Team-Variante mit permanenten IDs"""
    teamname: str
    team_permanent_ids: Set[int] = field(default_factory=set)
    team_competition_ids: Set[int] = field(default_factory=set)

@dataclass
class ClubInfo:
    """Informationen über einen Club"""
    club_id: int
    club_name: str
    team_variations: Dict[str, TeamVariation] = field(default_factory=dict)
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
    Optimierter Club-Discovery v2.2 (IMPROVED)
    """

    def __init__(self, base_url: str = "https://www.basketball-bund.net"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Optimized Club Discovery/2.2',
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
            r'\s+([1-9]\d*)$',
            r'\s+([IVX]+)$',
            r'\s+(\d+)\.$',
            r'\s+([A-Z])$'
        ]

    def discover_clubs_by_verband(self, heimat_verband_id: int, max_workers: int = 5) -> List[ClubInfo]:
        """Hauptmethode: Entdeckt alle Clubs in einem Verband"""
        print(f"🏀 Club-Discovery v2.2 (IMPROVED) - Verband {heimat_verband_id}")
        print("=" * 70)

        # Phase 1: Verband-Setup
        print("\n📍 Phase 1: Verband-Setup")
        target_verbaende = self._setup_target_verbaende_from_api(heimat_verband_id)

        if not target_verbaende:
            print("❌ Keine Verbände gefunden")
            return []

        # Phase 2: Liga-Discovery
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

        # Phase 3: Team-Extraction
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
                    pass

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
        """Lädt Verbände aus API"""
        if not self.verband_cache:
            print("   🔄 Lade Verbände aus API...")
            try:
                response = self._make_request('POST', '/rest/wam/data', {})
                if response and 'verbaende' in response:
                    self.verband_cache = response['verbaende']
                    print(f"   ✅ {len(self.verband_cache)} Verbände geladen")
                else:
                    print("   ❌ Keine Verbände in API-Response")
                    return [heimat_verband_id]
            except Exception as e:
                print(f"   ❌ Fehler beim Laden der Verbände: {e}")
                return [heimat_verband_id]

        all_verband_ids = [v['id'] for v in self.verband_cache if 'id' in v]
        target_verbaende = [heimat_verband_id]
        sonstige = [vid for vid in all_verband_ids if vid > 20]
        target_verbaende.extend(sonstige)

        print(f"   🎯 Heimatverband: {heimat_verband_id}")
        print(f"   📋 Zusätzliche Verbände (>20): {len(sonstige)}")
        print(f"   📊 Gesamt zu durchsuchen: {len(target_verbaende)}")

        return target_verbaende

    def _discover_ligen_paginated(self, verband_id: int, batch_size: int = 100) -> List[LigaInfo]:
        """Entdeckt alle Ligen eines Verbands mit Paginierung"""
        ligen = []
        start_index = 0

        while True:
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

                if not data.get('hasMoreData', False):
                    break

                current_size = data.get('size', len(current_ligen))
                start_index += current_size

                if start_index > 5000:
                    print(f"   ⚠️ Sicherheits-Break bei {start_index} Ligen für Verband {verband_id}")
                    break

            except Exception as e:
                print(f"   ❌ Error bei Verband {verband_id}, Index {start_index}: {e}")
                break

        return ligen

    def _extract_teams_from_liga(self, liga_id: int) -> Optional[List[Dict]]:
        """Extrahiert Teams aus entries[].team"""
        if liga_id in self.team_cache:
            return self.team_cache[liga_id]

        try:
            response = self._make_request('GET', f'/rest/competition/table/id/{liga_id}')

            if not response or 'data' not in response:
                return None

            data = response['data']

            if 'tabelle' in data and 'entries' in data['tabelle']:
                teams = []
                for entry in data['tabelle']['entries']:
                    if 'team' in entry:
                        team = entry['team']

                        team_with_stats = {
                            **team,
                            'rang': entry.get('rang'),
                            'anzspiele': entry.get('anzspiele'),
                            'anzGewinnpunkte': entry.get('anzGewinnpunkte'),
                            'anzVerlustpunkte': entry.get('anzVerlustpunkte'),
                            's': entry.get('s'),
                            'n': entry.get('n'),
                            'koerbe': entry.get('koerbe'),
                            'gegenKoerbe': entry.get('gegenKoerbe'),
                            'korbdiff': entry.get('korbdiff'),
                            'liga_id': liga_id
                        }
                        teams.append(team_with_stats)

                self.team_cache[liga_id] = teams
                return teams

        except Exception as e:
            pass

        return None

    def _derive_clubs_from_teams(self, teams_with_ligen: List[Tuple[Dict, LigaInfo]]) -> List[ClubInfo]:
        """
        Leitet Club-Namen aus Team-Namen ab und gruppiert
        IMPROVED: Sammelt teamPermanentIds pro Team-Variante
        """
        club_map = {}

        for team, liga in teams_with_ligen:
            club_id = team.get('clubId')
            team_name = team.get('teamname', '').strip()
            team_permanent_id = team.get('teamPermanentId')
            team_competition_id = team.get('seasonTeamId') or team.get('teamCompetitionId')

            if not club_id or not team_name:
                continue

            club_name = self._derive_club_name(team_name)

            if club_id not in club_map:
                club_map[club_id] = ClubInfo(
                    club_id=club_id,
                    club_name=club_name,
                    team_variations={},
                    ligen=[],
                    teams=[]
                )

            club_info = club_map[club_id]

            if len(club_name) < len(club_info.club_name):
                club_info.club_name = club_name

            # IMPROVED: Team-Variation mit IDs
            if team_name not in club_info.team_variations:
                club_info.team_variations[team_name] = TeamVariation(
                    teamname=team_name,
                    team_permanent_ids=set(),
                    team_competition_ids=set()
                )

            if team_permanent_id:
                club_info.team_variations[team_name].team_permanent_ids.add(team_permanent_id)
            if team_competition_id:
                club_info.team_variations[team_name].team_competition_ids.add(team_competition_id)

            club_info.teams.append(team)

            if liga not in club_info.ligen:
                club_info.ligen.append(liga)

        clubs = list(club_map.values())
        clubs.sort(key=lambda c: len(c.teams), reverse=True)

        return clubs

    def _derive_club_name(self, team_name: str) -> str:
        """Leitet Club-Namen aus Team-Namen ab"""
        original_name = team_name.strip()
        club_name = original_name

        for pattern in self.team_number_patterns:
            match = re.search(pattern, club_name)
            if match:
                club_name = club_name[:match.start()].strip()
                break

        suffixes_optional = [' e.V.', ' e. V.', ' eV', ' EV']

        for suffix in suffixes_optional:
            if club_name.endswith(suffix):
                potential_name = club_name[:-len(suffix)].strip()
                if len(potential_name) >= 5:
                    club_name = potential_name

        club_name = re.sub(r'\s+', ' ', club_name)

        if len(club_name) < 3:
            club_name = original_name

        return club_name

    def select_club_interactive_paginated(self, clubs: List[ClubInfo], page_size: int = 30) -> Optional[ClubInfo]:
        """
        IMPROVED: Paginierte Club-Auswahl mit Navigation

        Args:
            clubs: Liste verfügbarer Clubs
            page_size: Clubs pro Seite

        Returns:
            Gewählter Club oder None
        """
        if not clubs:
            print("❌ Keine Clubs gefunden")
            return None

        current_page = 0
        total_pages = (len(clubs) + page_size - 1) // page_size

        while True:
            start_idx = current_page * page_size
            end_idx = min(start_idx + page_size, len(clubs))
            page_clubs = clubs[start_idx:end_idx]

            # Seite anzeigen
            print(f"\n{'=' * 70}")
            print(f"📋 Club-Auswahl - Seite {current_page + 1}/{total_pages}")
            print(f"   Zeige Clubs {start_idx + 1}-{end_idx} von {len(clubs)}")
            print(f"{'=' * 70}\n")

            for i, club in enumerate(page_clubs, start=1):
                global_idx = start_idx + i
                team_count = len(club.teams)
                liga_count = len(club.ligen)

                example_teams = sorted(list(club.team_variations.keys()))[:3]
                teams_str = ", ".join(example_teams)
                if len(club.team_variations) > 3:
                    teams_str += f" (+{len(club.team_variations) - 3} weitere)"

                print(f"  {global_idx:3d}. {club.club_name} (ClubID: {club.club_id})")
                print(f"       🏀 {team_count} Team(s) in {liga_count} Liga(s)")
                print(f"       📝 Teams: {teams_str}")
                print()

            # Navigation-Optionen
            print("\n" + "=" * 70)
            print("Navigation:")
            if current_page > 0:
                print("  [z] = Zurück (vorherige Seite)")
            if current_page < total_pages - 1:
                print("  [v] = Vor (nächste Seite)")
            print("  [1-999] = Direkte Auswahl via Club-Nummer")
            print("  [q] = Beenden")
            print("=" * 70)

            # User-Input
            try:
                choice = input(f"\n🎯 Auswahl: ").strip().lower()

                if choice == 'q':
                    return None

                elif choice == 'z' and current_page > 0:
                    current_page -= 1
                    continue

                elif choice == 'v' and current_page < total_pages - 1:
                    current_page += 1
                    continue

                elif choice.isdigit():
                    idx = int(choice) - 1
                    if 0 <= idx < len(clubs):
                        selected_club = clubs[idx]
                        print(f"\n✅ Gewählt: {selected_club.club_name} (ClubID: {selected_club.club_id})")
                        return selected_club
                    else:
                        print(f"❌ Ungültige Nummer. Bitte 1-{len(clubs)} eingeben.")

                else:
                    print("❌ Ungültige Eingabe. Bitte 'z', 'v', Nummer oder 'q' eingeben.")

            except (ValueError, KeyboardInterrupt):
                print("\n🚫 Abgebrochen")
                return None

    def analyze_club_complete(self, club: ClubInfo) -> Dict:
        """
        IMPROVED: Vollständige Club-Analyse mit erweiterten Features
        """
        print(f"\n📊 Vollständige Analyse: {club.club_name}")
        print("=" * 70)

        # Liga-Lookup für Team-Zuordnung
        liga_lookup = {liga.liga_id: liga for liga in club.ligen}

        analysis = {
            'club_id': club.club_id,
            'club_name': club.club_name,
            'total_teams': len(club.teams),
            'total_ligen': len(club.ligen),
            'team_variations': [],  # IMPROVED Format
            'ligen_by_category': {},
            'teams_detailed': [],
            'geographic_distribution': {},
            'best_teams': []  # IMPROVED mit Liga-Name und Korbdiff
        }

        # IMPROVED: Team-Variations mit IDs
        for team_name, variation in sorted(club.team_variations.items()):
            analysis['team_variations'].append({
                'teamname': team_name,
                'teamPermanentIds': sorted(list(variation.team_permanent_ids)),
                'teamCompetitionIds': sorted(list(variation.team_competition_ids))
            })

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
            liga = liga_lookup.get(team.get('liga_id'))

            analysis['teams_detailed'].append({
                'team_name': team.get('teamname'),
                'team_name_small': team.get('teamnameSmall'),
                'team_permanent_id': team.get('teamPermanentId'),
                'season_team_id': team.get('seasonTeamId'),
                'liga_id': team.get('liga_id'),
                'liga_name': liga.liga_name if liga else None,
                'rang': team.get('rang'),
                'anzspiele': team.get('anzspiele'),
                'siege': team.get('s'),
                'niederlagen': team.get('n'),
                'punkte': team.get('anzGewinnpunkte'),
                'koerbe': team.get('koerbe'),
                'gegen_koerbe': team.get('gegenKoerbe'),
                'korbdifferenz': team.get('korbdiff')
            })

        # IMPROVED: Beste Teams (nur mit Spielen, sortiert nach Rang & Punkte)
        teams_with_games = [
            t for t in club.teams 
            if t.get('anzspiele', 0) > 0 and t.get('rang') is not None
        ]

        # Sortiere: 1. Rang, 2. Punkte (absteigend)
        teams_with_games.sort(key=lambda t: (t.get('rang', 999), -t.get('anzGewinnpunkte', 0)))

        for team in teams_with_games[:5]:
            liga = liga_lookup.get(team.get('liga_id'))
            liga_name = liga.liga_name if liga else "Unbekannte Liga"

            analysis['best_teams'].append({
                'team_name': team.get('teamname'),
                'liga_name': liga_name,  # IMPROVED
                'rang': team.get('rang'),
                'punkte': team.get('anzGewinnpunkte'),
                'bilanz': f"{team.get('s', 0)}:{team.get('n', 0)}",
                'korbdifferenz': team.get('korbdiff')  # IMPROVED
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

        # Ausgabe
        print(f"\n📊 Zusammenfassung:")
        print(f"   🆔 Club-ID: {analysis['club_id']}")
        print(f"   🏀 Teams: {analysis['total_teams']}")
        print(f"   🏆 Ligen: {analysis['total_ligen']}")
        print(f"   📝 Team-Varianten: {len(analysis['team_variations'])}")

        print(f"\n🏆 Top {min(5, len(analysis['best_teams']))} Teams (mit Spielen, sortiert nach Rang & Punkten):")
        for team in analysis['best_teams']:
            print(f"   {team['rang']:2d}. {team['team_name']} ({team['liga_name']})")
            print(f"       Bilanz: {team['bilanz']}, Punkte: {team['punkte']}, Korbdiff: {team['korbdifferenz']:+d}")

        print(f"\n🏀 Teams nach Kategorie:")
        for category, ligen in sorted(analysis['ligen_by_category'].items()):
            print(f"   {category}: {len(ligen)} Liga(s)")
            for liga in ligen[:3]:
                print(f"      • {liga['spielklasse']} - {liga['liga_name']}")

        print(f"\n🗺️ Geografische Verteilung:")
        print(f"   Verbände: {', '.join([f'{k} ({v})' for k, v in analysis['geographic_distribution']['verbaende'].items()])}")
        if len(analysis['geographic_distribution']['bezirke']) > 1:
            bezirke_str = ', '.join([f'{k} ({v})' for k, v in list(analysis['geographic_distribution']['bezirke'].items())[:5]])
            print(f"   Bezirke: {bezirke_str}")

        return analysis

    def _make_request(self, method: str, endpoint_or_url: str, data=None) -> Optional[Dict]:
        """Request mit optimiertem Rate Limiting"""
        with self.request_lock:
            self.request_count += 1
            time.sleep(0.1)

        try:
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
    print("🏀 Optimized Club Discovery v2.2 (IMPROVED)")
    print("=" * 50)

    verbands_map = {
        1: "Berlin", 2: "Bayern", 3: "Baden-Württemberg", 
        4: "Brandenburg", 5: "Bremen", 6: "Hamburg",
        7: "Hessen", 8: "Mecklenburg-Vorpommern", 
        9: "Niedersachsen", 10: "Nordrhein-Westfalen",
        11: "Rheinland-Pfalz", 12: "Saarland", 
        13: "Sachsen", 14: "Sachsen-Anhalt",
        15: "Schleswig-Holstein", 16: "Thüringen"
    }

    print("\n📍 Verfügbare Heimatverbände:")
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

    discovery = OptimizedClubDiscovery()

    try:
        start_time = time.time()

        clubs = discovery.discover_clubs_by_verband(heimat_verband)

        discovery_time = time.time() - start_time
        print(f"\n⏱️ Discovery-Zeit: {discovery_time:.1f}s")

        if not clubs:
            print("❌ Keine Clubs gefunden")
            return

        # IMPROVED: Paginierte Auswahl
        selected_club = discovery.select_club_interactive_paginated(clubs, page_size=30)

        if not selected_club:
            print("🚫 Keine Auswahl getroffen")
            return

        # IMPROVED: Erweiterte Analyse
        analysis = discovery.analyze_club_complete(selected_club)

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
