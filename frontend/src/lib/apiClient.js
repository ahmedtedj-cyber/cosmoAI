// ═══════════════════════════════════════════════════════════════
//  apiClient.js  —  Client HTTP pour CosmoAI FastAPI Backend
//  Remplace base44Client.js — gère JWT, produits, analyses
// ═══════════════════════════════════════════════════════════════

// URL du backend : définie par VITE_API_URL (Netlify / .env), sans slash final
const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

// ── Token storage ─────────────────────────────────────────────
const getToken = () => localStorage.getItem("cosmoai_token");
const setToken = (t) => localStorage.setItem("cosmoai_token", t);
const removeToken = () => localStorage.removeItem("cosmoai_token");

// ── Intercepteur 401 : déconnexion silencieuse ────────────────
// Appelé dès qu'une requête reçoit un 401/403.
// Efface le token et redirige vers /login sans afficher d'erreur.
function handleAuthError() {
  removeToken();
  // Évite une boucle si on est déjà sur /login
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

// ── Requête de base ───────────────────────────────────────────
async function request(method, path, body = null, auth = true) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (!token) {
      handleAuthError();
      // Lève une erreur "silencieuse" (pas de toast) — la page
      // sera déjà en train de se rediriger vers /login.
      throw new Error("__AUTH__");
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 || res.status === 403) {
    handleAuthError();
    throw new Error("__AUTH__");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Erreur ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

// ═══════════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════════
export const auth = {
  /** Crée un compte et stocke le token automatiquement */
  async register(email, username, password) {
    const data = await request("POST", "/auth/register", { email, username, password }, false);
    setToken(data.access_token);
    return data.user;
  },

  /** Connexion — stocke le token automatiquement */
  async login(usernameOrEmail, password) {
    const form = new URLSearchParams({ username: usernameOrEmail, password });
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Identifiants incorrects.");
    }
    const data = await res.json();
    setToken(data.access_token);
    return data.user;
  },

  /** Déconnexion */
  logout() {
    removeToken();
  },

  /** Vérifie si l'utilisateur est connecté */
  isAuthenticated() {
    return !!getToken();
  },

  /** Retourne les infos de l'utilisateur courant */
  async me() {
    if (!getToken()) return null;
    try {
      return await request("GET", "/auth/me");
    } catch {
      return null;
    }
  },
};

// ═══════════════════════════════════════════════════════════════
//  PRODUITS
// ═══════════════════════════════════════════════════════════════
export const products = {
  /** Liste tous les produits de l'utilisateur */
  list: () => request("GET", "/products"),

  /** Récupère un produit avec ses analyses et tendances */
  get: (id) => request("GET", `/products/${id}`),

  /** Crée un nouveau produit */
  create: (data) => request("POST", "/products", data),

  /** Met à jour un produit */
  update: (id, data) => request("PUT", `/products/${id}`, data),

  /** Supprime un produit */
  delete: (id) => request("DELETE", `/products/${id}`),
};

// ═══════════════════════════════════════════════════════════════
//  ANALYSE
// ═══════════════════════════════════════════════════════════════
export const analysis = {
  /**
   * Analyse des avis en JSON
   * @param {number} productId
   * @param {string[]} reviews  - tableau d'avis
   * @param {boolean} verbose
   */
  analyzeJSON: (productId, reviews, verbose = false) =>
    request("POST", "/analyze", {
      product_id: productId,
      reviews: Array.isArray(reviews) ? reviews : [reviews],
      verbose,
    }),

  /**
   * Analyse depuis un fichier CSV
   * @param {number} productId
   * @param {File} file
   * @param {string} column   - nom de la colonne contenant les avis
   */
  async analyzeCSV(productId, file, column = "avis") {
    const token = getToken();
    if (!token) throw new Error("Non authentifié.");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(
      `${BASE_URL}/analyze/csv?product_id=${productId}&column=${column}`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Erreur ${res.status}`);
    }
    return res.json();
  },

  /**
   * Analyse depuis une URL (Amazon, Sephora, etc.)
   * @param {number} productId
   * @param {string} url
   */
  analyzeURL: (productId, url) =>
    request("POST", "/analyze/url", { product_id: productId, url }),

  /**
   * Prévisualise les avis scrapés SANS analyser
   * @param {string} url
   */
  scrapePreview: (url) =>
    request("GET", `/scrape/preview?url=${encodeURIComponent(url)}`),

  /** Recherche un lieu Google (retourne place_id + infos) */
  googleSearch: (query, apiKey) =>
    request("GET", `/google/search?query=${encodeURIComponent(query)}${apiKey ? `&api_key=${apiKey}` : ''}`),

  /** Analyse les avis Google d'un lieu */
  analyzeGoogle: (productId, query, apiKey) =>
    request("POST", "/analyze/google", { product_id: productId, query, api_key: apiKey }),

  /**
   * Analyse depuis un fichier Excel
   */
  async analyzeExcel(productId, file, column = "avis") {
    const token = getToken();
    if (!token) throw new Error("Non authentifié.");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(
      `${BASE_URL}/analyze/excel?product_id=${productId}&column=${column}`,
      { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Erreur ${res.status}`);
    }
    return res.json();
  },
};

// ═══════════════════════════════════════════════════════════════
//  HISTORIQUE
// ═══════════════════════════════════════════════════════════════
export const history = {
  /** Liste les analyses (filtrables par produit) */
  list: (productId = null, limit = 50) => {
    const params = new URLSearchParams({ limit });
    if (productId) params.set("product_id", productId);
    return request("GET", `/history?${params}`);
  },

  /** Détail d'une analyse */
  get: (id) => request("GET", `/history/${id}`),

  /** Supprime une analyse */
  delete: (id) => request("DELETE", `/history/${id}`),
};

// ═══════════════════════════════════════════════════════════════
//  DASHBOARD & COMPARAISON
// ═══════════════════════════════════════════════════════════════
export const dashboard = {
  get: () => request("GET", "/dashboard"),
};

export const compare = {
  /** Compare deux produits côte à côte */
  products: (idA, idB) => request("GET", `/compare?product_a=${idA}&product_b=${idB}`),
};

// ═══════════════════════════════════════════════════════════════
//  EXPORT
//  Le token JWT est envoyé dans le header Authorization,
//  jamais en query string (fuite dans logs/historique navigateur).
// ═══════════════════════════════════════════════════════════════
export const exportData = {
  /** Télécharge l'analyse en JSON via fetch (token dans le header) */
  async json(analysisId) {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/export/${analysisId}/json`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Erreur export JSON ${res.status}`);
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `cosmoai_analyse_${analysisId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /** Télécharge l'analyse en Excel via fetch (token dans le header) */
  async excel(analysisId) {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/export/${analysisId}/excel`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Erreur export Excel ${res.status}`);
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url;
    a.download = `cosmoai_analyse_${analysisId}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ═══════════════════════════════════════════════════════════════
//  STATUT SYSTÈME
// ═══════════════════════════════════════════════════════════════
export const system = {
  // /status requiert désormais un token (sécurité)
  status: () => request("GET", "/status"),
};

const api = { auth, products, analysis, history, dashboard, compare, exportData, system };
export default api;
