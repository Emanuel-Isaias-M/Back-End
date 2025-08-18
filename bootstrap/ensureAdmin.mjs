// bootstrap/ensureAdmin.mjs
// 📌 Bootstrap de usuario ADMIN al iniciar el servidor.
// Crea o promueve un admin si aún no existe ninguno.
//
// ⚠️ ATENCIÓN:
// Los valores por defecto de abajo son INSEGUROS para producción.
// Úsalos solo en desarrollo. En producción, seteá variables de entorno:
//   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME

import User from '../models/userModel.mjs';
import userRepository from '../repositories/UserRepository.mjs';

export default async function ensureAdmin() {
  // ¿Ya existe algún admin?
  const admins = await User.countDocuments({ roles: 'admin' });
  if (admins > 0) {
    return; // ya hay admin, no hacer nada
  }

  // Datos del admin (ENV o por defecto)
  const DEFAULT_EMAIL = 'kaezvem@admin.com';
  const DEFAULT_PASSWORD = '123456';
  const DEFAULT_NAME = 'Admin';

  const email = process.env.ADMIN_EMAIL || DEFAULT_EMAIL;
  const password = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
  const name = process.env.ADMIN_NAME || DEFAULT_NAME;

  // Si existe el usuario con ese email → promover a admin
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    if (!existing.roles?.includes('admin')) {
      const nextRoles = Array.from(new Set([...(existing.roles || []), 'admin']));
      await userRepository.updateRoles(existing.id, nextRoles);
      console.log(`[bootstrap] Usuario promovido a admin: ${existing.email}`);
    } else {
      console.log(`[bootstrap] ${existing.email} ya es admin`);
    }
    return;
  }

  // No existe → crear usuario admin
  await userRepository.create({
    name,
    email,
    password,
    roles: ['admin'],
  });

  // Logs de ayuda
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.warn(
      `[bootstrap] Admin creado con valores POR DEFECTO (NO usar en producción): ${email} / ${password}`
    );
  } else {
    console.log(`[bootstrap] Admin creado: ${email}`);
  }
}
