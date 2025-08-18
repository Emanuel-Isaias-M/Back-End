import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    // Cartelera GLOBAL (sin userId)
    title: { type: String, required: true, trim: true },
    year: { type: Number },
    genre: { type: String, trim: true },
    rating: { type: Number, min: 0, max: 10 },
    posterUrl: { type: String, trim: true },
    overview: { type: String, trim: true },
    director: { type: String, trim: true },

    // ✅ Día y hora programados como STRINGS (evita problemas de zona horaria)
    // "YYYY-MM-DD"
    showDate: {
      type: String,
      trim: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (YYYY-MM-DD)'],
      default: '',
    },
    // "HH:mm" en 24h
    showTime: {
      type: String,
      trim: true,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida (HH:mm)'],
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Búsquedas por título/género/overview/director
movieSchema.index({ title: 'text', genre: 'text', overview: 'text', director: 'text' });

// Indices útiles para cartelera (sirven también con strings en formato ISO)
movieSchema.index({ showDate: 1 });
movieSchema.index({ showDate: 1, showTime: 1 });

const Movie = mongoose.models.Movie || mongoose.model('Movie', movieSchema);
export default Movie;
