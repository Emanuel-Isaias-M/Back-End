// routes/authRoutes.mjs
// Rutas de Autenticación

import { Router } from 'express';
import { body, header, cookie, oneOf } from 'express-validator';
import validateRequest from '../validation/validateRequest.mjs';
import requireAuth from '../validation/requireAuth.mjs';

import {
  register,
  login,
  me,
  refresh,
  logout,
} from '../controllers/authController.mjs';

const router = Router();

/**
 * POST /auth/register
 * Crea usuario y devuelve SOLO { user } (sin tokens).
 */
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    validateRequest,
  ],
  register
);

/**
 * POST /auth/login
 * Devuelve { accessToken, refreshToken, user }.
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria'),
    validateRequest,
  ],
  login
);

/**
 * GET /auth/me
 * Protegida con Access Token (Authorization: Bearer <token>).
 */
router.get('/me', requireAuth, me);

/**
 * POST /auth/refresh
 * Acepta refresh token por body (refreshToken), header (x-refresh-token) o cookie (refreshToken).
 */
router.post(
  '/refresh',
  [
    oneOf(
      [
        body('refreshToken').notEmpty(),
        header('x-refresh-token').notEmpty(),
        cookie('refreshToken').notEmpty(),
      ],
      'Refresh token requerido (body.refreshToken, header.x-refresh-token o cookie.refreshToken)'
    ),
    validateRequest,
  ],
  refresh
);

/**
 * POST /auth/logout
 * Por ahora responde OK (si luego persistimos refresh tokens, acá se revocan).
 */
router.post('/logout', logout);

export default router;
