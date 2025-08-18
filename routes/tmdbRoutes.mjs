// server/routes/tmdbRoutes.mjs
import { Router } from 'express';
import { popular, search, movie, discover } from '../controllers/tmdbController.mjs';

const router = Router();

router.get('/popular', popular);
router.get('/search', search);
router.get('/movie/:id', movie);
router.get('/discover', discover);   // 👈 corregido: con “/”

export default router;
