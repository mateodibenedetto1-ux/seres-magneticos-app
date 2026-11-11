'use client';

import { useActionState } from 'react';
import { moverPieza } from '@/lib/actions';

const SIGUIENTE: Record<string, { estado: string; label: string }> = {
  Guionar: { estado: 'Grabar', label: 'Guion listo para grabar' },
  Grabar: { estado: 'Material Listo', label: 'Ya lo grabé' },
  'Material Listo': { estado: 'Revisión', label: 'Pasar a revisión' },
  Edición: { estado: 'Revisión', label: 'Pasar a revisión' },
  Diseño: { estado: 'Revisión', label: 'Pasar a revisión' },
  Revisión: { estado: 'Publicado', label: 'Ya se publicó' },
  Corregir: { estado: 'Revisión', label: 'Pasar a revisión' },
  Aprobado: { estado: 'Publicado', label: 'Ya se publicó' },
};

export function MoverEstado({ id, estado }: { id: string; estado: string | null }) {
  const [state, action, pending] = useActionState(moverPieza, null);
  const sig = estado ? SIGUIENTE[estado] : undefined;
  if (!sig || (estado === 'Guionar')) return null; // el guion lo marca listo la Productora
  if (state && 'ok' in state) return <p className="ok">Listo: ahora está en “{state.ok}”.</p>;
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="estado" value={sig.estado} />
      <button className="btn primary" disabled={pending}>{pending ? 'Guardando…' : sig.label}</button>
      {state && 'error' in state && <p className="error">{state.error}</p>}
    </form>
  );
}
