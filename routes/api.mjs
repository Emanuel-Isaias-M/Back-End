// routes/api.mjs
// Router principal de la API
// Solo centraliza y monta subrutas, no define endpoints directos

import { Router } from 'express';

// Subrutas
import authRoutes from './authRoutes.mjs';
import profileRoutes from './profileRoutes.mjs';
import movieRoutes from './movieRoutes.mjs';
import watchlistRoutes from './watchlistRoutes.mjs';
import adminRoutes from './adminRoutes.mjs'; 
import tmdbRoutes from './tmdbRoutes.mjs';   
const router = Router();

// Health-check del router /api
router.get('/health', (_req, res) => {
  res.json({ status: 'OK', scope: 'api', at: new Date().toISOString() });
});

// Montajes
router.use('/tmdb', tmdbRoutes);   // ⇒ /api/tmdb/popular, /api/tmdb/search, /api/tmdb/movie/:id
router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/movies', movieRoutes);
router.use('/watchlist', watchlistRoutes);
router.use('/admin', adminRoutes); //   endpoints de admin (roles)

export default router;

