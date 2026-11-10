import Link from 'next/link';
import { isDemo } from '@/lib/notion';

const LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/lunes', label: 'Propuestas' },
  { href: '/ideas', label: 'Ideas' },
  { href: '/informe', label: 'Informe' },
];

export function Shell({ active, children }: { active: string; children: React.ReactNode }) {
  return (
    <main className="shell">
      <header className="top">
        <Link href="/" className="mark">Seres Magnéticos</Link>
        <nav className="nav" aria-label="Secciones">
          {LINKS.map((l, i) => (
            <Link key={l.href} href={l.href} aria-current={active === l.href ? 'page' : undefined}>
              <small>0{i + 1}</small>
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      {isDemo() && <p className="demo" style={{ marginTop: -20, marginBottom: 24 }}>Modo demo · sin Notion conectado</p>}
      {children}
    </main>
  );
}
