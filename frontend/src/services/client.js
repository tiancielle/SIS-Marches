// Client HTTP de base (fetch/axios) vers l'API FastAPI, avec attache automatique du token JWT.
// URL configurable via VITE_API_BASE_URL (voir .env.example) — évite de casser le build
// dès qu'on quitte le poste de dev local ou qu'on change de port.
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    const err = new Error(detail?.detail || `Erreur ${res.status} sur ${path}`);
    err.status = res.status;
    throw err;
  }

  // DELETE renvoie 204 sans corps
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  del: (path) => request(path, { method: "DELETE" }),
};