import Link from 'next/link';
import { Shell } from '@/components/Shell';
import { enProduccion, type Pieza } from '@/lib/notion';

export const metadata = { title: 'Producción' };

// Orden en que Val ve el trabajo: primero lo que le toca a ella.
const COLUMNAS: { titulo: string; estados: string[]; nota: string }[] = [
  { titulo: 'Para grabar', estados: ['Grabar'], nota: 'Te toca a ti: abre el teleprompter y graba.' },
  { titulo: 'Para revisar', estados: ['Revisión', 'Corregir'], nota: 'Te toca a ti: revisa y aprueba la versión final.' },
  { titulo: 'En guion', estados: ['Guionar'], nota: 'La Productora está escribiendo el guion.' },
  { titulo: 'En edición y diseño', estados: ['Material Listo', 'Edición', 'Edición Personal', 'Diseño'], nota: 'El equipo está editando o diseñando.' },
  { titulo: 'Listo para publicar', estados: ['Aprobado'], nota: 'Ya está aprobado; sale en su fecha.' },
];

const fecha = (iso: string) => new Date(iso + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' });

function Fila({ p }: { p: Pieza }) {
  return (
    <li>
      <Link href={`/pieza/${p.id}`} className="fila">
        <span>
          <div>{p.titulo}</div>
          <small>{[p.formato, p.intencion, p.publicacion && `sale el ${fecha(p.publicacion)}`].filter(Boolean).join(' · ')}</small>
        </span>
        <span className="flecha">→</span>
      </Link>
    </li>
  );
}

export default async function Produccion() {
  const piezas = await enProduccion();
  const paraVal = piezas.filter((p) => ['Grabar', 'Revisión', 'Corregir'].includes(p.estado ?? '')).length;

  return (
    <Shell active="/produccion">
      <p className="eyebrow">Lo que ya aprobaste</p>
      <h1 className="title">En <em>producción</em></h1>
      <p className="lead">
        {piezas.length === 0
          ? 'Todavía no hay piezas aprobadas. Cuando apruebes una propuesta, aparece aquí.'
          : paraVal
            ? `${paraVal} pieza${paraVal === 1 ? '' : 's'} te espera${paraVal === 1 ? '' : 'n'} a ti. El resto lo está moviendo el equipo.`
            : 'Por ahora nada te espera a ti. El equipo está trabajando en lo aprobado.'}
      </p>
      {COLUMNAS.map((c, i) => {
        const lista = piezas.filter((p) => c.estados.includes(p.estado ?? ''));
        if (!lista.length) return null;
        return (
          <section key={c.titulo} className="section">
            <h2><span className="n">0{i + 1}</span>{c.titulo} · {lista.length}</h2>
            <p className="angulo" style={{ marginBottom: 6 }}>{c.nota}</p>
            <ul className="list">{lista.map((p) => <Fila key={p.id} p={p} />)}</ul>
          </section>
        );
      })}
    </Shell>
  );
}
