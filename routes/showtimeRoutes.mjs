import { Router } from 'express';
import { body, query, param } from 'express-validator';
import validateRequest from '../validation/validateRequest.mjs';
import requireAuth from '../validation/requireAuth.mjs';
import requireRole from '../validation/requireRole.mjs';
import {
  listShowtimes,
  createShowtime,
  updateShowtime,
  deleteShowtime,
} from '../controllers/showtimesController.mjs';

const router = Router();

/** Públicas: ver la cartelera */
router.get(
  '/',
  [
    query('from').optional().isISO8601().withMessage('from debe ser YYYY-MM-DD'),
    query('to').optional().isISO8601().withMessage('to debe ser YYYY-MM-DD'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 200 }).toInt(),
    validateRequest,
  ],
  listShowtimes
);

/** Protegidas para gestionar la cartelera */
router.use(requireAuth);

// Crear/editar: admin o editor
router.post(
  '/',
  [
    requireRole(['admin', 'editor']),
    body('date').isISO8601().withMessage('date debe ser YYYY-MM-DD'),
    body('time').matches(/^\d{2}:\d{2}$/).withMessage('time debe ser HH:mm'),
    body('movieId').isMongoId().withMessage('movieId inválido'),
    body('auditorium').optional().isString(),
    validateRequest,
  ],
  createShowtime
);

router.put(
  '/:id',
  [
    requireRole(['admin', 'editor']),
    param('id').isMongoId(),
    body('date').optional().isISO8601(),
    body('time').optional().matches(/^\d{2}:\d{2}$/),
    body('movieId').optional().isMongoId(),
    body('auditorium').optional().isString(),
    validateRequest,
  ],
  updateShowtime
);

// Eliminar: solo admin
router.delete(
  '/:id',
  [requireRole(['admin']), param('id').isMongoId(), validateRequest],
  deleteShowtime
);

export default router;
