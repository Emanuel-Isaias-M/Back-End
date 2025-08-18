// Acepta requireRole('admin','editor') y requireRole(['admin','editor'])
export default function requireRole(...allowed) {
  // Normaliza: si vino un array, úsalo; si vinieron args sueltos, úsalos.
  const list = Array.isArray(allowed[0]) ? allowed[0] : allowed;
  const allowedRoles = list.map(String);

  return function (req, res, next) {
    // Roles del token: array `roles` o string `role` (compatibilidad)
    const tokenRoles = Array.isArray(req.user?.roles) ? req.user.roles : [];
    const singleRole = req.user?.role ? [req.user.role] : [];
    const roles = [...new Set([...tokenRoles, ...singleRole])].map(String);

    const ok = roles.some((r) => allowedRoles.includes(r));
    if (!ok) return res.status(403).json({ message: 'No autorizado' });

    next();
  };
}