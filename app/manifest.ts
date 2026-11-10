import type { MetadataRoute } from 'next';

/** Permite instalar la app en el celular desde el navegador ("Agregar a inicio"). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Seres Magnéticos',
    short_name: 'Magnéticos',
    start_url: '/',
    display: 'standalone',
    background_color: '#f4f2ee',
    theme_color: '#5b3a7a',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
