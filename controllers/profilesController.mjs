import {
  listProfilesService,
  createProfileService,
  updateProfileService,
  removeProfileService
} from '../services/profileService.mjs';

export async function listProfiles(req, res, next) {
  try {
    const { page, limit } = req.query;
    const data = await listProfilesService(req.user.id, { page, limit });
    return res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function createProfile(req, res, next) {
  try {
    const { name, type, avatar, minAge } = req.body;
    const p = await createProfileService(req.user.id, { name, type, avatar, minAge });
    return res.status(201).json(p);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const updated = await updateProfileService(req.user.id, req.params.id, req.body);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteProfile(req, res, next) {
  try {
    const out = await removeProfileService(req.user.id, req.params.id);
    return res.json(out);
  } catch (err) {
    next(err);
  }
}
