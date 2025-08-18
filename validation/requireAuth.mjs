// validation/requireAuth.mjs
// Middleware de protección de rutas.
// Verifica el Access Token (corto, p.ej. 15m) y cuelga el payload en req.user.

import jwt from 'jsonwebtoken';

export default function requireAuth(req, res, next) {
  try {
    // 1) Espero un header "Authorization: Bearer <token>"
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autorizado: falta token Bearer' });
    }

    // 2) Extraigo el token
    const token = auth.slice(7); // quita "Bearer "

    // 3) Verifico el token con el **secreto de ACCESS**
    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      return res.status(500).json({ message: 'Falta JWT_ACCESS_SECRET en el servidor' });
    }

    // 4) Decodifico/valido el token (lanza si está vencido o es inválido)
    const payload = jwt.verify(token, secret);

    // 5) Cuelgo datos útiles en req.user (usamos roles array)
    // payload esperado: { sub: <userId>, roles: ['viewer' | 'editor' | 'admin', ...] }
    req.user = {
      id: payload.sub,
      roles: Array.isArray(payload.roles) && payload.roles.length ? payload.roles : ['viewer'],
    };

    // 6) Sigo la cadena de middlewares
    next();
  } catch (_err) {
    // Token inválido o expirado → 401
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}


