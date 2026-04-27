
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function apiRequest(path: string, body: any) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Erreur Serveur (${response.status}): ${text || 'Pas de réponse'}`);
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
