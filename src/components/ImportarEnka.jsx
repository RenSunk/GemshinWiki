import { useMemo, useState } from 'react'
import { useAlmacenado } from '../hooks/useAlmacenado.js'
import { NIVELES, nivelDesdeJuego } from '../utils/calculos.js'
import { COLORES_ELEMENTO } from '../utils/constantes.js'

// Importa la vitrina de un jugador desde Enka.Network (vía /api/enka) y la pasa al planificador
export default function ImportarEnka({ personajes, armas, planificador }) {
  const [uidGuardado, setUidGuardado] = useAlmacenado('genshin-wiki:uid', '')
  const [uid, setUid] = useState(uidGuardado)
  const [estado, setEstado] = useState({ cargando: false, error: null, datos: null })
  const [conArmas, setConArmas] = useState(true)
  const [importados, setImportados] = useState(new Set())

  const personajePorId = useMemo(() => new Map(personajes.map((p) => [p.id, p])), [personajes])
  const armaPorId = useMemo(() => new Map(armas.map((a) => [a.id, a])), [armas])

  const buscar = async (e) => {
    e.preventDefault()
    const limpio = uid.trim()
    if (!/^\d{9,10}$/.test(limpio)) {
      setEstado({ cargando: false, error: 'El UID son 9 o 10 números (lo ves abajo a la derecha en el juego).', datos: null })
      return
    }
    setEstado({ cargando: true, error: null, datos: null })
    setImportados(new Set())
    let respuesta
    try {
      respuesta = await fetch(`/api/enka?uid=${limpio}`)
    } catch {
      setEstado({ cargando: false, error: 'Sin conexión. Revisa tu internet.', datos: null })
      return
    }
    // Si algo falla antes de llegar a la función (p. ej. un error del servidor), puede no venir JSON
    const datos = await respuesta.json().catch(() => null)
    if (!respuesta.ok || !datos) {
      setEstado({ cargando: false, error: datos?.error ?? 'No se pudo consultar Enka.Network. Prueba de nuevo en un momento.', datos: null })
      return
    }
    setUidGuardado(limpio)
    setEstado({ cargando: false, error: null, datos })
  }

  // Detalles de la vitrina convertidos a nuestros datos (se ignora lo que no esté en genshin-db)
  const fichas = (estado.datos?.detalles ?? [])
    .map((d) => {
      const personaje = personajePorId.get(d.avatarId)
      if (!personaje) return null
      const conTalentos = personaje.ordenTalentos.length === 3 && personaje.costesTalento.length > 0
      const talentos = conTalentos ? personaje.ordenTalentos.map((id) => Math.min(10, Math.max(1, d.talentos[id] ?? 1))) : null
      const arma = d.arma && armaPorId.get(d.arma.id)
      return { ...d, personaje, talentos, arma: arma && { ...d.arma, entidad: arma } }
    })
    .filter(Boolean)

  const aPlanes = (ficha) => [
    {
      tipo: 'personaje',
      entidad: ficha.personaje,
      nivelActual: nivelDesdeJuego(ficha.nivel, ficha.fase),
      talentos: ficha.talentos,
    },
    ...(conArmas && ficha.arma
      ? [{ tipo: 'arma', entidad: ficha.arma.entidad, nivelActual: nivelDesdeJuego(ficha.arma.nivel, ficha.arma.fase) }]
      : []),
  ]

  const importar = (lista) => {
    planificador.importarNiveles(lista.flatMap(aPlanes))
    setImportados(new Set([...importados, ...lista.map((f) => f.avatarId)]))
  }

  const { datos } = estado
  const jugador = datos?.jugador
  const retrato = jugador?.avatarId && personajePorId.get(jugador.avatarId)

  return (
    <section className="importar-enka">
      <h1 className="titulo-pagina">Importar desde Enka.Network</h1>
      <p className="nota">
        Escribe tu UID y se leerán los personajes de la vitrina de tu perfil del juego, con su nivel, talentos y arma,
        para pasarlos al <a href="#/planificador">planificador</a>.
      </p>

      <form className="agregar-personaje" onSubmit={buscar}>
        <input
          className="buscador"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Tu UID (p. ej. 618285856)"
          value={uid}
          onChange={(e) => setUid(e.target.value.replace(/\D/g, '').slice(0, 10))}
          aria-label="UID"
        />
        <button type="submit" className="boton-principal" disabled={estado.cargando}>
          {estado.cargando ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {estado.error && <p className="respaldo-mensaje error">{estado.error}</p>}

      {jugador && (
        <>
          <div className="perfil">
            {retrato && <img src={retrato.icono} alt="" className={`rareza-${retrato.rareza}`} />}
            <div>
              <h2>{jugador.nombre}</h2>
              <p className="nota">
                UID {datos.uid} · Rango de aventura {jugador.nivel} · Nivel de mundo {jugador.nivelMundo}
                {jugador.abismo && ` · Abismo ${jugador.abismo}`} · {jugador.logros} logros
              </p>
              {jugador.firma && <p className="detalle-descripcion">«{jugador.firma}»</p>}
            </div>
          </div>

          {fichas.length === 0 ? (
            <p className="respaldo-mensaje error">
              {datos.vitrina.length
                ? 'Este jugador tiene personajes en la vitrina pero oculta sus detalles. En el juego: Perfil → Editar perfil → activa «Mostrar detalles de los personajes».'
                : 'Este jugador no tiene personajes en la vitrina. Añádelos en el juego desde Perfil → Editar perfil.'}
            </p>
          ) : (
            <>
              <div className="barra-planificador">
                <label>
                  <input type="checkbox" checked={conArmas} onChange={(e) => setConArmas(e.target.checked)} />
                  Importar también sus armas
                </label>
                <button className="boton-principal" onClick={() => importar(fichas)}>
                  Añadir todos al planificador
                </button>
              </div>

              <div className="fichas">
                {fichas.map((f) => (
                  <FichaPersonaje
                    key={f.avatarId}
                    ficha={f}
                    importado={importados.has(f.avatarId)}
                    enPlan={planificador.estaEnPlan('personaje', f.personaje.slug)}
                    onImportar={() => importar([f])}
                  />
                ))}
              </div>
              <p className="nota">
                Los niveles se ajustan al corte más cercano del planificador (un nivel 63 cuenta como 60). Los talentos
                son los niveles base, sin los +3 de las constelaciones. Datos de{' '}
                <a href={`https://enka.network/u/${datos.uid}/`} target="_blank" rel="noreferrer">
                  Enka.Network
                </a>

                , que guarda la vitrina unos minutos: si acabas de cambiar algo en el juego, espera un poco y vuelve
                a buscar.
              </p>
            </>
          )}
        </>
      )}
    </section>
  )
}

function FichaPersonaje({ ficha: f, importado, enPlan, onImportar }) {
  const p = f.personaje
  return (
    <article className="ficha" style={{ '--color': COLORES_ELEMENTO[p.elemento] }}>
      <header>
        <img src={p.icono} alt="" className={`rareza-${p.rareza}`} />
        <div>
          <a href={`#/personaje/${p.slug}`}>{p.nombre}</a>
          <span>
            Nv. {f.nivel} · C{f.constelaciones}
          </span>
          <small>{NIVELES[nivelDesdeJuego(f.nivel, f.fase)].etiqueta} en el planificador</small>
        </div>
      </header>
      {f.talentos && <p className="ficha-talentos">Talentos: {f.talentos.join(' / ')}</p>}
      {f.arma && (
        <div className="ficha-arma">
          <img src={f.arma.entidad.icono} alt="" className={`rareza-${f.arma.entidad.rareza}`} />
          <span>
            {f.arma.entidad.nombre}
            <small>
              Nv. {f.arma.nivel} · R{f.arma.refinamiento}
            </small>
          </span>
        </div>
      )}
      <button className={importado ? 'boton-secundario' : 'boton-principal'} onClick={onImportar}>
        {importado ? '✓ Importado' : enPlan ? 'Actualizar en el planificador' : 'Añadir al planificador'}
      </button>
    </article>
  )
}
