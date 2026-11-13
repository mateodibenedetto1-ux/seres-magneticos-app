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
  publicacion: string | null;
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
    publicacion: date(p, 'Fecha Posteo'),
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
  if (isDemo()) return DEMO_PRODUCCION;
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
  if (decision === 'Ajustar') await avisarAjuste(id, comentario).catch(() => {});
}

/**
 * Aviso del ajuste: un comentario en la página de Notion que menciona a quien opera el sistema,
 * así le llega la notificación de Notion (app y correo). Si falla, la decisión igual queda guardada.
 * Configuración: NOTION_AVISAR_USER_ID (ID de usuario de Notion) o NOTION_AVISAR_EMAIL.
 */
async function quienAvisar(): Promise<string | null> {
  if (process.env.NOTION_AVISAR_USER_ID) return process.env.NOTION_AVISAR_USER_ID;
  const email = process.env.NOTION_AVISAR_EMAIL?.toLowerCase();
  if (!email) return null;
  let cursor: string | undefined;
  do {
    const json = await api(`users?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`);
    const u = json.results.find((x: any) => x.person?.email?.toLowerCase() === email);
    if (u) return u.id;
    cursor = json.has_more ? json.next_cursor : undefined;
  } while (cursor);
  return null;
}

async function avisarAjuste(id: string, comentario: string) {
  const user = await quienAvisar();
  const rich_text: unknown[] = [];
  if (user) rich_text.push({ type: 'mention', mention: { user: { id: user } } }, { text: { content: ' ' } });
  rich_text.push({ text: { content: `Val pidió ajustar esta propuesta: “${comentario.trim().slice(0, 1800)}”` } });
  await api('comments', { method: 'POST', body: { parent: { page_id: id }, rich_text } });
}

/** Una pieza con todo su contenido (el guion vive en el cuerpo de la página). */
export async function pieza(id: string): Promise<{ pieza: Pieza; guion: { tipo: string; texto: string }[] } | null> {
  if (isDemo()) {
    const p = [...DEMO_PROPUESTAS, ...DEMO_PRODUCCION].find((x) => x.id === id);
    return p ? { pieza: p, guion: p.estado ? DEMO_GUION : [] } : null;
  }
  try {
    const page = await api(`pages/${id}`);
    return { pieza: toPieza(page), guion: await bloques(id) };
  } catch {
    return null;
  }
}

/** Estados de producción que Val puede mover desde la app. Nunca se borra nada. */
export const PASOS_VAL = ['Grabar', 'Material Listo', 'Revisión', 'Publicado'] as const;

export async function moverEstado(id: string, estado: (typeof PASOS_VAL)[number]) {
  if (isDemo()) return;
  await api(`pages/${id}`, { method: 'PATCH', body: { properties: { Estado: { status: { name: estado } } } } });
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
    hook: 'Tu cuerpo ya eligió antes de que tú lo pensaras.', angulo: 'Dato científico → resonancia espiritual → una práctica de 30 segundos.',
    propuesta: 'Propuesta', estado: null, comentario: '', semana: null, publicacion: null,
  },
  {
    id: 'demo-2', url: '#', titulo: 'Secuencia: lo que nadie te dice de la confianza', formato: 'Historias', intencion: 'Conectar',
    hook: 'Encuesta: ¿te cuesta más empezar o sostener?', angulo: '7 historias: pregunta → historia personal → caja de preguntas → palabra clave CONFIANZA por DM.',
    propuesta: 'Propuesta', estado: null, comentario: '', semana: null, publicacion: null,
  },
  {
    id: 'demo-3', url: '#', titulo: '5 señales de que estás lista para Magna', formato: 'Carrusel', intencion: 'Convertir',
    hook: 'Si te ves en 3 de estas 5, no es casualidad.', angulo: 'Portada + 5 señales + testimonio + CTA a la landing.',
    propuesta: 'Ajustar', estado: null, comentario: 'Menos técnico en la señal 4.', semana: null, publicacion: null,
  },
];

const DEMO_PRODUCCION: Pieza[] = [
  {
    id: 'demo-4', url: '#', titulo: 'La versión de mí que cobraba 200 dólares', formato: 'Reel', intencion: 'Conectar',
    hook: 'La versión de mí que cobraba 200 dólares murió el día que me animé a cobrar lo que valía.',
    angulo: 'Muerte y Renacimiento. Cierra en "La evidencia no crea la decisión; la decisión crea la evidencia".',
    propuesta: 'Aprobada', estado: 'Grabar', comentario: '', semana: null, publicacion: null,
  },
];

const DEMO_GUION = [
  { tipo: 'heading_3', texto: 'Hook (0–3 s)' },
  { tipo: 'paragraph', texto: 'La versión de mí que cobraba 200 dólares por todo lo que sabía murió el día que me animé a cobrar lo que valía.' },
  { tipo: 'heading_3', texto: 'Contexto' },
  { tipo: 'paragraph', texto: 'Durante años expliqué mi precio. Sumaba sesiones, bonos, llamadas extra, como si tuviera que justificar que merecía cobrar. Y cada vez que alguien me decía "lo voy a pensar", sentía el pecho apretado.' },
  { tipo: 'paragraph', texto: 'Un día decidí dejar de explicarlo. Diseñé una transformación que valía ese precio y pasé de una oferta de 200 dólares a un paquete de 2.200.' },
  { tipo: 'heading_3', texto: 'Moraleja' },
  { tipo: 'paragraph', texto: 'La evidencia no crea la decisión. La decisión crea la evidencia.' },
  { tipo: 'heading_3', texto: 'CTA' },
  { tipo: 'paragraph', texto: 'Comenta FUNDADORA si ya estás lista para dejar de explicar tu precio.' },
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
