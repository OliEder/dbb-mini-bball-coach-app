// Temporary Fix für Spielplan-Anzeige nach Onboarding
// In SpielplanListe.tsx oder der Parent-Component

import { useEffect, useState } from 'react';
import { db } from '@/shared/db/database';

export function useOnboardingComplete() {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  
  useEffect(() => {
    // Check if onboarding is complete (teams exist in DB)
    async function checkOnboarding() {
      const teams = await db.teams.toArray();
      setIsOnboardingComplete(teams.length > 0);
    }
    checkOnboarding();
  }, []);
  
  return isOnboardingComplete;
}

// Verwendung:
// const onboardingComplete = useOnboardingComplete();
// if (!onboardingComplete) return null; // Spielplan nicht anzeigen
