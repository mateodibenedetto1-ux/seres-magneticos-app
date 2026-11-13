import Link from 'next/link';
import { isDemo } from '@/lib/notion';

const LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/lunes', label: 'Propuestas' },
  { href: '/produccion', label: 'Producción' },
  { href: '/ideas', label: 'Bóveda' },
  { href: '/informe', label: 'Informe' },
];

export function Shell({ active, children, ancho = false }: { active: string; children: React.ReactNode; ancho?: boolean }) {
  return (
    <>
      <main className={`shell${ancho ? ' ancho' : ''}`}>
        <header className="top">
          <Link href="/" className="mark">Seres Magnéticos</Link>
          {isDemo() && <span className="demo">Modo demo · sin Notion conectado</span>}
        </header>
        {children}
      </main>
      <nav className="nav" aria-label="Secciones">
        {LINKS.map((l, i) => (
          <Link key={l.href} href={l.href} aria-current={active === l.href ? 'page' : undefined}>
            <small>0{i + 1}</small>
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
