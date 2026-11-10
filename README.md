# Seres Magnéticos · App de contenido

La pantalla de Val sobre el Sistema de Contenido Magnético. Notion es la fuente única: la app lee y escribe las mismas bases que usan la cofundadora y los agentes.

- **Inicio:** propuestas por decidir, piezas en producción, ideas nuevas y el último informe.
- **Propuestas:** las del lunes, agrupadas por formato. Aprobar pasa la pieza a "Guionar" (el interruptor para la Productora); Ajustar le devuelve una nota a la cofundadora; Descartar la archiva. Nunca se borra nada.
- **Ideas:** la Bandeja de ideas, pensada para el celular.
- **Informe:** el informe del viernes, leído desde Notion.

Se instala en el celular desde el navegador con "Agregar a pantalla de inicio".

## Correr en local

```bash
npm install
npm run dev   # sin variables corre en modo demo, con datos de ejemplo
```

## Conectar Notion

1. notion.so/profile/integrations → New integration (interna) → copiá el secreto en `NOTION_TOKEN`.
2. En Notion, en las páginas **Centro Magnético** y **Calendario Val**: ••• → Connections → agregá la integración.
3. Los IDs de las bases ya vienen en `.env.example`.

## Producción (Vercel)

1. Importá el repo en Vercel.
2. Variables: `NOTION_TOKEN`, `APP_PASSWORD`, `APP_SECRET` (y los `NOTION_DB_*` si las bases cambian de workspace).
3. Deploy.

## Bases de Notion que usa

| Base | Para qué |
| --- | --- |
| Calendario Val | Propuestas y producción. Propiedades nuevas: Propuesta, Intención, Hook, Ángulo y estructura, Comentario de Val, Origen, Semana de propuesta |
| Bandeja de ideas | Ideas que Val suelta desde la app |
| Informes | Informe del viernes |
