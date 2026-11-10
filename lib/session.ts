/** Sesión simple de una sola usuaria: la cookie guarda una firma de la contraseña. */

export const COOKIE = 'sm_session';

export async function firma(): Promise<string | null> {
  const pass = process.env.APP_PASSWORD;
  if (!pass) return null; // sin contraseña: modo desarrollo, app abierta
  const secret = process.env.APP_SECRET || 'cambiar-este-secreto';
  const data = new TextEncoder().encode(`${pass}:${secret}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('');
}
