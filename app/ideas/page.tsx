import { Shell } from '@/components/Shell';
import { IdeaForm } from '@/components/IdeaForm';
import { ideasRecientes } from '@/lib/notion';

export const metadata = { title: 'Bóveda de ideas' };

const fecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default async function Ideas() {
  const ideas = await ideasRecientes();
  return (
    <Shell active="/ideas">
      <p className="eyebrow">Bóveda de ideas</p>
      <h1 className="title">Tu <em>bóveda</em> de ideas</h1>
      <p className="lead">Guarda aquí cada idea que se te ocurra. Nada se pierde: todo se convierte en material para tus propuestas.</p>
      <IdeaForm />
      <section className="section">
        <h2><span className="n">01</span>En la bóveda · {ideas.length}</h2>
        {ideas.length === 0 ? (
          <p className="empty">Todavía no hay ideas.</p>
        ) : (
          <ul className="list">
            {ideas.map((i) => (
              <li key={i.id}>
                <div>{i.idea}</div>
                <small>{fecha(i.creada)} · {i.procesada ? 'Ya es material' : 'Nueva'}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Shell>
  );
}
