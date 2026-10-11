/**
 * Ruta de un asset público (carpeta `public/`) respetando el `base` de Vite.
 * En local es "/", en GitHub Pages es "/Yisus-D-Dev/" — así las imágenes
 * funcionan en ambos entornos sin rutas absolutas rotas.
 */
export const asset = (name: string) => `${import.meta.env.BASE_URL}${name}`;
