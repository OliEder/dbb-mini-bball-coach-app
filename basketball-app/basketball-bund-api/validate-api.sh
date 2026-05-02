#!/bin/bash
# API Validation Script
# Validiert die korrigierte API-Spec gegen echte Endpoints

echo "==================================="
echo "BBB API Validation Script"
echo "Date: $(date)"
echo "==================================="

BASE_URL="https://www.basketball-bund.net"

# Test 1: WAM Data - Initial Request
echo -e "\n📝 Test 1: WAM Data (Initial - Token 0)"
echo "----------------------------------------"
curl -X POST "$BASE_URL/rest/wam/data" \
  -H "Content-Type: application/json" \
  -d '{
    "token": 0,
    "verbandIds": [],
    "gebietIds": [],
    "ligatypIds": [],
    "akgGeschlechtIds": [],
    "altersklasseIds": [],
    "spielklasseIds": [],
    "sortBy": 1
  }' \
  -s | jq '.data | {verbaende: (.verbaende | length), hasData: (. != null)}'

# Test 2: WAM Data - Bayern mit Altersklassen
echo -e "\n📝 Test 2: WAM Data (Bayern - Token 1)"
echo "----------------------------------------"
curl -X POST "$BASE_URL/rest/wam/data" \
  -H "Content-Type: application/json" \
  -d '{
    "token": 1,
    "verbandIds": [2],
    "gebietIds": [],
    "ligatypIds": [],
    "akgGeschlechtIds": [],
    "altersklasseIds": [],
    "spielklasseIds": [],
    "sortBy": 1
  }' \
  -s | jq '.data | {altersklassen: (.altersklassen | length), gebiete: (.gebiete | length)}'

# Test 3: Liga Tabelle
echo -e "\n📝 Test 3: Liga Tabelle"
echo "----------------------------------------"
curl -X GET "$BASE_URL/rest/competition/table/id/51227" \
  -H "Accept: application/json" \
  -s | jq '.data | {ligaId: .ligaId, liganame: .liganame, teams: (.teams | length)}'

# Test 4: Spielplan
echo -e "\n📝 Test 4: Spielplan"
echo "----------------------------------------"
curl -X GET "$BASE_URL/rest/competition/spielplan/id/51227" \
  -H "Accept: application/json" \
  -s | jq '.data | {ligaId: .ligaId, spiele: (.spielplan | length)}'

# Test 5: Match Info
echo -e "\n📝 Test 5: Match Info"
echo "----------------------------------------"
curl -X GET "$BASE_URL/rest/match/id/1551337/matchInfo" \
  -H "Accept: application/json" \
  -s | jq '.data | {akgId: .akgId, heim: .heimmannschaft, gast: .gastmannschaft}'

echo -e "\n✅ Validation Complete"
echo "==================================="
