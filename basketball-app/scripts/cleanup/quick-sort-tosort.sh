#!/bin/bash
# Quick TO-SORT Cleanup - Batch Move

set -e
cd "$(dirname "$0")/../.."

echo "Verschiebe TO-SORT Dateien..."

# Testing
mv docs/TO-SORT/TEST-GUIDE.md docs/testing/ 2>/dev/null || true
mv docs/TO-SORT/TEST-KONZEPT.md docs/testing/ 2>/dev/null || true

# Development  
mv docs/TO-SORT/BUILD-FIXES.md docs/development/ 2>/dev/null || true
mv docs/TO-SORT/BUILD-TROUBLESHOOTING.md docs/development/ 2>/dev/null || true
mv docs/TO-SORT/SETUP.md docs/development/ 2>/dev/null || true
mv docs/TO-SORT/STATUS.md docs/development/ 2>/dev/null || true
mv docs/TO-SORT/entwicklungs-prompt.md docs/development/ 2>/dev/null || true

# Operations - Migrations
mv docs/TO-SORT/ONBOARDING-V2-FIX.md docs/operations/migrations/ 2>/dev/null || true
mv docs/TO-SORT/ONBOARDING-V2-UPDATE.md docs/operations/migrations/ 2>/dev/null || true
mv docs/TO-SORT/ONBOARDING_V3_MIGRATION.md docs/operations/migrations/ 2>/dev/null || true
mv docs/TO-SORT/REACT_ROUTER_MIGRATION.md docs/operations/migrations/ 2>/dev/null || true
mv docs/TO-SORT/PACT-V16-UPGRADE.md docs/operations/migrations/ 2>/dev/null || true
mv docs/TO-SORT/DBv7 docs/operations/migrations/ 2>/dev/null || true

# Operations - Bugfixes
mv docs/TO-SORT/FIX-BBBSyncService.md docs/operations/bugfixes/2025-10-30-BBBSyncService.md 2>/dev/null || true
mv docs/TO-SORT/PACKAGE-FIX.md docs/operations/bugfixes/2025-10-30-Package.md 2>/dev/null || true
mv docs/TO-SORT/VEREIN-DISCOVERY-UPDATE.md docs/operations/bugfixes/2025-10-30-VereinDiscovery.md 2>/dev/null || true

# Operations - Deployment
mv docs/TO-SORT/GITHUB-PAGES-SETUP.md docs/operations/deployment/ 2>/dev/null || true
mv docs/TO-SORT/GITHUB_PAGES_OLIEEDER.md docs/operations/deployment/ 2>/dev/null || true

# Planning - Roadmaps
mv docs/TO-SORT/IMPLEMENTATION-ROADMAP.md docs/planning/roadmaps/ 2>/dev/null || true
mv docs/TO-SORT/RELEASE-NOTES.md docs/planning/roadmaps/ 2>/dev/null || true
mv docs/TO-SORT/CHANGELOG.md docs/planning/roadmaps/ 2>/dev/null || true

# Planning - Concepts
mv docs/TO-SORT/SIMPLIFIED_ONBOARDING.md docs/planning/concepts/ 2>/dev/null || true
mv docs/TO-SORT/CRAWLER-*.md docs/planning/concepts/ 2>/dev/null || true
mv docs/TO-SORT/SPLIT-CLUBS.md docs/planning/concepts/ 2>/dev/null || true
mv docs/TO-SORT/STATISCHE-VERBAENDE.md docs/planning/concepts/ 2>/dev/null || true
mv docs/TO-SORT/Konzepte docs/planning/concepts/ 2>/dev/null || true

# Planning - Requirements
mv docs/TO-SORT/datenschutzerklarung.md docs/planning/requirements/ 2>/dev/null || true
mv docs/TO-SORT/requirements docs/planning/requirements/ 2>/dev/null || true
mv docs/TO-SORT/userflows docs/planning/requirements/ 2>/dev/null || true

# Archive
mv docs/TO-SORT/CLEANUP-ANALYSIS.md docs/archive/2025-10-30-CLEANUP-ANALYSIS.md 2>/dev/null || true
mv docs/TO-SORT/COMMIT-SUMMARY.md docs/archive/2025-10-30-COMMIT-SUMMARY.md 2>/dev/null || true
mv docs/TO-SORT/COMMIT_GITHUB_PAGES.md docs/archive/2025-10-30-COMMIT_GITHUB_PAGES.md 2>/dev/null || true
mv docs/TO-SORT/COMMIT_MESSAGE.md docs/archive/2025-10-30-COMMIT_MESSAGE.md 2>/dev/null || true
mv docs/TO-SORT/DEPLOYMENT_COMPLETE.md docs/archive/2025-10-30-DEPLOYMENT_COMPLETE.md 2>/dev/null || true
mv docs/TO-SORT/DOCS-CLEANUP-*.md docs/archive/ 2>/dev/null || true
mv docs/TO-SORT/GIT-COMMIT-READY.md docs/archive/2025-10-30-GIT-COMMIT-READY.md 2>/dev/null || true
mv docs/TO-SORT/SECURITY-*.md docs/archive/ 2>/dev/null || true
mv docs/TO-SORT/DOCUMENTATION-INDEX.md docs/archive/2025-10-30-DOCUMENTATION-INDEX.md 2>/dev/null || true
mv "docs/TO-SORT/README Kopie.md" docs/archive/2025-10-30-README-Kopie.md 2>/dev/null || true

echo "✓ Fertig! Prüfe verbleibende Dateien:"
ls -la docs/TO-SORT/ 2>/dev/null || echo "TO-SORT ist leer oder gelöscht"
