// userModel.mjs
// Importo mongoose para definir el esquema y el modelo.
import mongoose from 'mongoose';
// Importo bcrypt para hashear y comparar contraseñas.
import bcrypt from 'bcrypt';

const { Schema, model, models } = mongoose;

// Defino un esquema para el usuario con los campos que voy a usar en Auth.
const userSchema = new Schema(
  {
    // Nombre visible del usuario (no único).
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    // Email único que usaré como credencial principal.
    email: {
      type: String,
      required: true,
      unique: true,           // índice único a nivel Mongo
      lowercase: true,        // guardo siempre en minúsculas
      trim: true,
      // Validación simple de formato de email.
      match: [/^\S+@\S+\.\S+$/, 'Formato de email inválido'],
    },

    // Hash de contraseña (nunca guardo la contraseña en texto plano).
    passwordHash: {
      type: String,
      required: true,
      select: false,          // por defecto NO viene en consultas (más seguro)
    },

    // 🚨 DEPRECATED: rol antiguo a nivel cuenta (mantener temporalmente para no romper).
    //         Sustituido por "roles" (array) para autorización granular.
    role: {
      type: String,
      enum: ['owner', 'standard'],
      default: 'standard',
      index: true,
    },

    // ✅ NUEVO: roles de autorización (admin/editor/viewer).
    // - admin: puede asignar/quitar roles, borrar películas, crear/editar.
    // - editor: puede crear/editar películas (no borrar).
    // - viewer: solo lectura.
    roles: {
      type: [String],
      enum: ['admin', 'editor', 'viewer'],
      default: ['viewer'],
      index: true,
    },
  },
  {
    // timestamps agrega createdAt y updatedAt automáticamente.
    timestamps: true,
    // Normalizo la salida en JSON y en Object para el front.
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;      // expongo 'id' en vez de '_id' para el front
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash; // por si en algún caso vino seleccionado, no lo mando
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

// --------------------
// Métodos de instancia
// --------------------

// Setea el hash a partir de una contraseña en texto plano.
userSchema.methods.setPassword = async function setPassword(plainPassword) {
  const saltRounds = 10; // 10–12 está bien para server sin HSM
  this.passwordHash = await bcrypt.hash(plainPassword, saltRounds);
};

// Compara una contraseña en texto plano con el hash guardado.
// Ojo: asegurate de hacer .select('+passwordHash') en el login.
userSchema.methods.comparePassword = async function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// --------------------
// Índices recomendados
// --------------------
userSchema.index({ email: 1 }); // búsqueda rápida por email

// Evitar "OverwriteModelError" con hot-reload / tests
const User = models.User || model('User', userSchema);
export default User;

