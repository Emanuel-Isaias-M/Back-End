// Este middleware centraliza el manejo de errores de toda la app.
// Lo uso al final de app.mjs con app.use(manejarErroresApi).

/**
 * Estructura de error estándar:
 * {
 *   message: "Descripción breve del error",
 *   code: "OPCIONAL_CODIGO_INTERNO",
 *   errors: [ { path: "campo", msg: "detalle" } ] // opcional, para validaciones
 * }
 */

function buildValidationArrayFromMongoose(err) {
  // Mongoose ValidationError -> err.errors: { field: ValidatorError, ... }
  try {
    const fields = Object.values(err.errors || {});
    return fields.map(e => ({
      path: e.path || e.kind || 'unknown',
      msg: e.message || 'invalid',
    }));
  } catch {
    return [];
  }
}

function buildDupKeyErrors(err) {
  // MongoServerError 11000 -> err.keyValue { field: value }
  const kv = err?.keyValue || {};
  return Object.keys(kv).map(k => ({
    path: k,
    msg: `Ya existe un registro con ese ${k}`,
  }));
}

export default function manejarErroresApi(err, req, res, _next) {
  let status = err.status || err.statusCode || 500;
  const payload = {
    message: err.message || 'Error interno del servidor',
  };

  // ===== Casos especiales útiles en este stack =====

  // JSON malformado en el body (body-parser)
  // Algunos parsers ponen err.type === 'entity.parse.failed'
  if (err instanceof SyntaxError && 'body' in err) {
    status = 400;
    payload.message = 'JSON del body inválido';
  }

  // JWT inválido/expirado
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    payload.message = 'Token inválido o expirado';
  }

  // Mongoose: ObjectId inválido (CastError)
  if (err.name === 'CastError') {
    status = 400;
    payload.message = `Parámetro inválido: ${err.path || 'id'}`;
    payload.errors = [{ path: err.path || 'id', msg: 'valor inválido' }];
  }

  // Mongoose: errores de validación
  if (err.name === 'ValidationError') {
    status = 400;
    payload.message = 'Validación fallida';
    payload.errors = buildValidationArrayFromMongoose(err);
  }

  // Mongo: clave duplicada (ej. email único, perfil name único por usuario)
  if (err.name === 'MongoServerError' && err.code === 11000) {
    status = 409;
    payload.message = 'Recurso duplicado';
    payload.errors = buildDupKeyErrors(err);
  }

  // Si el servicio/route setea un code interno, lo propagamos
  if (err.code) {
    payload.code = err.code;
  }

  // express-validator ya te arma un array err.errors; lo respetamos si vino
  if (!payload.errors && Array.isArray(err.errors) && err.errors.length) {
    payload.errors = err.errors.map(e => ({
      path: e.path || e.param || 'unknown',
      msg: e.msg || e.message || 'invalid',
    }));
  }

  // Para desarrollo, adjunto stack
  if (process.env.NODE_ENV === 'development' && err.stack) {
    payload.stack = err.stack;
  }

  // Log mínimo
  console.error(`[ERROR ${status}]`, err.message || err);

  res.status(status).json(payload);
}
