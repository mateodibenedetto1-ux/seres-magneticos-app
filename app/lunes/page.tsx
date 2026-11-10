import { Shell } from '@/components/Shell';
import { PropuestaCard } from '@/components/PropuestaCard';
import { propuestasPendientes, type Pieza } from '@/lib/notion';

export const metadata = { title: 'Propuestas' };

const ORDEN = ['Reel', 'Historias', 'Carrusel', 'Email'];
const NOMBRE: Record<string, string> = { Reel: 'Reels', Historias: 'Historias', Carrusel: 'Carruseles', Email: 'Newsletters' };

export default async function Lunes() {
  const piezas = await propuestasPendientes();
  const grupos = new Map<string, Pieza[]>();
  for (const p of piezas) {
    const k = p.formato ?? 'Otros';
    grupos.set(k, [...(grupos.get(k) ?? []), p]);
  }
  const rango = (k: string) => (ORDEN.includes(k) ? ORDEN.indexOf(k) : 99);
  const claves = [...grupos.keys()].sort((a, b) => rango(a) - rango(b));

  return (
    <Shell active="/lunes">
      <h1 className="title">Propuestas de la semana</h1>
      <p className="lead">Aprobá lo que querés que se produzca. Con “Ajustar” la cofundadora la reescribe y vuelve acá.</p>
      {piezas.length === 0 && <p className="empty">Todo decidido. Las próximas propuestas llegan el lunes a las 8:00.</p>}
      {claves.map((k) => (
        <section key={k} className="section">
          <h2>{NOMBRE[k] ?? k} · {grupos.get(k)!.length}</h2>
          {grupos.get(k)!.map((p) => <PropuestaCard key={p.id} p={p} />)}
        </section>
      ))}
    </Shell>
  );
}
