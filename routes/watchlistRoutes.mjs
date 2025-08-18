// routes/watchlistRoutes.mjs
import { Router } from 'express';
import { body, query, param } from 'express-validator';
import validateRequest from '../validation/validateRequest.mjs';
import requireAuth from '../validation/requireAuth.mjs';

import {
  getWatchlist,
  addOrToggleWatchlist,
  removeFromWatchlist
} from '../controllers/watchlistController.mjs';

const router = Router();

// Todas requieren auth
router.use(requireAuth);

/**
 * GET /watchlist?profileId=...
 */
router.get(
  '/',
  [
    query('profileId').isMongoId().withMessage('profileId inválido'),
    validateRequest
  ],
  getWatchlist
);

/**
 * POST /watchlist  (toggle/add/remove)
 * Body:
 * {
 *   "profileId": "...",
 *   "movieId": "123",
 *   "source": "tmdb" | "local",
 *   "title": "Avatar",             // opcional si mode=remove
 *   "posterUrl": "...",
 *   "year": 2009,
 *   "rating": 7.8
 * }
 * Query opcional: ?mode=toggle|add|remove  (default toggle)
 */
router.post(
  '/',
  [
    query('mode').optional().isIn(['toggle', 'add', 'remove'])
      .withMessage('mode debe ser toggle|add|remove'),
    body('profileId').isMongoId().withMessage('profileId inválido'),
    body('movieId').notEmpty().withMessage('movieId es obligatorio'),
    body('source').isIn(['tmdb', 'local']).withMessage('source inválido'),
    body('title').optional().isString(),
    body('posterUrl').optional().isString(),
    body('year').optional().isInt({ min: 1800, max: 3000 }),
    body('rating').optional().isFloat({ min: 0, max: 10 }),
    validateRequest
  ],
  addOrToggleWatchlist
);

/**
 * DELETE /watchlist/:movieId?profileId=...&source=tmdb|local
 */
router.delete(
  '/:movieId',
  [
    param('movieId').notEmpty().withMessage('movieId es obligatorio'),
    query('profileId').isMongoId().withMessage('profileId inválido'),
    query('source').optional().isIn(['tmdb', 'local']).withMessage('source inválido'),
    validateRequest
  ],
  removeFromWatchlist
);

export default router;


