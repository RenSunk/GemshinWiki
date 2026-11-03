import { useEffect, useMemo, useState } from 'react'
import { COLORES_ELEMENTO, normalizar } from '../utils/constantes.js'
import {
  ELEMENTOS_JUGABLES,
  TAMANO_EQUIPO,
  consonancias,
  equipoATexto,
  reaccionesPosibles,
  textoAEquipo,
} from '../utils/equipos.js'
import { useAlmacenado } from '../hooks/useAlmacenado.js'

// Constructor de equipos: 4 casillas, consonancias activas y reacciones posibles.
// El equipo vive en la URL (#/equipos/…) para poder compartirlo; también se recuerda el último.
export default function Equipos({ personajes, textoInicial }) {
  const porSlug = useMemo(() => new Map(personajes.map((p) => [p.slug, p])), [personajes])
  const [ultimo, setUltimo] = useAlmacenado('genshin-wiki:equipo', '')
  const [casillas, setCasillas] = useState(() => textoAEquipo(textoInicial || ultimo, porSlug))
  const [busqueda, setBusqueda] = useState('')
  const [elementoFiltro, setElementoFiltro] = useState('')
  const [copiado, setCopiado] = useState(false)

  // La URL y el último equipo guardado siguen a las casillas (sin añadir entradas al historial)
  const texto = equipoATexto(casillas)
  useEffect(() => {
    const vacio = texto.replace(/,/g, '') === ''
    window.history.replaceState(null, '', vacio ? '#/equipos' : `#/equipos/${texto}`)
    setUltimo(texto)
  }, [texto, setUltimo])

  const miembros = casillas.filter(Boolean).map((c) => {
    const personaje = porSlug.get(c.slug)
    return { ...c, personaje, elemento: c.elemento ?? personaje.elemento }
  })
  const elementos = miembros.map((m) => m.elemento)
  const activas = consonancias(elementos)
  const reacciones = reaccionesPosibles(elementos)
  const lleno = miembros.length === TAMANO_EQUIPO

  const agregar = (personaje) => {
    const libre = casillas.indexOf(null)
    if (libre < 0 || casillas.some((c) => c?.slug === personaje.slug)) return
    const nuevas = [...casillas]
    nuevas[libre] = personaje.elemento === 'Variable' ? { slug: personaje.slug, elemento: 'Anemo' } : { slug: personaje.slug }
    setCasillas(nuevas)
  }
  const quitar = (i) => setCasillas(casillas.map((c, j) => (j === i ? null : c)))
  const cambiarElemento = (i, elemento) => setCasillas(casillas.map((c, j) => (j === i ? { ...c, elemento } : c)))

  const copiarEnlace = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      window.prompt('Copia este enlace:', window.location.href)
    }
  }

  const textoBuscado = normalizar(busqueda.trim())
  const disponibles = personajes.filter(
    (p) =>
      (!textoBuscado || normalizar(p.nombre).includes(textoBuscado)) &&
      (!elementoFiltro || p.elemento === elementoFiltro),
  )

  return (
    <section className="equipos">
      <h1 className="titulo-pagina">Constructor de equipos</h1>
      <p className="nota">
        Elige 4 personajes y mira qué consonancias elementales activan y qué reacciones pueden causar.
      </p>

      <div className="casillas">
        {casillas.map((c, i) => {
          if (!c) {
            return (
              <div key={i} className="casilla vacia">
                <span>Vacía</span>
              </div>
            )
          }
          const p = porSlug.get(c.slug)
          const elemento = c.elemento ?? p.elemento
          return (
            <div key={i} className="casilla" style={{ '--color': COLORES_ELEMENTO[elemento] }}>
              <button className="casilla-quitar" onClick={() => quitar(i)} aria-label={`Quitar a ${p.nombre}`}>
                ✕
              </button>
              <img src={p.icono} alt="" className={`rareza-${p.rareza}`} />
              <a href={`#/personaje/${p.slug}`} className="casilla-nombre">
                {p.nombre}
              </a>
              {p.elemento === 'Variable' ? (
                <select value={elemento} onChange={(e) => cambiarElemento(i, e.target.value)} aria-label="Elemento">
                  {ELEMENTOS_JUGABLES.map((e) => (
                    <option key={e}>{e}</option>
                  ))}
                </select>
              ) : (
                <span className="casilla-elemento">{elemento}</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="respaldo-botones">
        <button className="boton-secundario" onClick={copiarEnlace} disabled={!miembros.length}>
          {copiado ? '✓ Enlace copiado' : 'Copiar enlace del equipo'}
        </button>
        <button className="boton-secundario" onClick={() => setCasillas(textoAEquipo('', porSlug))} disabled={!miembros.length}>
          Vaciar equipo
        </button>
      </div>

      {miembros.length > 0 && (
        <div className="analisis">
          <section>
            <h2 className="hoy-subtitulo">Consonancias elementales</h2>
            {!lleno ? (
              <p className="nota">Se activan con el equipo completo de 4 personajes.</p>
            ) : activas.length ? (
              <div className="habilidades">
                {activas.map((k) => (
                  <div key={k.clave} className="habilidad" style={{ '--color': COLORES_ELEMENTO[k.elementos[0]] }}>
                    <span className="habilidad-tipo">{k.requisito}</span>
                    <h3>
                      {k.nombre} <Elementos lista={k.elementos} />
                    </h3>
                    <p>{k.efecto}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="nota">
                Este equipo no activa ninguna: hace falta repetir un elemento o tener 4 elementos distintos.
              </p>
            )}
          </section>

          <section>
            <h2 className="hoy-subtitulo">Reacciones posibles</h2>
            {reacciones.length ? (
              <ul className="reacciones">
                {reacciones.map((r) => (
                  <li key={r.nombre}>
                    <strong>{r.nombre}</strong> <Elementos lista={r.elementos} />
                    <small>{r.descripcion}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="nota">
                {new Set(elementos).size < 2
                  ? 'Hacen falta al menos 2 elementos distintos para causar reacciones.'
                  : 'Estos elementos no reaccionan entre sí.'}
              </p>
            )}
          </section>
        </div>
      )}

      <h2 className="hoy-subtitulo">{lleno ? 'Equipo completo' : 'Añade personajes'}</h2>
      <div className="filtros">
        <input
          type="search"
          className="buscador"
          placeholder="Buscar personaje…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <div className="filtro-elementos">
          {[...ELEMENTOS_JUGABLES, 'Variable'].map((el) => (
            <button
              key={el}
              className={`chip ${elementoFiltro === el ? 'activo' : ''}`}
              style={{ '--color': COLORES_ELEMENTO[el] }}
              onClick={() => setElementoFiltro(elementoFiltro === el ? '' : el)}
            >
              {el}
            </button>
          ))}
        </div>
      </div>
      <div className="galeria galeria-equipo">
        {disponibles.map((p) => {
          const enEquipo = casillas.some((c) => c?.slug === p.slug)
          return (
            <button
              key={p.id}
              className={`tarjeta ${enEquipo ? 'en-equipo' : ''}`}
              onClick={() => agregar(p)}
              disabled={enEquipo || lleno}
              title={enEquipo ? 'Ya está en el equipo' : lleno ? 'El equipo está completo' : `Añadir a ${p.nombre}`}
            >
              <div className={`tarjeta-imagen rareza-${p.rareza}`}>
                <img src={p.icono} alt="" loading="lazy" />
                <span className="tarjeta-elemento" style={{ background: COLORES_ELEMENTO[p.elemento] }} />
              </div>
              <div className="tarjeta-nombre">{p.nombre}</div>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function Elementos({ lista }) {
  return (
    <span className="elementos-mini">
      {[...new Set(lista)].map((e) => (
        <span key={e} className="elemento-mini" style={{ '--color': COLORES_ELEMENTO[e] }}>
          {e}
        </span>
      ))}
    </span>
  )
}
