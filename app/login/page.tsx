'use client';

import { useActionState } from 'react';
import { entrar } from '@/lib/actions';

export default function Login() {
  const [state, action, pending] = useActionState(entrar, null);
  return (
    <main className="shell" style={{ maxWidth: 380, paddingTop: '18vh' }}>
      <p className="mark" style={{ marginBottom: 24 }}>Seres Magnéticos</p>
      <form action={action}>
        <input type="password" name="password" placeholder="Contraseña" autoFocus />
        <div className="actions">
          <button className="btn primary" disabled={pending}>Entrar</button>
        </div>
        {state?.error && <p className="error">{state.error}</p>}
      </form>
    </main>
  );
}
