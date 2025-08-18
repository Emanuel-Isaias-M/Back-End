// services/watchlistService.mjs
import watchlistRepository from '../repositories/WatchlistRepository.mjs';

/**
 * Devuelve la watchlist del perfil.
 */
export async function getWatchlistService(userId, profileId) {
  const items = await watchlistRepository.getItems(userId, profileId);
  if (items === null) {
    const err = new Error('Perfil no encontrado');
    err.status = 404;
    throw err;
  }
  return { items };
}

/**
 * Agrega / alterna un ítem en la watchlist.
 * Acepta película LOCAL (movieId) o de TMDB (tmdbId).
 * - profileId: obligatorio
 * - movieId (MongoId) o tmdbId (Number): al menos uno
 * - source: opcional → si no viene, se deriva ('local' si hay movieId, 'tmdb' si hay tmdbId)
 * - title/posterUrl/year/rating: opcionales (metadata para mostrar)
 */
export async function toggleWatchlistService(userId, payload, mode = 'toggle') {
  const {
    profileId,
    movieId,   // MongoId (string)
    tmdbId,    // TMDB numeric id (number)
    source,    // 'local' | 'tmdb' (opcional)
    title,
    posterUrl,
    year,
    rating,
  } = payload || {};

  if (!profileId) {
    const err = new Error('profileId es obligatorio');
    err.status = 400;
    throw err;
  }

  if (!movieId && !tmdbId) {
    const err = new Error('Debe enviar movieId o tmdbId');
    err.status = 400;
    throw err;
  }

  const resolvedSource = source || (movieId ? 'local' : 'tmdb');

  // Armamos el item de forma flexible; el repo decide la clave (movieId o tmdbId)
  const item = {
    movieId: movieId || null,
    tmdbId: tmdbId || null,
    source: resolvedSource,
    title,
    posterUrl,
    year,
    rating,
  };

  const updated = await watchlistRepository.upsertItem(userId, profileId, item, mode);

  if (updated === null) {
    const err = new Error('Perfil no encontrado');
    err.status = 404;
    throw err;
  }
  return { items: updated };
}

/**
 * Borra un ítem de la watchlist.
 * - Si mandás movieId, borra por movieId.
 * - (Opcional) si tu repo soporta tmdbId, podés ampliarlo de forma similar.
 */
export async function removeFromWatchlistService(userId, profileId, movieId, source) {
  const result = await watchlistRepository.removeItem(userId, profileId, movieId, source);
  if (result === null) {
    const err = new Error('Perfil no encontrado');
    err.status = 404;
    throw err;
  }
  if (!result.changed) {
    const err = new Error('La película no estaba en la watchlist');
    err.status = 404;
    throw err;
  }
  return { message: 'removed', items: result.watchlist };
}
