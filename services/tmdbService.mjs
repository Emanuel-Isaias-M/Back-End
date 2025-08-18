// server/services/tmdbService.mjs
import axios from "axios";

const TMDB = "https://api.themoviedb.org/3";

// Leer el token en runtime evita problemas de orden de imports
const token = () => (process.env.TMDB_TOKEN || "").trim();

function authHeaders() {
  const t = token();
  if (!t) {
    const err = new Error("Falta TMDB_TOKEN en .env del server");
    err.status = 500;
    throw err;
  }
  return { Authorization: `Bearer ${t}` };
}

/**
 * Quita claves con undefined/null/"" del objeto de params.
 * (TMDB prefiere que no mandes el parámetro si está vacío.)
 */
function cleanParams(obj = {}) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    out[k] = v;
  }
  return out;
}

/**
 * Normaliza géneros: acepta array [16,14] o string "16,14"
 */
function normalizeGenres(g) {
  if (!g) return undefined;
  if (Array.isArray(g)) {
    const nums = g.map((x) => Number(x)).filter((n) => Number.isFinite(n));
    return nums.length ? nums.join(",") : undefined;
  }
  if (typeof g === "string") {
    const nums = g
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((n) => Number.isFinite(n));
    return nums.length ? nums.join(",") : undefined;
  }
  return undefined;
}

/* ===================== Endpoints básicos ===================== */

export async function tmdbPopular({
  page = 1,
  language = "es-AR",
  region = "AR",
} = {}) {
  try {
    const { data } = await axios.get(`${TMDB}/movie/popular`, {
      params: cleanParams({ page, language, region }),
      headers: authHeaders(),
    });
    return data;
  } catch (e) {
    const err = new Error(`TMDB popular error: ${e?.response?.status || e.message}`);
    err.status = e?.response?.status || 502;
    throw err;
  }
}

export async function tmdbSearch({
  q,
  page = 1,
  language = "es-AR",
  region = "AR",
} = {}) {
  try {
    const { data } = await axios.get(`${TMDB}/search/movie`, {
      params: cleanParams({
        query: q,
        page,
        language,
        region,
        include_adult: false,
      }),
      headers: authHeaders(),
    });
    return data;
  } catch (e) {
    const err = new Error(`TMDB search error: ${e?.response?.status || e.message}`);
    err.status = e?.response?.status || 502;
    throw err;
  }
}

export async function tmdbMovie(
  id,
  { language = "es-AR", append = "videos,images,credits" } = {}
) {
  try {
    const { data } = await axios.get(`${TMDB}/movie/${id}`, {
      params: cleanParams({ language, append_to_response: append }),
      headers: authHeaders(),
    });
    return data;
  } catch (e) {
    const err = new Error(`TMDB movie error: ${e?.response?.status || e.message}`);
    err.status = e?.response?.status || 502;
    throw err;
  }
}

/* ===================== Discover (filtros) ===================== */

export async function tmdbDiscover({
  page = 1,
  language = "es-AR",
  region = "AR",
  year,                 // primary_release_year
  with_genres,          // "16,14" o [16,14]
  without_genres,       // "27,53" o [27,53]
  certification_country,
  certification_lte,    // ej: "PG"
} = {}) {
  try {
    const params = cleanParams({
      page,
      language,
      region,
      include_adult: false,
      sort_by: "popularity.desc",
      primary_release_year: year,
      with_genres: normalizeGenres(with_genres),
      without_genres: normalizeGenres(without_genres),
      certification_country,
      // TMDB espera "certification.lte" con punto (no subrayado)
    });

    if (certification_lte) {
      params["certification.lte"] = certification_lte;
    }

    const { data } = await axios.get(`${TMDB}/discover/movie`, {
      headers: authHeaders(),
      params,
    });
    return data;
  } catch (e) {
    const err = new Error(`TMDB discover error: ${e?.response?.status || e.message}`);
    err.status = e?.response?.status || 502;
    throw err;
  }
}
