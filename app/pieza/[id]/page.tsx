import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Shell } from '@/components/Shell';
import { PropuestaCard } from '@/components/PropuestaCard';
import { Teleprompter } from '@/components/Teleprompter';
import { MoverEstado } from '@/components/MoverEstado';
import { pieza } from '@/lib/notion';

export const metadata = { title: 'Pieza' };

const fecha = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' });

export default async function PiezaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await pieza(id);
  if (!data) notFound();
  const { pieza: p, guion } = data;
  const pendiente = p.propuesta === 'Propuesta' || p.propuesta === 'Ajustar';
  const aprobada = p.propuesta === 'Aprobada';
  const atras = pendiente ? '/lunes' : '/produccion';

  return (
    <Shell active={atras}>
      <Link href={atras} className="volver">← {pendiente ? 'Propuestas' : 'Producción'}</Link>

      {pendiente ? (
        <>
          <p className="eyebrow" style={{ marginTop: 18 }}>Propuesta</p>
          <div style={{ marginTop: 14 }}><PropuestaCard p={p} detalle /></div>
        </>
      ) : (
        <>
          <div className="meta" style={{ marginTop: 18 }}>
            {p.formato && <span className="tag">{p.formato}</span>}
            {p.intencion && <span className={`tag ${p.intencion}`}>{p.intencion}</span>}
            {p.estado && <span className="tag estado">{p.estado}</span>}
          </div>
          <h1 className="title" style={{ fontSize: 'clamp(34px, 6vw, 48px)' }}>{p.titulo}</h1>
          {p.publicacion && <p className="lead" style={{ marginBottom: 18 }}>Se publica el {fecha(p.publicacion)}.</p>}
          {p.hook && <p className="hook">“{p.hook}”</p>}
          {p.angulo && <p className="angulo">{p.angulo}</p>}
          {aprobada && (
            <div className="actions" style={{ marginTop: 24 }}>
              <Teleprompter titulo={p.titulo} bloques={guion} />
              <MoverEstado id={p.id} estado={p.estado} />
            </div>
          )}
        </>
      )}

      <section className="section">
        <h2><span className="n">01</span>Guion</h2>
        {guion.length ? (
          <div className="doc guion">
            {guion.map((b, i) => {
              if (b.tipo.startsWith('heading')) return <h3 key={i}>{b.texto}</h3>;
              if (b.tipo === 'divider') return <hr key={i} />;
              if (b.tipo.includes('list_item') || b.tipo === 'to_do') return <li key={i}>{b.texto}</li>;
              return <p key={i}>{b.texto}</p>;
            })}
          </div>
        ) : (
          <p className="empty">
            {pendiente
              ? 'El guion completo se escribe cuando apruebas la propuesta.'
              : 'La Productora está escribiendo el guion. Aparece aquí en cuanto esté listo.'}
          </p>
        )}
      </section>

      {p.comentario && (
        <section className="section">
          <h2><span className="n">02</span>Tu última nota</h2>
          <p className="nota" style={{ fontSize: 16 }}>{p.comentario}</p>
        </section>
      )}
    </Shell>
  );
}
