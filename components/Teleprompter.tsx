'use client';

import { useEffect, useRef, useState } from 'react';

/** Teleprompter para grabar desde el celular o la compu: pantalla completa, desplazamiento automático. */
export function Teleprompter({ titulo, bloques }: { titulo: string; bloques: { tipo: string; texto: string }[] }) {
  const [abierto, setAbierto] = useState(false);
  const [corriendo, setCorriendo] = useState(false);
  const [velocidad, setVelocidad] = useState(40); // píxeles por segundo
  const [tamano, setTamano] = useState(38);
  const [espejo, setEspejo] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const ultimo = useRef<number | null>(null);

  useEffect(() => {
    if (!corriendo) { ultimo.current = null; return; }
    let raf = 0;
    const paso = (t: number) => {
      if (ultimo.current != null && caja.current) {
        caja.current.scrollTop += ((t - ultimo.current) / 1000) * velocidad;
        if (caja.current.scrollTop + caja.current.clientHeight >= caja.current.scrollHeight - 2) setCorriendo(false);
      }
      ultimo.current = t;
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [corriendo, velocidad]);

  useEffect(() => {
    if (!abierto) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setCorriendo((c) => !c); }
      if (e.key === 'Escape') { setCorriendo(false); setAbierto(false); }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [abierto]);

  // Solo lo que Val dice: las secciones habladas del guion, sin notas de producción.
  const HABLADO = /^(hook|pico|contexto|moraleja|cta)/i;
  const NOTA = /^(texto en pantalla|toma|b-roll|tomas|intención|duración)/i;
  const tieneSecciones = bloques.some((b) => b.tipo.startsWith('heading') && HABLADO.test(b.texto));
  let seccion = '';
  const texto = bloques.filter((b) => {
    if (b.tipo.startsWith('heading')) { seccion = b.texto; return false; }
    if (b.tipo === 'divider' || NOTA.test(b.texto.trim())) return false;
    return tieneSecciones ? HABLADO.test(seccion) : true;
  });

  if (!abierto) {
    return (
      <button className="btn gold" onClick={() => { setAbierto(true); if (caja.current) caja.current.scrollTop = 0; }} disabled={!texto.length}>
        Abrir teleprompter
      </button>
    );
  }

  return (
    <div className="tp" role="dialog" aria-label={`Teleprompter: ${titulo}`}>
      <div className="tp-bar">
        <button className="btn ghost tp-x" onClick={() => { setCorriendo(false); setAbierto(false); }}>Cerrar</button>
        <label>Velocidad<input type="range" min={10} max={120} value={velocidad} onChange={(e) => setVelocidad(+e.target.value)} /></label>
        <label>Tamaño<input type="range" min={24} max={64} value={tamano} onChange={(e) => setTamano(+e.target.value)} /></label>
        <label className="tp-check"><input type="checkbox" checked={espejo} onChange={(e) => setEspejo(e.target.checked)} />Espejo</label>
      </div>
      <div ref={caja} className="tp-text" style={{ fontSize: tamano, transform: espejo ? 'scaleX(-1)' : undefined }} onClick={() => setCorriendo((c) => !c)}>
        <div className="tp-pad" />
        {texto.map((b, i) => <p key={i}>{b.texto}</p>)}
        <div className="tp-pad" />
      </div>
      <div className="tp-guide" aria-hidden />
      <button className="btn primary tp-play" onClick={() => setCorriendo((c) => !c)}>{corriendo ? 'Pausa' : 'Empezar'}</button>
    </div>
  );
}
