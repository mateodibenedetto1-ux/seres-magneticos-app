import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { bloques, informes } from '@/lib/notion';

export const metadata = { title: 'Informe' };

export default async function InformePage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  const lista = await informes();
  const actual = lista.find((i) => i.id === id) ?? lista[0];
  const contenido = actual ? await bloques(actual.id) : [];

  return (
    <Shell active="/informe">
      <h1 className="title">{actual?.titulo ?? 'Informe semanal'}</h1>
      <p className="lead">Llega cada viernes a las 11:00: qué funcionó, referentes y mentees.</p>

      {!actual && <p className="empty">El primer informe llega el viernes a las 11:00.</p>}

      <div className="doc">
        {contenido.map((b, i) => {
          if (b.tipo === 'heading_1' || b.tipo === 'heading_2') return <h2 key={i}>{b.texto}</h2>;
          if (b.tipo === 'heading_3') return <h3 key={i}>{b.texto}</h3>;
          if (b.tipo === 'divider') return <hr key={i} />;
          if (b.tipo.includes('list_item') || b.tipo === 'to_do') return <li key={i}>{b.texto}</li>;
          return <p key={i}>{b.texto}</p>;
        })}
      </div>

      {lista.length > 1 && (
        <section className="section">
          <h2>Anteriores</h2>
          <ul className="list">
            {lista.filter((i) => i.id !== actual?.id).map((i) => (
              <li key={i.id}>
                <Link href={`/informe?id=${i.id}`}>{i.titulo}</Link>
                {i.tipo && <small> · {i.tipo}</small>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </Shell>
  );
}
