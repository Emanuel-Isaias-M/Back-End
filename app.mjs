// app.mjs
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { connectDB } from './config/dbConfig.mjs';
import apiRouter from './routes/api.mjs';
import manejarErroresApi from './validation/manejarErroresApi.mjs';
import ensureAdmin from './bootstrap/ensureAdmin.mjs';

const app = express();

app.disable('x-powered-by');
app.use(helmet());

app.use(express.json());
app.use(cookieParser());

// CORS
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
  })
);

app.use(compression());
app.use(morgan('dev'));

// ---------- Rutas ----------
app.use('/api', apiRouter);

// ✅ Healthchecks (Render suele pedir /health)
app.get(['/health', '/salud', '/api/health'], (_req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor funcionando correctamente' });
});

// (opcional) raíz rápida para probar
app.get('/', (_req, res) => res.send('API up'));

// Manejo de errores (siempre al final)
app.use(manejarErroresApi);

// ---------- Bootstrap ----------
connectDB().then(async () => {
  await ensureAdmin();
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
    console.log(`CORS origins: ${corsOrigins.join(', ')}`);
  });
});
