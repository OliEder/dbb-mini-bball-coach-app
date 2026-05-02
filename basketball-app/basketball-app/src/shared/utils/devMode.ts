/**
 * Dev Mode Utilities
 * 
 * Helper-Funktionen für Development-Features
 */

/**
 * Prüft ob die App im Development Mode läuft
 */
export function isDevelopment(): boolean {
  return typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;
}

/**
 * Prüft ob Real API Mode aktiviert ist (nur in Dev relevant)
 * 
 * @returns true wenn echte APIs verwendet werden sollen, false für Mock-Daten
 */
export function useRealApiMode(): boolean {
  // In Production immer echte API verwenden
  if (!isDevelopment()) {
    return true;
  }
  
  // In Dev: Check localStorage Setting
  return localStorage.getItem('dev_use_real_api') === 'true';
}

/**
 * Event Listener für API Mode Changes
 * Services können darauf reagieren wenn der Toggle umgeschaltet wird
 */
export function onApiModeChanged(callback: (useRealApi: boolean) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ useRealApi: boolean }>;
    callback(customEvent.detail.useRealApi);
  };
  
  window.addEventListener('dev-api-mode-changed', handler);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('dev-api-mode-changed', handler);
  };
}
