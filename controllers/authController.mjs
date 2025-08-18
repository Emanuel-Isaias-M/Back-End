// controllers/authController.mjs
// ==========================
// Controlador de Autenticación
// ==========================
// Recibe la request HTTP, delega la lógica al service y devuelve la respuesta JSON.
// No contiene lógica de negocio, solo orquesta entre request → service → response.

// ===== Imports =====
import {
  registerService,
  loginService,
  meService,
  refreshService,
  logoutService,
} from '../services/authService.mjs';

// ==========================
// POST /api/auth/register
// ==========================
// Crea un nuevo usuario y devuelve SOLO sus datos (sin tokens).
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const result = await registerService({ name, email, password });
    return res.status(201).json(result);
  } catch (err) {
    next(err); // Pasa el error al middleware global
  }
}

// ==========================
// POST /api/auth/login
// ==========================
// Valida las credenciales y devuelve { accessToken, refreshToken, user }.
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await loginService({ email, password });
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

// ==========================
// GET /api/auth/me
// ==========================
// Devuelve la info del usuario logueado.
// `req.user` es inyectado por el middleware requireAuth.
export async function me(req, res, next) {
  try {
    const userId = req.user.id;
    const user = await meService(userId);
    return res.json(user);
  } catch (err) {
    next(err);
  }
}

// ==========================
// POST /api/auth/refresh
// ==========================
// Recibe un refresh token y devuelve un nuevo access token.
// El refresh token puede venir del body, header (x-refresh-token) o cookie (refreshToken).
export async function refresh(req, res, next) {
  try {
    const tokenFromBody = req.body?.refreshToken;
    const tokenFromHeader = req.headers['x-refresh-token'];
    const tokenFromCookie = req.cookies?.refreshToken;
    const refreshToken = tokenFromBody || tokenFromHeader || tokenFromCookie;

    const result = await refreshService(refreshToken);
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

// ==========================
// POST /api/auth/logout
// ==========================
// Por ahora no invalida el token, solo responde OK.
// Si en el futuro guardamos refresh tokens en DB, acá se eliminaría.
export async function logout(req, res, next) {
  try {
    const result = await logoutService();
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

