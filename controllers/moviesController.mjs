// controllers/moviesController.mjs
import {
  listMoviesService,
  createMovieService,
  getMovieService,
  updateMovieService,
  deleteMovieService,
  seedMoviesFromTmdbService, // <-- usamos TMDB desde el service
} from "../services/movieService.mjs";

export async function listMovies(req, res, next) {
  try {
    const { q, page, limit } = req.query;
    const data = await listMoviesService({ q, page, limit });
    res.json(data);
  } catch (err) { next(err); }
}

export async function createMovie(req, res, next) {
  try {
    const created = await createMovieService(req.body);
    res.status(201).json(created);
  } catch (err) { next(err); }
}

export async function getMovie(req, res, next) {
  try {
    const movie = await getMovieService(req.params.id);
    res.json(movie);
  } catch (err) { next(err); }
}

export async function updateMovie(req, res, next) {
  try {
    const updated = await updateMovieService(req.params.id, req.body);
    res.json(updated);
  } catch (err) { next(err); }
}

export async function deleteMovie(req, res, next) {
  try {
    const out = await deleteMovieService(req.params.id);
    res.json(out);
  } catch (err) { next(err); }
}

/**
 * POST /api/movies/seed  (solo admin)
 * Ahora siembra desde TMDB (no MockAPI).
 * Query:
 *  - pages: cuántas páginas traer (20 ítems por página). Ej: ?pages=2
 *  - limit: alternativo. Ej: ?limit=40
 */
export async function seedMoviesFromTmdb(req, res, next) {
  try {
    const pages = req.query.pages ? Number(req.query.pages) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const result = await seedMoviesFromTmdbService({ pages, limit });
    res.json(result);
  } catch (err) { next(err); }
}

// 👇 Alias para no tocar movieRoutes.mjs
export { seedMoviesFromTmdb as seedMovies };
