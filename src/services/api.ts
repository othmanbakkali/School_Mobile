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
  const saved = localStorage.getItem('api_base_url');
  if (saved) return saved;

  return (import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.origin.startsWith('capacitor://'))
    ? (import.meta.env.VITE_API_URL || 'http://localhost:3000')
    : '';
}

export async function apiRequest(path: string, body: any) {
  const baseUrl = getApiBaseUrl();
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`;
  
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
