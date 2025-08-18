// repositories/WatchlistRepository.mjs
// Acceso a datos de Watchlist embebida en Profile
import Profile from '../models/profileModel.mjs';

function normalizeItem(raw = {}) {
  const movieId = String(raw.movieId ?? '').trim();
  const source = (raw.source || '').trim() || 'local'; // 'tmdb' | 'local'
  const title = String(raw.title ?? '').trim();
  // Evito undefined/null en strings
  const posterUrl = raw.posterUrl != null ? String(raw.posterUrl) : '';
  const year = raw.year != null ? Number(raw.year) : undefined;
  const rating = raw.rating != null ? Number(raw.rating) : undefined;

  return { movieId, source, title, posterUrl, year, rating };
}

class WatchlistRepository {
  async getProfileOwned(userId, profileId) {
    return Profile.findOne({ _id: profileId, userId });
  }

  async getItems(userId, profileId) {
    const profile = await this.getProfileOwned(userId, profileId);
    if (!profile) return null;
    return profile.watchlist || [];
  }

  /**
   * mode: 'toggle' | 'add' | 'remove'
   * item: { movieId, source, title, posterUrl, year, rating }
   * Dedupe por movieId+source (si no viene source en el payload, matchea por movieId a secas).
   *
   * Comportamiento:
   * - toggle: si existe -> quita; si no -> agrega (snapshot normalizado)
   * - add:    si no existe -> agrega; si existe -> ACTUALIZA el snapshot (title/poster/year/rating)
   * - remove: si existe -> quita; si no -> no hace nada
   */
  async upsertItem(userId, profileId, item, mode = 'toggle') {
    const profile = await this.getProfileOwned(userId, profileId);
    if (!profile) return null;

    const normalized = normalizeItem(item);
    if (!normalized.movieId) return profile.watchlist; // nada que hacer si no hay movieId

    // Coincidencia por movieId y, si el caller provee source, también por source
    const match = (i) =>
      i.movieId === normalized.movieId &&
      (item.source ? i.source === normalized.source : true);

    const idx = profile.watchlist.findIndex(match);
    let changed = false;

    if (mode === 'remove') {
      if (idx >= 0) {
        profile.watchlist.splice(idx, 1);
        changed = true;
      }
    } else if (mode === 'add') {
      if (idx === -1) {
        profile.watchlist.push(normalized);
        changed = true;
      } else {
        // Si ya existe, ACTUALIZO el snapshot con los datos más recientes
        const prev = profile.watchlist[idx];
        const next = prev?.toObject ? prev.toObject() : { ...prev };

        // Campos que actualizo si vienen definidos
        for (const k of ['title', 'posterUrl', 'year', 'rating', 'source']) {
          if (normalized[k] !== undefined && normalized[k] !== next[k]) {
            next[k] = normalized[k];
            changed = true;
          }
        }

        if (changed) {
          profile.watchlist[idx] = next;
        }
      }
    } else {
      // toggle
      if (idx >= 0) {
        profile.watchlist.splice(idx, 1);
        changed = true;
      } else {
        profile.watchlist.push(normalized);
        changed = true;
      }
    }

    if (changed) {
      await profile.save();
    }
    return profile.watchlist;
  }

  /**
   * Borra por movieId y (opcional) source para mayor precisión
   */
  async removeItem(userId, profileId, movieId, source) {
    const profile = await this.getProfileOwned(userId, profileId);
    if (!profile) return null;

    const movieIdStr = String(movieId ?? '').trim();
    const sourceStr = (source || '').trim();

    const before = profile.watchlist.length;
    profile.watchlist = profile.watchlist.filter((i) =>
      sourceStr
        ? !(i.movieId === movieIdStr && i.source === sourceStr)
        : i.movieId !== movieIdStr
    );
    const changed = profile.watchlist.length !== before;

    if (changed) await profile.save();
    return { changed, watchlist: profile.watchlist };
  }
}

const watchlistRepository = new WatchlistRepository();
export default watchlistRepository;
