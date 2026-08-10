export function setApiBaseUrl(url: string) {
  let baseUrl = url;
  try {
    const parsed = new URL(url);
    if (parsed.port === '8069') {
      parsed.port = '3000';
      baseUrl = parsed.origin;
    }
  } catch (e) {
    // Keep original
  }
  // Remove trailing slash for consistency
  baseUrl = baseUrl.replace(/\/+$/, '');
  localStorage.setItem('api_base_url', baseUrl);
}

export function getApiBaseUrl(): string {
  const isHttps = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
  const isCapacitor = typeof window !== 'undefined' && window.location && (
    window.location.origin.startsWith('capacitor://') ||
    !!(window as any).Capacitor?.isNativePlatform?.()
  );

  const saved = localStorage.getItem('api_base_url');
  if (saved) {
    // If loaded over HTTPS in a web browser, avoid insecure http:// URLs to prevent Mixed Content errors
    if (isHttps && !isCapacitor && saved.startsWith('http://')) {
      try {
        const parsedSaved = new URL(saved);
        if (parsedSaved.hostname === window.location.hostname) {
          return `https://${parsedSaved.host}`;
        }
      } catch (e) {
        // invalid URL
      }
      return '';
    }
    return saved;
  }

  const envApiUrl = import.meta.env.VITE_API_URL || '';

  if (import.meta.env.DEV || (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') || isCapacitor) {
    return envApiUrl || 'http://localhost:3000';
  }

  if (isHttps && !isCapacitor && envApiUrl.startsWith('http://')) {
    return '';
  }

  return envApiUrl;
}

export async function apiRequest(path: string, body: any) {
  let baseUrl = getApiBaseUrl();
  let url = path.startsWith('http') ? path : `${baseUrl}${path}`;

  const isHttps = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
  const isCapacitor = typeof window !== 'undefined' && window.location && (
    window.location.origin.startsWith('capacitor://') ||
    !!(window as any).Capacitor?.isNativePlatform?.()
  );

  // Safeguard: Automatically fix Mixed Content when page is served over HTTPS
  if (isHttps && !isCapacitor && url.startsWith('http://')) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === window.location.hostname) {
        url = `https://${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;
      } else {
        // Fallback to relative path on current HTTPS host proxy
        url = `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    } catch (e) {
      url = url.replace(/^http:\/\/[^\/]+/, '');
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      let errorMsg = text;
      try {
        const json = JSON.parse(text);
        if (json.message) errorMsg = json.message;
      } catch (e) {
        // Not JSON, keep text
      }
      throw new Error(`Erreur Serveur (${response.status}): ${errorMsg || 'Pas de réponse'}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Le serveur n'a pas renvoyé de JSON valide");
    }

    return await response.json();
  } catch (error: any) {
    console.error(`Request to ${url} failed:`, error);
    throw error;
  }
}
