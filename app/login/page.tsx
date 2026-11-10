'use client';

import { useActionState } from 'react';
import { entrar } from '@/lib/actions';

export default function Login() {
  const [state, action, pending] = useActionState(entrar, null);
  return (
    <main className="login">
      <div className="box">
        <p className="mark">Seres Magnéticos</p>
        <h1 className="title">Tu centro de <em>contenido</em></h1>
        <form action={action}>
          <input type="password" name="password" placeholder="Contraseña" autoFocus />
          <div className="actions">
            <button className="btn primary" disabled={pending}>Entrar</button>
          </div>
          {state?.error && <p className="error">{state.error}</p>}
        </form>
      </div>
    </main>
  );
}
