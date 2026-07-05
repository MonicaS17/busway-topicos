import { getAuth } from 'firebase/auth';

export async function getAuthHeader() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No hay usuario autenticado');
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}
