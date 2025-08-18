import mongoose from 'mongoose';

const watchlistItemSchema = new mongoose.Schema(
  {
    movieId: { type: String, required: true }, // puede ser TMDB id o _id local
    source: { type: String, enum: ['tmdb', 'local'], required: true },
    title: { type: String, required: true },
    posterUrl: { type: String },
    year: { type: Number },
    rating: { type: Number }
  },
  { _id: false, timestamps: true }
);

const profileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    type: { type: String, enum: ['owner', 'standard', 'kid'], default: 'standard', index: true },
    avatar: { type: String },
    minAge: { type: Number, default: 0 },
    watchlist: { type: [watchlistItemSchema], default: [] }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

profileSchema.index({ userId: 1, name: 1 }, { unique: true });

const Profile = mongoose.models.Profile || mongoose.model('Profile', profileSchema);
export default Profile;
