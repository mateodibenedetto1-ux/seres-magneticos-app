'use client';

import Link from 'next/link';
import { useActionState, useRef, useState } from 'react';
import { decidirPieza } from '@/lib/actions';
import type { Pieza } from '@/lib/notion';

const LABEL: Record<string, string> = { Aprobada: 'Aprobada', Ajustar: 'Enviada a ajustar', Descartada: 'Descartada' };

export function PropuestaCard({ p, detalle = false }: { p: Pieza; detalle?: boolean }) {
  const [state, action, pending] = useActionState(decidirPieza, null);
  const [ajustando, setAjustando] = useState(false);
  // La decisión va en un campo oculto: se fija en el click, antes de que el formulario se envíe.
  const decision = useRef<HTMLInputElement>(null);
  const elegir = (d: string) => () => {
    if (decision.current) decision.current.value = d;
  };
  const hecho = state && 'ok' in state ? state.ok : null;

  return (
    <article className={`card${hecho ? ' done' : ''}`}>
      <div className="meta">
        {p.formato && <span className="tag">{p.formato}</span>}
        {p.intencion && <span className={`tag ${p.intencion}`}>{p.intencion}</span>}
        {p.propuesta === 'Ajustar' && <span className="tag Ajustar">Vuelve ajustada</span>}
      </div>
      <h3>{detalle ? p.titulo : <Link href={`/pieza/${p.id}`} className="plain">{p.titulo}</Link>}</h3>
      {p.hook && <p className="hook">“{p.hook}”</p>}
      {p.angulo && <p className="angulo">{p.angulo}</p>}
      {p.propuesta === 'Ajustar' && p.comentario && <p className="nota"><em>Tu nota:</em> {p.comentario}</p>}

      {hecho ? (
        <p className="ok">{LABEL[hecho]}</p>
      ) : (
        <form action={action}>
          <input type="hidden" name="id" value={p.id} />
          <input type="hidden" name="decision" ref={decision} defaultValue="" />
          {ajustando && (
            <div className="field">
              <textarea name="comentario" rows={3} placeholder="¿Qué le cambiarías?" autoFocus />
            </div>
          )}
          <div className="actions">
            {ajustando ? (
              <>
                <button type="submit" className="btn primary" onClick={elegir('Ajustar')} disabled={pending}>Enviar ajuste</button>
                <button type="button" className="btn ghost" onClick={() => setAjustando(false)}>Cancelar</button>
              </>
            ) : (
              <>
                <button type="submit" className="btn primary" onClick={elegir('Aprobada')} disabled={pending}>
                  {pending ? 'Guardando…' : 'Aprobar'}
                </button>
                <button type="button" className="btn" onClick={() => setAjustando(true)} disabled={pending}>Ajustar</button>
                <button type="submit" className="btn ghost" onClick={elegir('Descartada')} disabled={pending}>Descartar</button>
              </>
            )}
          </div>
          {state && 'error' in state && <p className="error">{state.error}</p>}
        </form>
      )}
    </article>
  );
}
