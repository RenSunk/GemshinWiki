# Genshin Wiki

https://genshin-wiki.vercel.app

Enciclopedia de personajes y armas, y planificador de materiales de Genshin Impact, hecho por fans (React + Vite).

## Comandos

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run datos    # regenerar src/data/ desde genshin-db
npm run build    # versión de producción en dist/
```

Cada `git push` a `main` se publica solo en Vercel.

## Cómo funciona

- `scripts/generar-datos.mjs` lee el paquete `genshin-db` (179 MB, todos los idiomas) y guarda
  solo lo que usa la web, en español, en `src/data/`:
  `personajes.json`, `armas.json`, `materiales.json` (con las recetas de alquimia) y
  `armas-historias.json` (se descarga aparte, solo al abrir la historia de un arma).
- Cuando salga una versión nueva del juego: `npm update genshin-db && npm run datos`.
- Imágenes de personajes y armas: Enka.Network. Iconos de materiales: gi.yatta.moe (Enka no tiene los más nuevos).
- Las tablas de EXP por nivel (personajes y armas por rareza) no vienen en genshin-db; están en
  `src/utils/calculos.js`, sacadas de los datos del juego.

## Planificador

- La EXP se cuenta en puntos: el inventario guarda cuántos libros (20 000 / 5000 / 1000) o
  minerales (10 000 / 2000 / 400) tienes.
- El inventario se reparte en el orden de prioridad de la lista.
- Con «Usar alquimia», lo que falta se fabrica con 3 del nivel inferior que sobren, sumando su coste en mora.
- «Copia de seguridad» exporta el plan como archivo o como enlace (`#/importar/<datos>`) para pasarlo a
  otro dispositivo. Al importar se valida todo y se pide confirmación antes de reemplazar.

## Hoy

`#/hoy` muestra qué dominios de talentos y de armas conviene hacer cada día según lo que le falta al plan.
Los días y los dominios salen de los datos (`dias` y `dominio` en `materiales.json`), no están escritos a
mano: si el juego cambiara la rotación, basta con `npm update genshin-db && npm run datos`.

## Estructura

```
src/
  App.jsx                          navegación (#/, #/personaje/<slug>, #/armas, #/arma/<slug>, #/hoy,
                                   #/planificador/<personaje|arma>/<slug>, #/importar/<datos>)
  components/Galeria.jsx           personajes: buscador y filtros
  components/GaleriaArmas.jsx      armas: buscador y filtros
  components/Tarjeta.jsx           tarjeta de las galerías
  components/DetallePersonaje.jsx  talentos, constelaciones y materiales
  components/DetalleArma.jsx       stats, efecto por refinamiento, historia y materiales
  components/Planificador.jsx      niveles objetivo de personajes y armas
  components/ListaMateriales.jsx   materiales agrupados con iconos (y campos "Tengo" en el planificador)
  components/Hoy.jsx               qué dominios hacer cada día
  components/Respaldo.jsx          exportar e importar el plan
  components/ImportarEnlace.jsx    página que abre un enlace de copia
  hooks/usePlanificador.js         plan, inventario y opción de alquimia
  hooks/usePlanCalculado.js        necesidades y reparto del inventario (planificador y Hoy)
  hooks/useAlmacenado.js           useState que se guarda en localStorage
  utils/calculos.js                costes de ascensión, EXP, talentos, reparto del inventario y alquimia
  utils/hoy.js                     día del juego y materiales pendientes por dominio
  utils/respaldo.js                formato, validación y enlace de la copia de seguridad
  utils/constantes.js              colores de elementos, listas de armas y regiones
```

Sitio de fans no oficial y sin fines comerciales. No está afiliado con HoYoverse.
