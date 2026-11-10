import 'server-only';

/**
 * Notion es la fuente única: la app lee y escribe las mismas bases que usan
 * la cofundadora y los agentes. Sin NOTION_TOKEN la app corre con datos de ejemplo.
 */

const VERSION = '2022-06-28';
const token = () => process.env.NOTION_TOKEN;
export const isDemo = () => !token();

const DB = {
  contenido: () => process.env.NOTION_DB_CONTENIDO || 'c977e0f1e21383aba42d01d37dba2aa8',
  bandeja: () => process.env.NOTION_DB_BANDEJA || '5b72e956a32f456fb61f6f6805d7c90e',
  informes: () => process.env.NOTION_DB_INFORMES || 'af00c7fa60a2497b8320f2b8a0ce56c5',
};

async function api(path: string, init?: { method?: string; body?: unknown }) {
  const res = await fetch(`https://api.notion.com/v1/${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${token()}`,
      'Notion-Version': VERSION,
      'Content-Type': 'application/json',
    },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Notion ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

async function queryAll(dbId: string, body: Record<string, unknown>) {
  const out: any[] = [];
  let cursor: string | undefined;
  do {
    const json = await api(`databases/${dbId}/query`, {
      method: 'POST',
      body: { ...body, page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) },
    });
    out.push(...json.results);
    cursor = json.has_more ? json.next_cursor : undefined;
  } while (cursor);
  return out;
}

const text = (rt: any[] | undefined) => (rt ?? []).map((t) => t.plain_text ?? '').join('');
const prop = (p: any, key: string) => p?.properties?.[key];
const sel = (p: any, key: string): string | null => prop(p, key)?.select?.name ?? prop(p, key)?.status?.name ?? null;
const rich = (p: any, key: string) => text(prop(p, key)?.rich_text ?? prop(p, key)?.title);
const date = (p: any, key: string): string | null => prop(p, key)?.date?.start ?? null;

/* ---------------- Contenido (Calendario Val) ---------------- */

export type Decision = 'Propuesta' | 'Aprobada' | 'Ajustar' | 'Descartada';
export type Intencion = 'Cautivar' | 'Conectar' | 'Convertir';

export type Pieza = {
  id: string;
  url: string;
  titulo: string;
  formato: string | null;
  intencion: Intencion | null;
  hook: string;
  angulo: string;
  propuesta: Decision | null;
  estado: string | null;
  comentario: string;
  semana: string | null;
};

function toPieza(p: any): Pieza {
  return {
    id: p.id,
    url: p.url,
    titulo: rich(p, 'Contenido') || 'Sin título',
    formato: sel(p, 'Formato'),
    intencion: sel(p, 'Intención') as Intencion | null,
    hook: rich(p, 'Hook'),
    angulo: rich(p, 'Ángulo y estructura'),
    propuesta: sel(p, 'Propuesta') as Decision | null,
    estado: sel(p, 'Estado'),
    comentario: rich(p, 'Comentario de Val'),
    semana: date(p, 'Semana de propuesta'),
  };
}

/** Propuestas que esperan decisión de Val (nuevas o devueltas con "Ajustar"). */
export async function propuestasPendientes(): Promise<Pieza[]> {
  if (isDemo()) return DEMO_PROPUESTAS;
  const rows = await queryAll(DB.contenido(), {
    filter: {
      or: [
        { property: 'Propuesta', select: { equals: 'Propuesta' } },
        { property: 'Propuesta', select: { equals: 'Ajustar' } },
      ],
    },
    sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
  });
  return rows.map(toPieza);
}

/** Lo aprobado que todavía no se publicó: lo que la Productora tiene en curso. */
export async function enProduccion(): Promise<Pieza[]> {
  if (isDemo()) return [];
  const rows = await queryAll(DB.contenido(), {
    filter: {
      and: [
        { property: 'Propuesta', select: { equals: 'Aprobada' } },
        { property: 'Estado', status: { does_not_equal: 'Publicado' } },
      ],
    },
  });
  return rows.map(toPieza);
}

/**
 * La decisión de Val. "Aprobada" es el interruptor: pasa la pieza a Guionar
 * para que la Productora la desarrolle. Nunca se borra nada.
 */
export async function decidir(id: string, decision: Exclude<Decision, 'Propuesta'>, comentario: string) {
  if (isDemo()) return;
  const properties: Record<string, unknown> = {
    Propuesta: { select: { name: decision } },
  };
  if (comentario.trim()) {
    properties['Comentario de Val'] = { rich_text: [{ text: { content: comentario.trim().slice(0, 1900) } }] };
  }
  if (decision === 'Aprobada') properties['Estado'] = { status: { name: 'Guionar' } };
  await api(`pages/${id}`, { method: 'PATCH', body: { properties } });
}

