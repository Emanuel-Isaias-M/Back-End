// services/authService.mjs
// Servicio de Autenticación: toda la lógica de negocio (sin Express).

import userRepository from '../repositories/UserRepository.mjs';
import jwt from 'jsonwebtoken';

/**
 * Payload para el Access Token.
 * Incluye roles actuales del usuario (admin|editor|viewer).
 */
function buildAccessPayload(user) {
  return {
    sub: String(user.id),
    roles: user.roles || ['viewer'],
    // Podrías agregar "typ":"access" si querés distinguir tipos.
  };
}

/** Firma Access Token (p.ej. 15m) */
function signAccessToken(user) {
  const secret = process.env.JWT_ACCESS_SECRET;
  const expiresIn = process.env.JWT_ACCESS_EXPIRES || '15m';
  if (!secret) throw new Error('Falta JWT_ACCESS_SECRET en .env');
  return jwt.sign(buildAccessPayload(user), secret, { expiresIn });
}

/**
 * Firma Refresh Token (p.ej. 7d).
 * ⚠️ Solo lleva `sub` (id de usuario); NO incluye roles.
 */
function signRefreshToken(user) {
  const secret = process.env.JWT_REFRESH_SECRET;
  const expiresIn = process.env.JWT_REFRESH_EXPIRES || '7d';
  if (!secret) throw new Error('Falta JWT_REFRESH_SECRET en .env');
  return jwt.sign({ sub: String(user.id) }, secret, { expiresIn });
}

/** Helpers por si querés usarlos en otro lado */
export function verifyAccessToken(token) {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('Falta JWT_ACCESS_SECRET en .env');
  return jwt.verify(token, secret);
}
export function verifyRefreshToken(token) {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('Falta JWT_REFRESH_SECRET en .env');
  return jwt.verify(token, secret);
}

/**
 * REGISTER
 * Crea usuario con roles por defecto ["viewer"].
 * Devuelve SOLO { user } (sin tokens) → no auto-logea.
 */
export async function registerService({ name, email, password }) {
  const exists = await userRepository.existsByEmail(email);
  if (exists) {
    const err = new Error('El email ya está registrado');
    err.status = 409;
    throw err;
  }

  // Crear usuario
  const user = await userRepository.create({ name, email, password, roles: ['viewer'] });

  // (Semilla por usuario eliminada)
  // Si querés reactivar un seed por usuario desde TMDB, lo agregamos después.

  // Devolvemos solo el usuario “safe” (el front después hace login)
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: user.roles || ['viewer'],
    },
  };
}

/**
 * LOGIN
 * Valida credenciales y devuelve { accessToken, refreshToken, user }.
 */
export async function loginService({ email, password }) {
  const user = await userRepository.findByEmail(email, { includePassword: true });
  if (!user) {
    const err = new Error('Contraseña o mail invalido');
    err.status = 401;
    throw err;
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  const safeUser = user.toJSON(); // respeta transform del modelo (oculta passwordHash)
  return { user: safeUser, accessToken, refreshToken };
}

/**
 * ME
 * Devuelve datos básicos del usuario autenticado.
 */
export async function meService(userId) {
  const user = await userRepository.findById(userId);
  if (!user) {
    const err = new Error('Usuario no encontrado');
    err.status = 404;
    throw err;
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles || ['viewer'],
  };
}

/**
 * REFRESH
 * Verifica refresh y emite un nuevo access token con los roles *actuales*.
 */
export async function refreshService(refreshToken) {
  try {
    const payload = verifyRefreshToken(refreshToken); // { sub }
    const user = await userRepository.findById(payload.sub);
    if (!user) {
      const err = new Error('Usuario no encontrado');
      err.status = 404;
      throw err;
    }
    const accessToken = signAccessToken(user);
    return { accessToken };
  } catch {
    const err = new Error('Refresh token inválido o expirado');
    err.status = 401;
    throw err;
  }
}

/**
 * LOGOUT
 * Placeholder (si en el futuro persistimos refresh tokens para revocar).
 */
export async function logoutService() {
  return { message: 'logout ok' };
}
