'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { nuevaIdea } from '@/lib/actions';

// Dictado con el reconocimiento de voz del propio navegador (Chrome, Safari, Edge). Sin costo ni servicios extra.
type Rec = { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; onresult: ((e: any) => void) | null; onend: (() => void) | null; onerror: ((e: any) => void) | null };

export function IdeaForm() {
  const [state, action, pending] = useActionState(nuevaIdea, null);
  const ref = useRef<HTMLFormElement>(null);
  const idea = useRef<HTMLInputElement>(null);
  const detalle = useRef<HTMLTextAreaElement>(null);
  const rec = useRef<Rec | null>(null);
  const [puedeDictar, setPuedeDictar] = useState(false);
  const [dictando, setDictando] = useState(false);
  const [avisoVoz, setAvisoVoz] = useState('');

  useEffect(() => {
    const W = window as any;
    setPuedeDictar(!!(W.SpeechRecognition || W.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (state && 'ok' in state) ref.current?.reset();
  }, [state]);

  const dictar = () => {
    if (dictando) { rec.current?.stop(); return; }
    const W = window as any;
    const R = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!R) return;
    const r: Rec = new R();
    r.lang = 'es-MX';
    r.continuous = true;
    r.interimResults = false;
    const base = detalle.current?.value ?? '';
    let dicho = '';
    r.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) dicho += e.results[i][0].transcript.trim() + ' ';
      if (detalle.current) detalle.current.value = (base ? base + ' ' : '') + dicho.trim();
      if (idea.current && !idea.current.value) idea.current.value = dicho.split(/[.,;]/)[0].slice(0, 80);
    };
    r.onerror = (e: any) => setAvisoVoz(e?.error === 'not-allowed' ? 'Activa el permiso del micrófono para dictar.' : 'No se pudo dictar. Inténtalo de nuevo.');
    r.onend = () => setDictando(false);
    setAvisoVoz('');
    rec.current = r;
    r.start();
    setDictando(true);
  };

  return (
    <form ref={ref} action={action} className="card">
      <div className="field" style={{ marginTop: 0 }}>
        <input ref={idea} type="text" name="idea" placeholder="La idea, en una línea" autoComplete="off" />
        <textarea ref={detalle} name="detalle" rows={4} placeholder="Contexto, de dónde salió, cómo lo dirías (opcional)" />
      </div>
      <div className="actions">
        <button className="btn gold" disabled={pending}>{pending ? 'Guardando…' : 'Guardar idea'}</button>
        {puedeDictar && (
          <button type="button" className={`btn mic${dictando ? ' on' : ''}`} onClick={dictar}>
            <span className="dot" aria-hidden />{dictando ? 'Detener' : 'Dictar'}
          </button>
        )}
      </div>
      {avisoVoz && <p className="error">{avisoVoz}</p>}
      {state && 'error' in state && <p className="error">{state.error}</p>}
      {state && 'ok' in state && <p className="ok">Guardada. Esta noche se convierte en material.</p>}
    </form>
  );
}
