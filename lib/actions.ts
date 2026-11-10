'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { COOKIE, firma } from './session';
import { decidir, guardarIdea, type Decision } from './notion';

export async function entrar(_: unknown, form: FormData) {
  const pass = String(form.get('password') ?? '');
  if (!process.env.APP_PASSWORD || pass !== process.env.APP_PASSWORD) {
    return { error: 'Esa contraseña no es.' };
  }
  const jar = await cookies();
  jar.set(COOKIE, (await firma())!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  });
  redirect('/');
}

export async function decidirPieza(_: unknown, form: FormData) {
  const id = String(form.get('id') ?? '');
  const decision = String(form.get('decision') ?? '') as Exclude<Decision, 'Propuesta'>;
  const comentario = String(form.get('comentario') ?? '');
  if (!id || !['Aprobada', 'Ajustar', 'Descartada'].includes(decision)) return { error: 'Falta la decisión.' };
  if (decision === 'Ajustar' && !comentario.trim()) return { error: 'Cuéntale a la cofundadora qué ajustar.' };
  try {
    await decidir(id, decision, comentario);
  } catch (e) {
    return { error: 'No se pudo guardar en Notion. Inténtalo de nuevo.' };
  }
  revalidatePath('/lunes');
  revalidatePath('/');
  return { ok: decision };
}

export async function nuevaIdea(_: unknown, form: FormData) {
  const idea = String(form.get('idea') ?? '').trim();
  const detalle = String(form.get('detalle') ?? '').trim();
  if (!idea) return { error: 'Escribe la idea, aunque sea en una línea.' };
  try {
    await guardarIdea(idea, detalle);
  } catch {
    return { error: 'No se pudo guardar en Notion. Inténtalo de nuevo.' };
  }
  revalidatePath('/ideas');
  revalidatePath('/');
  return { ok: true };
}
