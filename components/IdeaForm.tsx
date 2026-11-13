'use client';

import { useActionState, useEffect, useRef } from 'react';
import { nuevaIdea } from '@/lib/actions';

export function IdeaForm() {
  const [state, action, pending] = useActionState(nuevaIdea, null);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state && 'ok' in state) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="card">
      <div className="field" style={{ marginTop: 0 }}>
        <input type="text" name="idea" placeholder="La idea, en una línea" autoComplete="off" />
        <textarea name="detalle" rows={4} placeholder="Contexto, de dónde salió, cómo lo dirías (opcional)" />
      </div>
      <div className="actions">
        <button className="btn gold" disabled={pending}>{pending ? 'Guardando…' : 'Guardar en la bóveda'}</button>
      </div>
      {state && 'error' in state && <p className="error">{state.error}</p>}
      {state && 'ok' in state && <p className="ok">Guardada en tu bóveda.</p>}
    </form>
  );
}
