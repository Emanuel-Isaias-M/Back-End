import {
  getWatchlistService,
  toggleWatchlistService,
  removeFromWatchlistService
} from '../services/watchlistService.mjs';

export async function getWatchlist(req, res, next) {
  try {
    const { profileId } = req.query;
    const data = await getWatchlistService(req.user.id, profileId);
    return res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function addOrToggleWatchlist(req, res, next) {
  try {
    // Por defecto modo 'toggle'; si querés se puede pasar ?mode=add|remove
    const mode = (req.query.mode || 'toggle').toLowerCase();
    const data = await toggleWatchlistService(req.user.id, req.body, mode);
    return res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

export async function removeFromWatchlist(req, res, next) {
  try {
    const { profileId } = req.query;
    const { movieId } = req.params;
    const data = await removeFromWatchlistService(req.user.id, profileId, movieId);
    return res.json(data);
  } catch (err) {
    next(err);
  }
}
