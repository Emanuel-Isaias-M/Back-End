// repositories/UserRepository.mjs
// Repositorio de Usuarios: todas las operaciones de DB relacionadas a usuarios.

import User from '../models/userModel.mjs';

class UserRepository {
  // Buscar por email. Si includePassword=true, trae passwordHash (tiene select:false).
  async findByEmail(email, { includePassword = false } = {}) {
    const q = User.findOne({ email });
    if (includePassword) q.select('+passwordHash');
    return q.exec();
  }

  // Buscar por id
  async findById(id) {
    return User.findById(id).exec();
  }

  // Crear usuario con roles (por defecto ["viewer"])
  async create({ name, email, password, roles = ['viewer'] }) {
    const user = new User({ name, email, roles });
    await user.setPassword(password);
    return user.save();
  }

  // ¿Existe email?
  async existsByEmail(email) {
    return (await User.countDocuments({ email })) > 0;
  }

  // Actualizar datos básicos (sin tocar roles ni password)
  async updateBasic(id, { name }) {
    const $set = {};
    if (typeof name === 'string') $set.name = name;
    return User.findByIdAndUpdate(id, { $set }, { new: true }).exec();
  }

  // ✅ Asignar/quitar roles (solo lo usará la ruta /api/admin/users/:id/roles)
  async updateRoles(id, roles) {
    return User.findByIdAndUpdate(id, { $set: { roles } }, { new: true }).exec();
  }

  // Listado paginado (para panel admin)
  async listAll({ q, page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const filter = q
      ? { $or: [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }] }
      : {};

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      User.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limitNum) || 1;
    return { items, total, page: pageNum, limit: limitNum, pages };
  }
}

export default new UserRepository();
