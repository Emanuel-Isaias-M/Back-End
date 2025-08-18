// routes/movieRoutes.mjs
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import validateRequest from '../validation/validateRequest.mjs';
import requireAuth from '../validation/requireAuth.mjs';
import requireRole from '../validation/requireRole.mjs';
import {
  listMovies,
  createMovie,
  getMovie,
  updateMovie,
  deleteMovie,
  // ❌ seedMovies,  // <-- lo quitamos si ya no existe
} from '../controllers/moviesController.mjs';

const router = Router();

/* Públicas */
router.get(
  '/',
  [
    query('q').optional().isString(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    validateRequest,
  ],
  listMovies
);
router.get('/:id', [param('id').isMongoId(), validateRequest], getMovie);

/* Protegidas */
router.use(requireAuth);

/* Crear (admin/editor) */
router.post(
  '/',
  [
    requireRole(['admin', 'editor']),
    body('title').trim().notEmpty().withMessage('title es obligatorio'),
    body('genre').optional().isString(),
    body('overview').optional().isString(),
    body('posterUrl').optional().isString(),
    body('director').optional().isString(),
    body('year').optional().isInt().toInt(),
    body('rating').optional().isFloat({ min: 0, max: 10 }).toFloat(),

    // ✅ Validar como STRING exacta: "YYYY-MM-DD". Nada de ISO 8601 genérico.
    body('showDate')
      .optional({ checkFalsy: true })
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('showDate debe ser YYYY-MM-DD'),

    // ✅ "HH:mm" 24h
    body('showTime')
      .optional({ checkFalsy: true })
      .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
      .withMessage('showTime debe ser HH:mm'),

    // (Opcional) Sanitizer por si alguien manda "DD/MM/YYYY"
    body('showDate').customSanitizer((v) => {
      if (typeof v !== 'string') return v;
      const s = v.trim();
      const m = s.match(/^(\d{2})[\/.-](\d{2})[\/.-](\d{4})$/);
      return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
    }),

    validateRequest,
  ],
  createMovie
);

/* Editar (admin/editor) */
router.put(
  '/:id',
  [
    requireRole(['admin', 'editor']),
    param('id').isMongoId(),
    body('title').optional().trim().notEmpty(),
    body('genre').optional().isString(),
    body('overview').optional().isString(),
    body('posterUrl').optional().isString(),
    body('director').optional().isString(),
    body('year').optional().isInt().toInt(),
    body('rating').optional().isFloat({ min: 0, max: 10 }).toFloat(),

    body('showDate')
      .optional({ checkFalsy: true })
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('showDate debe ser YYYY-MM-DD')
      .customSanitizer((v) => {
        if (typeof v !== 'string') return v;
        const s = v.trim();
        const m = s.match(/^(\d{2})[\/.-](\d{2})[\/.-](\d{4})$/);
        return m ? `${m[3]}-${m[2]}-${m[1]}` : s;
      }),

    body('showTime')
      .optional({ checkFalsy: true })
      .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
      .withMessage('showTime debe ser HH:mm'),

    validateRequest,
  ],
  updateMovie
);

/* Borrar (solo admin) */
router.delete(
  '/:id',
  [requireRole(['admin']), param('id').isMongoId(), validateRequest],
  deleteMovie
);

// ❌ Seed (si ya no existe ese controller, eliminá la ruta)
// router.post('/seed', [requireRole(['admin'])], seedMovies);

export default router;
