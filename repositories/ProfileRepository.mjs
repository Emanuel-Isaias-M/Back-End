// repositories/ProfileRepository.mjs
import Profile from '../models/profileModel.mjs';

class ProfileRepository {
  async listByUser(userId, { page = 1, limit = 20 } = {}) {
    // Normalizo y limito los valores
    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Profile.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Profile.countDocuments({ userId }),
    ]);

    const pages = Math.ceil(total / limitNum) || 1;
    return { items, total, page: pageNum, pages, limit: limitNum };
  }

  async create(userId, data) {
    return Profile.create({ userId, ...data });
  }

  async findOwnedById(userId, id) {
    return Profile.findOne({ _id: id, userId });
  }

  async updateOwnedById(userId, id, data) {
    return Profile.findOneAndUpdate(
      { _id: id, userId },
      { $set: data },
      { new: true }
    );
  }

  async removeOwnedById(userId, id) {
    return Profile.findOneAndDelete({ _id: id, userId });
  }
}

const profileRepository = new ProfileRepository();
export default profileRepository;