/* ---------------- Bandeja de ideas ---------------- */

export type Idea = { id: string; idea: string; detalle: string; creada: string; procesada: boolean };

export async function ideasRecientes(): Promise<Idea[]> {
  if (isDemo()) return DEMO_IDEAS;
  const json = await api(`databases/${DB.bandeja()}/query`, {
    method: 'POST',
    body: { page_size: 20, sorts: [{ timestamp: 'created_time', direction: 'descending' }] },
  });
  return json.results.map((p: any) => ({
    id: p.id,
    idea: rich(p, 'Idea'),
    detalle: rich(p, 'Detalle'),
    creada: p.created_time,
    procesada: !!prop(p, 'Procesada')?.checkbox,
  }));
}

export async function guardarIdea(idea: string, detalle: string) {
  if (isDemo()) return;
  await api('pages', {
    method: 'POST',
    body: {
      parent: { database_id: DB.bandeja() },
      properties: {
        Idea: { title: [{ text: { content: idea.slice(0, 200) } }] },
        ...(detalle
          ? { Detalle: { rich_text: [{ text: { content: detalle.slice(0, 1900) } }] } }
          : {}),
      },
    },
  });
}

/* ---------------- Informes ---------------- */

export type Informe = { id: string; url: string; titulo: string; tipo: string | null; semana: string | null; resumen: string };

export async function informes(): Promise<Informe[]> {
  if (isDemo()) return DEMO_INFORMES;
  const json = await api(`databases/${DB.informes()}/query`, {
    method: 'POST',
    body: { page_size: 12, sorts: [{ property: 'Semana', direction: 'descending' }] },
  });
  return json.results.map((p: any) => ({
    id: p.id,
    url: p.url,
    titulo: rich(p, 'Informe'),
    tipo: sel(p, 'Tipo'),
    semana: date(p, 'Semana'),
    resumen: rich(p, 'Resumen'),
  }));
}

/** Contenido de una página como texto plano por bloques (para leer el informe dentro de la app). */
export async function bloques(pageId: string): Promise<{ tipo: string; texto: string }[]> {
  if (isDemo()) return DEMO_BLOQUES;
  const out: { tipo: string; texto: string }[] = [];
  let cursor: string | undefined;
  do {
    const json = await api(`blocks/${pageId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`);
    for (const b of json.results) {
      const v = b[b.type] ?? {};
      const t = text(v.rich_text);
      if (t || b.type === 'divider') out.push({ tipo: b.type, texto: t });
    }
    cursor = json.has_more ? json.next_cursor : undefined;
  } while (cursor);
  return out;
}

/* ---------------- Datos de ejemplo ---------------- */

const DEMO_PROPUESTAS: Pieza[] = [
  {
    id: 'demo-1', url: '#', titulo: 'Tu sistema nervioso decide antes que tu mente', formato: 'Reel', intencion: 'Cautivar',
    hook: 'Tu cuerpo ya eligió antes de que vos lo pensaras.', angulo: 'Dato científico → resonancia espiritual → una práctica de 30 segundos.',
    propuesta: 'Propuesta', estado: null, comentario: '', semana: null,
  },
  {
    id: 'demo-2', url: '#', titulo: 'Secuencia: lo que nadie te dice de la confianza', formato: 'Historias', intencion: 'Conectar',
    hook: 'Encuesta: ¿te cuesta más empezar o sostener?', angulo: '7 historias: pregunta → historia personal → caja de preguntas → palabra clave CONFIANZA por DM.',
    propuesta: 'Propuesta', estado: null, comentario: '', semana: null,
  },
  {
    id: 'demo-3', url: '#', titulo: '5 señales de que estás lista para Magna', formato: 'Carrusel', intencion: 'Convertir',
    hook: 'Si te ves en 3 de estas 5, no es casualidad.', angulo: 'Portada + 5 señales + testimonio + CTA a la landing.',
    propuesta: 'Ajustar', estado: null, comentario: 'Menos técnico en la señal 4.', semana: null,
  },
];

const DEMO_IDEAS: Idea[] = [
  { id: 'i1', idea: 'Hablar del miedo a cobrar más', detalle: 'Salió en la clase del martes', creada: new Date().toISOString(), procesada: false },
];

const DEMO_INFORMES: Informe[] = [
  { id: 'r1', url: '#', titulo: 'Rendimiento · semana 1', tipo: 'Rendimiento', semana: null, resumen: 'El primer informe llega el viernes a las 11:00.' },
];

const DEMO_BLOQUES = [
  { tipo: 'heading_2', texto: 'Qué funcionó' },
  { tipo: 'paragraph', texto: 'Acá se va a ver el informe del viernes, con lo que funcionó y lo que no, por plataforma y formato.' },
];
