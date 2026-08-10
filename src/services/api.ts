export function setApiBaseUrl(url: string) {
  const isHttps = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
  const isCapacitor = typeof window !== 'undefined' && window.location && (
    window.location.origin.startsWith('capacitor://') ||
    !!(window as any).Capacitor?.isNativePlatform?.()
  );

  if (isHttps && !isCapacitor && url.startsWith('http:')) {
    localStorage.removeItem('api_base_url');
    return;
  }

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

  // When running as a web application over HTTPS, ALWAYS return empty string for relative paths
  // to prevent any Mixed Content issues with HTTP IP targets.
  if (isHttps && !isCapacitor) {
    const saved = localStorage.getItem('api_base_url');
    if (saved && saved.startsWith('http:')) {
      localStorage.removeItem('api_base_url');
    }
    return '';
  }

  const saved = localStorage.getItem('api_base_url');
  if (saved) return saved;

  const envApiUrl = import.meta.env.VITE_API_URL || '';

  if (import.meta.env.DEV || (typeof window !== 'undefined' && window.location && window.location.hostname === 'localhost') || isCapacitor) {
    return envApiUrl || 'http://localhost:3000';
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

  // Force rewrite any http:// URL to relative path when loaded over HTTPS in a browser
  if (isHttps && !isCapacitor && url.startsWith('http:')) {
    try {
      const parsed = new URL(url);
      url = `${parsed.pathname}${parsed.search}${parsed.hash}`;
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
