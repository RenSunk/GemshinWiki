# Genshin Wiki

https://genshin-wiki.vercel.app

Enciclopedia de personajes, armas y artefactos, constructor de equipos, simulador de gachapón y planificador
de materiales de Genshin Impact, hecho por fans (React + Vite).

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
  `personajes.json`, `armas.json`, `artefactos.json` y `materiales.json` (con las recetas de alquimia)
  van en la carga inicial. Los textos que solo se ven en la página de detalle (talentos, constelaciones,
  efectos de armas, historias) van en un archivo por entrada: `src/data/personajes/<slug>.json`,
  `src/data/armas/<slug>.json` y `src/data/artefactos/<slug>.json`. El navegador descarga solo el de
  la página abierta (`hooks/useDetalle.js`).
- El dominio de cada set de artefactos sale de las recompensas de los dominios de artefactos.
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

## Importar desde Enka.Network

`#/enka` lee la vitrina del perfil de un jugador (por UID) y pasa sus personajes y armas al planificador
con los niveles y talentos reales.

- La API de Enka no permite llamadas desde el navegador (CORS), así que pasa por la función de servidor
  `api/enka.js` (Vercel la publica en `/api/enka?uid=…`). Se identifica con un User-Agent propio, como pide
  Enka, devuelve solo los campos que usa la web y respeta su tiempo de caché.
- En local, `vite dev` y `vite preview` sirven esa misma función con un middleware (`vite.config.js`).
- Los niveles de talento vienen por id de habilidad; el orden [ataque normal, habilidad, definitiva] de cada
  personaje se guarda en `ordenTalentos` desde la documentación de Enka (`npm run datos` lo descarga).

## Hoy

`#/hoy` muestra qué dominios de talentos y de armas conviene hacer cada día según lo que le falta al plan.
Los días y los dominios salen de los datos (`dias` y `dominio` en `materiales.json`), no están escritos a
mano: si el juego cambiara la rotación, basta con `npm update genshin-db && npm run datos`.

## Equipos

`#/equipos/<slug>,<slug>,…` arma un equipo de 4 y muestra sus consonancias elementales (solo con el equipo
completo, como en el juego) y las reacciones posibles. Los personajes de elemento variable llevan el
elegido en la URL (`aether.dendro`). Los efectos de las consonancias vienen de la wiki oficial de HoYoLAB
y los nombres de las reacciones, de los textos del juego en español (`utils/equipos.js`).

## Gachapón

`#/gachapon` tiene un simulador (pity, 50/50 y Camino de la Epitomización, guardado en el navegador) y una
calculadora exacta de la probabilidad de conseguir N copias con X tiradas (`utils/gacha.js`).

- Probabilidades base y pity máximo: las oficiales del juego.
- La subida de probabilidad en las últimas tiradas («pity suave») no es oficial; sus parámetros están
  ajustados para reproducir las probabilidades totales oficiales: personaje 5★ 1,6% (modelo 1,61%) y
  4★ 13% (13,06%); arma 5★ 1,85% (1,856%) y 4★ 14,5% (14,48%).
- No se simula la «Captura radiante» (5.0+), porque sus probabilidades no son públicas.

## Estructura

```
api/
  enka.js                          función de servidor: consulta Enka.Network por UID
src/
  App.jsx                          navegación (#/, #/personaje/<slug>, #/armas, #/arma/<slug>,
                                   #/artefactos, #/artefacto/<slug>, #/equipos/<slugs>, #/gachapon, #/hoy,
                                   #/planificador/<personaje|arma>/<slug>, #/importar/<datos>, #/enka)
  components/Galeria.jsx           personajes: buscador y filtros
  components/GaleriaArmas.jsx      armas: buscador y filtros
  components/Tarjeta.jsx           tarjeta de las galerías
  components/DetallePersonaje.jsx  talentos, constelaciones y materiales
  components/DetalleArma.jsx       stats, efecto por refinamiento, historia y materiales
  components/GaleriaArtefactos.jsx sets de artefactos: búsqueda por nombre o por texto de los bonos
  components/DetalleArtefacto.jsx  bonos, dónde conseguirlo, piezas e historia
  components/Planificador.jsx      niveles objetivo de personajes y armas
  components/ListaMateriales.jsx   materiales agrupados con iconos (y campos "Tengo" en el planificador)
  components/Equipos.jsx           constructor de equipos
  components/Gachapon.jsx          simulador de tiradas y calculadora de probabilidades
  components/Cargando.jsx          aviso mientras llegan los textos de una página de detalle
  components/Hoy.jsx               qué dominios hacer cada día
  components/Respaldo.jsx          exportar e importar el plan
  components/ImportarEnlace.jsx    página que abre un enlace de copia
  components/ImportarEnka.jsx      importar la vitrina de un UID al planificador
  hooks/usePlanificador.js         plan, inventario y opción de alquimia
  hooks/usePlanCalculado.js        necesidades y reparto del inventario (planificador y Hoy)
  hooks/useAlmacenado.js           useState que se guarda en localStorage
  hooks/useDetalle.js              descarga el archivo de textos de una página de detalle
  utils/equipos.js                 consonancias, reacciones y equipo en la URL
  utils/gacha.js                   probabilidades, tirada simulada y cálculo exacto de copias
  utils/calculos.js                costes de ascensión, EXP, talentos, reparto del inventario y alquimia
  utils/hoy.js                     día del juego y materiales pendientes por dominio
  utils/respaldo.js                formato, validación y enlace de la copia de seguridad
  utils/constantes.js              colores de elementos, listas de armas y regiones
```

Sitio de fans no oficial y sin fines comerciales. No está afiliado con HoYoverse.
