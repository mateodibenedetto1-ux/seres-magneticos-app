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
      <h1 className="title">Bandeja de ideas</h1>
      <p className="lead">Soltá acá lo que se te ocurra. Cada noche se convierte en material para las propuestas.</p>
      <IdeaForm />
      <section className="section">
        <h2>Últimas ideas</h2>
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
