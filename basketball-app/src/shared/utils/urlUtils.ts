/**
 * URL Utilities
 * 
 * Helfer-Funktionen für URL-Verarbeitung
 */

/**
 * Extrahiert Liga-ID aus verschiedenen DBB URL-Formaten
 * 
 * Unterstützte Formate:
 * - ...?liga_id=12345
 * - ...&liga_id=12345
 * - .../liga/12345/...
 * - .../id/12345/...
 * 
 * @param url - URL String
 * @returns Liga-ID als Number oder null
 */
export function extractLigaIdFromUrl(url: string): number | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Methode 1: Query Parameter (liga_id, ligaid, id)
  try {
    // Parse URL auch wenn sie relativ ist
    const fullUrl = url.startsWith('http') ? url : `https://dummy.com/${url}`;
    const urlObj = new URL(fullUrl);
    
    // Verschiedene Parameter-Namen prüfen
    const paramNames = ['liga_id', 'ligaid', 'id', 'ligaId', 'LigaId'];
    
    for (const paramName of paramNames) {
      const value = urlObj.searchParams.get(paramName);
      if (value) {
        const ligaId = parseInt(value, 10);
        if (!isNaN(ligaId) && ligaId > 0) {
          return ligaId;
        }
      }
    }
  } catch (e) {
    // URL parsing failed, try regex
  }

  // Methode 2: Regex für Query Parameter
  const queryRegexes = [
    /[?&]liga_id=(\d+)/i,
    /[?&]ligaid=(\d+)/i,
    /[?&]id=(\d+)/i,
  ];

  for (const regex of queryRegexes) {
    const match = url.match(regex);
    if (match && match[1]) {
      const ligaId = parseInt(match[1], 10);
      if (!isNaN(ligaId) && ligaId > 0) {
        return ligaId;
      }
    }
  }

  // Methode 3: Path-basierte IDs (/liga/12345/, /id/12345/)
  const pathRegexes = [
    /\/liga\/(\d+)/i,
    /\/id\/(\d+)/i,
    /\/competition\/(\d+)/i,
  ];

  for (const regex of pathRegexes) {
    const match = url.match(regex);
    if (match && match[1]) {
      const ligaId = parseInt(match[1], 10);
      if (!isNaN(ligaId) && ligaId > 0) {
        return ligaId;
      }
    }
  }

  return null;
}

/**
 * Normalisiert BBB URLs
 * - Entfernt print=1 Parameter
 * - Fügt https:// hinzu wenn fehlt
 * - Entfernt trailing slashes
 */
export function normalizeBBBUrl(url: string): string {
  if (!url) return '';

  let normalized = url.trim();

  // Add protocol if missing
  if (!normalized.startsWith('http')) {
    normalized = 'https://www.basketball-bund.net/' + normalized;
  }

  try {
    const urlObj = new URL(normalized);
    
    // Remove print parameter
    urlObj.searchParams.delete('print');
    
    // Remove trailing slash
    let result = urlObj.toString();
    if (result.endsWith('/')) {
      result = result.slice(0, -1);
    }
    
    return result;
  } catch {
    return url;
  }
}

/**
 * Erstellt BBB API URLs
 */
export const BBBUrls = {
  tabelle: (ligaId: number) => 
    `https://www.basketball-bund.net/rest/competition/table/id/${ligaId}`,
    
  spielplan: (ligaId: number) => 
    `https://www.basketball-bund.net/rest/competition/spielplan/id/${ligaId}`,
    
  matchInfo: (matchId: number) => 
    `https://www.basketball-bund.net/rest/match/id/${matchId}/matchInfo`,
    
  // Legacy HTML URLs (for parsing)
  htmlTabelle: (ligaId: number) =>
    `https://www.basketball-bund.net/public/tabelle.jsp?print=1&viewDescKey=sport.dbb.views.TabellePublicView/index.jsp_&liga_id=${ligaId}`,
    
  htmlSpielplan: (ligaId: number) =>
    `https://www.basketball-bund.net/public/ergebnisse.jsp?print=1&viewDescKey=sport.dbb.liga.ErgebnisseViewPublic/index.jsp_&liga_id=${ligaId}`,
};

/**
 * Prüft ob eine URL eine BBB URL ist
 */
export function isBBBUrl(url: string): boolean {
  if (!url) return false;
  
  const bbbDomains = [
    'basketball-bund.net',
    'www.basketball-bund.net',
    'dbb.basketball-bund.net',
  ];
  
  return bbbDomains.some(domain => url.includes(domain));
}
