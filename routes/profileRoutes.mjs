import { Router } from 'express';
import { body, param, query } from 'express-validator';
import validateRequest from '../validation/validateRequest.mjs';
import requireAuth from '../validation/requireAuth.mjs';

import {
  listProfiles,
  createProfile,
  updateProfile,
  deleteProfile
} from '../controllers/profilesController.mjs';

const router = Router();

// Todas las rutas de perfiles requieren auth
router.use(requireAuth);

// GET /profiles?page=&limit=
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page debe ser entero >=1'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit 1-100'),
    validateRequest
  ],
  listProfiles
);

// POST /profiles
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('El nombre requiere al menos 2 caracteres'),
    body('type').optional().isIn(['owner', 'standard', 'kid']).withMessage('type inválido'),
    body('avatar').optional().isString(),
    body('minAge').optional().isInt({ min: 0 }).withMessage('minAge debe ser >= 0'),
    validateRequest
  ],
  createProfile
);

// PUT /profiles/:id
router.put(
  '/:id',
  [
    param('id').isMongoId().withMessage('id inválido'),
    body('name').optional().isLength({ min: 2 }).withMessage('El nombre requiere al menos 2 caracteres'),
    body('type').optional().isIn(['owner', 'standard', 'kid']).withMessage('type inválido'),
    body('avatar').optional().isString(),
    body('minAge').optional().isInt({ min: 0 }).withMessage('minAge debe ser >= 0'),
    validateRequest
  ],
  updateProfile
);

// DELETE /profiles/:id
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('id inválido'), validateRequest],
  deleteProfile
);

export default router;
