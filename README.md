# Teyvat Wiki

Enciclopedia de personajes y planificador de materiales de Genshin Impact, hecho por fans (React + Vite).

## Comandos

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run datos    # regenerar src/data/ desde genshin-db
npm run build    # versión de producción en dist/
```

## Cómo funciona

- `scripts/generar-datos.mjs` lee el paquete `genshin-db` (179 MB, todos los idiomas) y guarda
  solo lo que usa la web, en español, en `src/data/personajes.json` y `src/data/materiales.json`.
- Cuando salga una versión nueva del juego: `npm update genshin-db && npm run datos`.
- Imágenes de personajes: Enka.Network. Iconos de materiales: gi.yatta.moe (Enka no tiene los más nuevos).
- La tabla de experiencia por nivel no viene en genshin-db; está en `src/utils/calculos.js`.

## Estructura

```
src/
  App.jsx                          navegación (#/, #/personaje/<slug>, #/planificador)
  components/Galeria.jsx           buscador y filtros
  components/TarjetaPersonaje.jsx
  components/DetallePersonaje.jsx  talentos, constelaciones y materiales
  components/Planificador.jsx      niveles objetivo por personaje y total de materiales
  components/ListaMateriales.jsx   materiales agrupados con iconos (y campo "Tengo" en el planificador)
  hooks/usePlanificador.js         plan e inventario
  hooks/useAlmacenado.js           useState que se guarda en localStorage
  utils/calculos.js                costes de ascensión, EXP y talentos
  utils/constantes.js              colores de elementos, listas de armas y regiones
```

Sitio de fans no oficial y sin fines comerciales. No está afiliado con HoYoverse.
