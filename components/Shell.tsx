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
    <>
      <main className="shell">
        <header className="top">
          <Link href="/" className="mark">Seres Magnéticos</Link>
          {isDemo() && <span className="demo">Modo demo · sin Notion conectado</span>}
        </header>
        {children}
      </main>
      <nav className="nav" aria-label="Secciones">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} aria-current={active === l.href ? 'page' : undefined}>
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
