// routes/adminRoutes.mjs
import { Router } from 'express';
import { body, param, query } from 'express-validator';

import validateRequest from '../validation/validateRequest.mjs';
import requireAuth from '../validation/requireAuth.mjs';
import requireRole from '../validation/requireRole.mjs';
import userRepository from '../repositories/UserRepository.mjs';

const router = Router();

// Todas requieren auth + rol admin
router.use(requireAuth);
router.use(requireRole('admin'));

// GET /api/admin/users?q=&page=&limit=  → listado para panel admin
router.get('/users', [
  query('q').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validateRequest
], async (req, res, next) => {
  try {
    const { q, page, limit } = req.query;
    const data = await userRepository.listAll({ q, page, limit });
    res.json(data);
  } catch (err) { next(err); }
});

// POST /api/admin/users/:id/roles  → asignar/quitar roles
router.post('/users/:id/roles', [
  param('id').isMongoId().withMessage('id inválido'),
  body('roles').isArray({ min: 1 }).withMessage('roles es requerido'),
  body('roles.*').isIn(['admin', 'editor', 'viewer']).withMessage('rol inválido'),
  validateRequest
], async (req, res, next) => {
  try {
    const user = await userRepository.updateRoles(req.params.id, req.body.roles);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ id: user.id, roles: user.roles });
  } catch (err) { next(err); }
});

export default router;
