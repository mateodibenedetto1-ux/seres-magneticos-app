import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { enProduccion, ideasRecientes, informes, propuestasPendientes } from '@/lib/notion';

export default async function Inicio() {
  const [pend, prod, ideas, infs] = await Promise.all([
    propuestasPendientes(),
    enProduccion(),
    ideasRecientes(),
    informes(),
  ]);
  const ultimo = infs[0];
  const sinProcesar = ideas.filter((i) => !i.procesada).length;

  return (
    <Shell active="/">
      <h1 className="title">Hola, Val</h1>
      <p className="lead">
        {pend.length
          ? `Tenés ${pend.length} propuesta${pend.length === 1 ? '' : 's'} esperando tu decisión.`
          : 'No hay propuestas pendientes. Las nuevas llegan el lunes a las 8:00.'}
      </p>

      <div className="stats">
        <Link href="/lunes" className="stat"><b>{pend.length}</b><span>Por decidir</span></Link>
        <Link href="/lunes" className="stat"><b>{prod.length}</b><span>En producción</span></Link>
        <Link href="/ideas" className="stat"><b>{sinProcesar}</b><span>Ideas nuevas</span></Link>
      </div>

      <section className="section">
        <h2>Último informe</h2>
        {ultimo ? (
          <Link href={`/informe?id=${ultimo.id}`} className="card" style={{ display: 'block', textDecoration: 'none' }}>
            <div className="meta">{ultimo.tipo && <span className="tag">{ultimo.tipo}</span>}</div>
            <h3>{ultimo.titulo}</h3>
            {ultimo.resumen && <p className="angulo">{ultimo.resumen}</p>}
          </Link>
        ) : (
          <p className="empty">El primer informe llega el viernes a las 11:00.</p>
        )}
      </section>
    </Shell>
  );
}
