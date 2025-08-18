// server/services/movieService.mjs
import axios from 'axios';
import movieRepository from '../repositories/MovieRepository.mjs';

/* ========================== LIST & CRUD ========================== */

export async function listMoviesService({ q, page, limit }) {
  const data = await movieRepository.list({ q, page, limit });

  // Autoseed SOLO si la colección está vacía, primer GET y hay TMDB_TOKEN configurado
  const hasToken = Boolean((process.env.TMDB_TOKEN || '').trim());
  const isFirstPage = (Number(page) || 1) === 1;
  const noQuery = !q || String(q).trim() === '';
  const shouldSeed = noQuery && isFirstPage && data.total === 0 && hasToken;

  if (shouldSeed) {
    try {
      // Trae ~40 títulos (2 páginas de TMDB) si está vacío. Ajustá a gusto.
      await seedMoviesFromTmdbService({ pages: 30 });
    } catch (e) {
      console.error('[seed:auto] error:', e?.message || e);
      // No cortamos la lista por un seed fallido
    }
    return await movieRepository.list({ q, page, limit });
  }

  return data;
}

export async function createMovieService(body) {
  return await movieRepository.create(body);
}

export async function getMovieService(id) {
  const doc = (await movieRepository.getById?.(id)) ?? (await movieRepository.findById?.(id));
  if (!doc) {
    const err = new Error('Película no encontrada');
    err.status = 404;
    throw err;
  }
  return doc;
}

export async function updateMovieService(id, body) {
  const updated = await movieRepository.updateById(id, body);
  if (!updated) {
    const err = new Error('Película no encontrada');
    err.status = 404;
    throw err;
  }
  return updated;
}

export async function deleteMovieService(id) {
  const out = await movieRepository.deleteById(id);
  if (!out) {
    const err = new Error('Película no encontrada');
    err.status = 404;
    throw err;
  }
  return out;
}

/* ========================== SEED DESDE TMDB ========================== */

const TMDB_API = 'https://api.themoviedb.org/3';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w500';
const PAGE_SIZE = 20; // TMDB trae 20 por página

function mapTmdbItem(it = {}) {
  // Map a tu esquema actual (title, year, genre, rating, posterUrl, overview, director)
  const year = it.release_date ? Number(String(it.release_date).slice(0, 4)) : undefined;
  return {
    tmdbId: it.id, // si tu esquema no lo tiene aún, es buena idea agregarlo (unique+sparse)
    title: (it.title || it.name || 'Sin título').toString().trim(),
    year,
    genre: '', // Opcional: mapear genre_ids a nombres con /genre/movie/list
    rating: it.vote_average != null ? Number(it.vote_average) : 0,
    posterUrl: it.poster_path ? `${TMDB_IMG}${it.poster_path}` : '',
    overview: (it.overview || '').toString().trim(),
    director: '', // Para director real habría que llamar a /movie/{id}/credits
    source: 'tmdb',
  };
}

async function fetchPopularFromTmdb({ pages = 1, limit, language = 'es-AR' } = {}) {
  const token = (process.env.TMDB_TOKEN || '').trim();
  if (!token) {
    const err = new Error('Falta TMDB_TOKEN en .env del server');
    err.status = 500;
    throw err;
  }

  const all = [];
  const pagesToFetch =
    pages && pages > 0
      ? pages
      : limit && limit > 0
      ? Math.max(1, Math.ceil(limit / PAGE_SIZE))
      : 1;

  for (let page = 1; page <= pagesToFetch; page++) {
    const { data } = await axios.get(`${TMDB_API}/movie/popular`, {
      params: { language, page },
      headers: { Authorization: `Bearer ${token}` },
    });
    all.push(...(data?.results || []));
    if (limit && all.length >= limit) {
      all.length = limit; // recortar si excede
      break;
    }
  }
  return all;
}

export async function seedMoviesFromTmdbService({ pages, limit } = {}) {
  const raw = await fetchPopularFromTmdb({ pages, limit });
  const arr = raw.map(mapTmdbItem);

  let created = 0;
  let skipped = 0;

  for (const doc of arr) {
    // Blindajes mínimos
    if (!doc.title) { skipped++; continue; }

    try {
      // Preferencia: upsert por tmdbId si tu repo lo soporta
      if (doc.tmdbId && typeof movieRepository.upsertByTmdbId === 'function') {
        const ok = await movieRepository.upsertByTmdbId(doc.tmdbId, doc);
        if (ok?.created) created++; else skipped++;
        continue;
      }

      // Fallback idempotente por (title, year) si no existe upsert por tmdbId
      if (doc.title && doc.year != null && typeof movieRepository.existsByTitleYear === 'function') {
        const exists = await movieRepository.existsByTitleYear(doc.title, doc.year);
        if (exists) { skipped++; continue; }
      }

      await movieRepository.create(doc);
      created++;
    } catch (e) {
      // No romper el seed por validaciones/duplicados
      skipped++;
    }
  }

  return { created, skipped, total: arr.length };
}
