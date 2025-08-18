// Middleware de "cierre" para express-validator.
// Si hubo errores de validación en la request, devuelvo 400 con el detalle.
// Si no hubo, sigo al siguiente middleware/controlador.

import { validationResult } from 'express-validator';

export default function validateRequest(req, res, next) {
  // 1) Obtengo los errores recogidos por los checkers (body(), param(), query(), etc.)
  const result = validationResult(req);

  // 2) Si está todo OK, continuo.
  if (result.isEmpty()) return next();

  // 3) Si hay errores, los mapeo a un formato prolijo para el front.
  const errors = result.array().map(err => ({
    path: err.path || err.param || 'unknown',
    msg: err.msg || 'invalid',
    value: err.value,
  }));

  // 4) Respondo 400 con el listado de errores.
  return res.status(400).json({
    message: 'Validación fallida',
    errors,
  });
}

