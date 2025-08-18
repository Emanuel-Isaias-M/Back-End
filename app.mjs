// app.mjs
// Cargo variables de entorno
import 'dotenv/config';

// Librerías principales
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

// Conexión a la base de datos
import { connectDB } from './config/dbConfig.mjs';

// Rutas y middlewares propios
import apiRouter from './routes/api.mjs';
import manejarErroresApi from './validation/manejarErroresApi.mjs';

// 🆕 Bootstrap admin
import ensureAdmin from './bootstrap/ensureAdmin.mjs';


const app = express();

// Seguridad/headers básicos
app.disable('x-powered-by');
app.use(helmet());

// Parsers
app.use(express.json());
app.use(cookieParser());

// CORS (lista separada por comas o un solo origen)
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

// Compresión y logs
app.use(compression());
app.use(morgan('dev'));

// Rutas base
app.use('/api', apiRouter);

// Healthcheck (usado por Render)
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, status: 'OK' });
});

// Manejo de errores (siempre al final)
app.use(manejarErroresApi);

// Conectar DB, asegurar admin y levantar server
connectDB().then(async () => {
  await ensureAdmin(); // 👈 crea/promueve admin si hace falta
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
    console.log(`CORS origins: ${corsOrigins.join(', ')}`);
  });
});
