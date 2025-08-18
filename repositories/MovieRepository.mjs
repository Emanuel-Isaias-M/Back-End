import Movie from '../models/movieModel.mjs';

class MovieRepository {
  async list({ q, page = 1, limit = 20 } = {}) {
    const filter = {};
    if (q && String(q).trim()) {
      const rx = new RegExp(String(q).trim(), 'i');
      filter.$or = [{ title: rx }, { genre: rx }, { overview: rx }, { director: rx }];
    }

    const pageNum = Math.max(Number(page) || 1, 1);
    const limitNum = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Movie.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Movie.countDocuments(filter),
    ]);

    return { items, total, page: pageNum, pages: Math.ceil(total / limitNum) || 1 };
  }

  async create(data) {
    return Movie.create(data);
  }

  async findById(id) {
    return Movie.findById(id);
  }

  async updateById(id, data) {
    return Movie.findByIdAndUpdate(id, { $set: data }, { new: true });
  }

  async deleteById(id) {
    return Movie.findByIdAndDelete(id);
  }

  async existsByTitleYear(title, year) {
    return Movie.exists({ title, year });
  }
}

const movieRepository = new MovieRepository();
export default movieRepository;