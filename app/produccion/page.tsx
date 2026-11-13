import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { enProduccion, type Pieza } from '@/lib/notion';

export const metadata = { title: 'Producción' };

// Tablero en el orden del flujo. Las columnas que le tocan a Val van marcadas.
const COLUMNAS: { titulo: string; estados: string[]; tuya?: boolean; vacio: string }[] = [
  { titulo: 'En guion', estados: ['Guionar'], vacio: 'Lo que apruebes aparece aquí mientras se escribe el guion.' },
  { titulo: 'Para grabar', estados: ['Grabar'], tuya: true, vacio: 'Nada para grabar.' },
  { titulo: 'En edición', estados: ['Material Listo', 'Edición', 'Edición Personal', 'Diseño'], vacio: 'Nada en edición.' },
  { titulo: 'Para revisar', estados: ['Revisión', 'Corregir'], tuya: true, vacio: 'Nada para revisar.' },
  { titulo: 'Listo', estados: ['Aprobado'], vacio: 'Nada listo todavía.' },
];

const fecha = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' });

function Tarjeta({ p }: { p: Pieza }) {
  return (
    <Link href={`/pieza/${p.id}`} className="kcard">
      <div className="meta">
        {p.formato && <span className="tag">{p.formato}</span>}
        {p.intencion && <span className={`tag ${p.intencion}`}>{p.intencion}</span>}
      </div>
      <h3>{p.titulo}</h3>
      {p.hook && <p className="khook">“{p.hook}”</p>}
      {p.publicacion && <small>Sale el {fecha(p.publicacion)}</small>}
    </Link>
  );
}

export default async function Produccion() {
  const piezas = await enProduccion();
  const paraVal = piezas.filter((p) => ['Grabar', 'Revisión', 'Corregir'].includes(p.estado ?? '')).length;

  return (
    <Shell active="/produccion" ancho>
      <p className="eyebrow">Lo que ya aprobaste</p>
      <h1 className="title">En <em>producción</em></h1>
      <p className="lead">
        {piezas.length === 0
          ? 'Todavía no hay piezas aprobadas. Cuando apruebes una propuesta, entra aquí en “En guion”.'
          : paraVal
            ? `${paraVal} pieza${paraVal === 1 ? '' : 's'} te espera${paraVal === 1 ? '' : 'n'} a ti. Las columnas marcadas son las tuyas.`
            : 'Por ahora nada te espera a ti. El equipo está moviendo lo aprobado.'}
      </p>
      <div className="kanban">
        {COLUMNAS.map((c, i) => {
          const lista = piezas.filter((p) => c.estados.includes(p.estado ?? ''));
          return (
            <section key={c.titulo} className={`kcol${c.tuya ? ' tuya' : ''}`}>
              <header>
                <span className="n">0{i + 1}</span>
                <h2>{c.titulo}</h2>
                <span className="count">{lista.length}</span>
              </header>
              {c.tuya && <p className="ktuya">Te toca a ti</p>}
              {lista.length ? lista.map((p) => <Tarjeta key={p.id} p={p} />) : <p className="kvacio">{c.vacio}</p>}
            </section>
          );
        })}
      </div>
    </Shell>
  );
}
