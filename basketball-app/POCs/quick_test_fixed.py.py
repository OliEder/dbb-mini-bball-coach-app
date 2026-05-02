#!/usr/bin/env python3
"""Quick-Test für korrigiertes Club-Discovery"""
import sys
sys.path.insert(0, '.')

# Teste die Hauptfunktionen
from optimized_club_discovery_v2_1_fixed import OptimizedClubDiscovery

discovery = OptimizedClubDiscovery()

print("🧪 Test 1: Verbände laden...")
verbaende = discovery._setup_target_verbaende_from_api(2)  # Bayern
print(f"   ✅ {len(verbaende)} Verbände gefunden")
print(f"   📋 Erste 5: {verbaende[:5]}")

print("\n🧪 Test 2: Liga-Discovery (Bayern, erste 20)...")
ligen = discovery._discover_ligen_paginated(2)
print(f"   ✅ {len(ligen)} Ligen gefunden")
if ligen:
    print(f"   📋 Erste Liga: {ligen[0].liga_name}")

print("\n🧪 Test 3: Team-Extraction...")
if ligen:
    teams = discovery._extract_teams_from_liga(ligen[0].liga_id)
    if teams:
        print(f"   ✅ {len(teams)} Teams extrahiert")
        print(f"   📋 Erstes Team: {teams[0].get('teamname')}")
        print(f"   📋 ClubID: {teams[0].get('clubId')}")
        print(f"   📋 Rang: {teams[0].get('rang')}")
    else:
        print("   ⚠️ Keine Teams (Liga hat evtl. keine Tabelle)")

print("\n✅ Alle Tests erfolgreich!")
print(f"📊 API-Requests: {discovery.request_count}")
