import profileRepository from '../repositories/ProfileRepository.mjs';

export async function listProfilesService(userId, { page, limit }) {
  return profileRepository.listByUser(userId, { page, limit });
}

export async function createProfileService(userId, { name, type, avatar, minAge }) {
  // name único por usuario (el índice ya aplica). Capturo conflicto 11000.
  try {
    return await profileRepository.create(userId, { name, type, avatar, minAge });
  } catch (e) {
    if (e?.code === 11000) {
      const err = new Error('Ya existe un perfil con ese nombre');
      err.status = 409;
      throw err;
    }
    throw e;
  }
}

export async function updateProfileService(userId, id, data) {
  const updated = await profileRepository.updateOwnedById(userId, id, data);
  if (!updated) {
    const err = new Error('Perfil no encontrado');
    err.status = 404;
    throw err;
  }
  return updated;
}

export async function removeProfileService(userId, id) {
  const removed = await profileRepository.removeOwnedById(userId, id);
  if (!removed) {
    const err = new Error('Perfil no encontrado');
    err.status = 404;
    throw err;
  }
  return { message: 'Perfil eliminado' };
}
