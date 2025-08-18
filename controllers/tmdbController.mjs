// server/controllers/tmdbController.mjs
import {
  tmdbPopular,
  tmdbSearch,
  tmdbMovie,
  tmdbDiscover,
} from "../services/tmdbService.mjs";

/* ===== helpers de parsing ===== */
const toInt = (v, def = 1) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : def;
};
const toYYYY = (v) => {
  const s = String(v ?? "").trim();
  return /^\d{4}$/.test(s) ? s : undefined;
};
const normGenres = (v) => {
  if (!v) return undefined;
  if (Array.isArray(v)) {
    const out = v.map(Number).filter(Number.isFinite);
    return out.length ? out.join(",") : undefined;
  }
  if (typeof v === "string") {
    const out = v
      .split(",")
      .map((s) => Number(s.trim()))
      .filter(Number.isFinite);
    return out.length ? out.join(",") : undefined;
  }
  return undefined;
};
const truthy = (v) => ["1", "true", "yes", "on"].includes(String(v).toLowerCase());

/* ===== popular ===== */
export async function popular(req, res, next) {
  try {
    const page = toInt(req.query.page, 1);
    const language = req.query.language || "es-AR";
    const region = req.query.region || "AR";
    const data = await tmdbPopular({ page, language, region });
    res.json(data);
  } catch (e) {
    next(e);
  }
}

/* ===== search ===== */
export async function search(req, res, next) {
  try {
    const q = String(req.query.q ?? "");
    const page = toInt(req.query.page, 1);
    const language = req.query.language || "es-AR";
    const region = req.query.region || "AR";
    const data = await tmdbSearch({ q, page, language, region });
    res.json(data);
  } catch (e) {
    next(e);
  }
}

/* ===== movie detail ===== */
export async function movie(req, res, next) {
  try {
    const { id } = req.params;
    const language = req.query.language || "es-AR";
    const data = await tmdbMovie(id, { language });
    res.json(data);
  } catch (e) {
    next(e);
  }
}

/* ===== discover (filtros) =====
   Soporta:
   - page, language, region
   - year (YYYY)
   - with_genres, without_genres (string "16,14" o array [16,14])
   - certification_country, certification_lte (p.ej. US / PG)
   - kid=1 → fuerza Animación+Fantasía (16,14) y rating hasta PG (US)
*/
export async function discover(req, res, next) {
  try {
    const page = toInt(req.query.page, 1);
    const language = req.query.language || "es-AR";
    const region = req.query.region || "AR";
    const year = toYYYY(req.query.year);

    let with_genres = normGenres(req.query.with_genres);
    let without_genres = normGenres(req.query.without_genres);
    let certification_country = req.query.certification_country;
    let certification_lte = req.query.certification_lte;

    // modo niños opcional (además del filtrado que ya hace tu front)
    if (truthy(req.query.kid)) {
      with_genres = "16,14";                    // solo Animación y Fantasía
      certification_country = certification_country || "US";
      certification_lte = certification_lte || "PG";
    }

    const data = await tmdbDiscover({
      page,
      language,
      region,
      year,
      with_genres,
      without_genres,
      certification_country,
      certification_lte,
    });

    res.json(data);
  } catch (e) {
    next(e);
  }
}
