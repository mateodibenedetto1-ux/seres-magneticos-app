import type { MetadataRoute } from 'next';

/** Permite instalar la app en el celular desde el navegador ("Agregar a inicio"). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Seres Magnéticos',
    short_name: 'Magnéticos',
    start_url: '/',
    display: 'standalone',
    background_color: '#f2f2e8',
    theme_color: '#f2f2e8',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
