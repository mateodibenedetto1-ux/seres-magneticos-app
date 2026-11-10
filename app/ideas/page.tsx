import { Shell } from '@/components/Shell';
import { IdeaForm } from '@/components/IdeaForm';
import { ideasRecientes } from '@/lib/notion';

export const metadata = { title: 'Ideas' };

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default async function Ideas() {
  const ideas = await ideasRecientes();
  return (
    <Shell active="/ideas">
      <p className="eyebrow">Bandeja de ideas</p>
      <h1 className="title">Suelta la <em>idea</em></h1>
      <p className="lead">Escribe aquí lo que se te ocurra. Cada noche se convierte en material para tus propuestas.</p>
      <IdeaForm />
      <section className="section">
        <h2><span className="n">01</span>Últimas ideas</h2>
        {ideas.length === 0 ? (
          <p className="empty">Todavía no hay ideas.</p>
        ) : (
          <ul className="list">
            {ideas.map((i) => (
              <li key={i.id}>
                <div>{i.idea}</div>
                <small>{fecha(i.creada)} · {i.procesada ? 'Procesada' : 'Pendiente'}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Shell>
  );
}
