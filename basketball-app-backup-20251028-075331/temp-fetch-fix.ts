  /**
   * Fetch mit CORS-Proxy Fallback
   * Fix: Verwende rest parameters statt arguments (TypeScript strict mode)
   */
  private async fetchWithFallback(url: string, options?: RequestInit): Promise<Response> {
    // Skip CORS proxies if URL is localhost (for testing)
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      return response;
    }

    // Versuche direkt (mit kürzerem Timeout)
    try {
      const response = await fetch(url, { 
        ...options, 
        signal: AbortSignal.timeout(2000) 
      });
      if (response.ok) {
        console.log('Direct fetch success');
        return response;
      }
    } catch (error) {
      console.warn('Direct fetch failed, trying CORS proxies', error);
    }

    // Versuche CORS-Proxies mit besserer Fehlerbehandlung
    const errors: Array<{proxy: string, error: any}> = [];
    
    for (const proxy of this.CORS_PROXIES) {
      try {
        const proxyUrl = proxy + encodeURIComponent(url);
        console.log(`Trying proxy: ${proxy}`);
        
        const response = await fetch(proxyUrl, { 
          ...options, 
          signal: AbortSignal.timeout(8000) 
        });
        
        // Prüfe Status explizit
        if (response.ok) {
          console.log('CORS proxy success:', proxy);
          return response;
        } else {
          errors.push({proxy, error: `Status ${response.status}`});
        }
      } catch (error) {
        errors.push({proxy, error});
        console.warn(`Proxy ${proxy} failed:`, error);
      }
    }

    // Detaillierte Fehlermeldung
    console.error('All CORS proxies failed:', errors);
    throw new Error(`All CORS proxies failed. Last error: ${JSON.stringify(errors)}`);
  }
