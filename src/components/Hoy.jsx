import { useState } from 'react'
import { usePlanCalculado } from '../hooks/usePlanCalculado.js'
import { DIAS_SEMANA, diaDelJuego, materialesPorDominio } from '../utils/hoy.js'
import { formatearNumero } from '../utils/constantes.js'

// "¿Qué farmear hoy?": dominios abiertos el día elegido con materiales que le faltan a tu plan
export default function Hoy({ personajes, armas, planificador }) {
  const hoy = diaDelJuego()
  const [dia, setDia] = useState(hoy)
  const { planes, repartos, entidadDe } = usePlanCalculado(personajes, armas, planificador)

  if (planes.length === 0) {
    return (
      <section>
        <h1 className="titulo-pagina">¿Qué farmear hoy?</h1>
        <p className="vacio">
          Añade personajes o armas al <a href="#/planificador">planificador</a> y aquí verás qué dominios te conviene
          hacer cada día.
        </p>
      </section>
    )
  }

  const dominios = materialesPorDominio(planes, repartos, entidadDe)
  const abiertos = juntarPorEntrada(dominios.filter((d) => d.dias.includes(dia)))
  const otros = dominios.filter((d) => !d.dias.includes(dia))

  return (
    <section className="hoy">
      <h1 className="titulo-pagina">¿Qué farmear hoy?</h1>
      <p className="nota">
        Dominios de talentos y de armas con materiales que aún te faltan, según tu planificador e inventario. El día
        del juego cambia a las 4:00.
      </p>

      <div className="dias" role="tablist" aria-label="Día de la semana">
        {DIAS_SEMANA.map((d) => (
          <button
            key={d}
            role="tab"
            aria-selected={dia === d}
            className={`${dia === d ? 'activo' : ''} ${d === hoy ? 'es-hoy' : ''}`}
            onClick={() => setDia(d)}
          >
            {d.slice(0, 3)}
            {d === hoy && <small>hoy</small>}
          </button>
        ))}
      </div>

      <h2 className="hoy-subtitulo">
        {dia === hoy ? `Hoy, ${dia.toLowerCase()}` : `El ${dia.toLowerCase()}`}:{' '}
        {abiertos.length ? `${abiertos.length} ${abiertos.length === 1 ? 'dominio' : 'dominios'}` : 'nada pendiente'}
      </h2>

      {abiertos.length ? (
        <div className="dominios">
          {abiertos.map((d) => (
            <TarjetaDominio key={d.clave} dominio={d} />
          ))}
        </div>
      ) : (
        <p className="vacio">
          {dominios.length
            ? 'Ese día no abre ningún dominio con materiales que te falten.'
            : '¡Ya tienes todos los libros de talento y materiales de arma que necesita tu plan!'}
        </p>
      )}

      {otros.length > 0 && (
        <>
          <h2 className="hoy-subtitulo">Otros días</h2>
          <ul className="otros-dominios">
            {otros.map((d) => (
              <li key={d.clave}>
                <div className="otros-dominios-iconos">
                  {d.materiales.map((m) => (
                    <img key={m.id} src={m.icono} alt={m.nombre} title={`${m.nombre}: faltan ${m.faltan}`} className={`material-icono rareza-material-${m.rareza}`} />
                  ))}
                </div>
                <span className="material-nombre">
                  {d.dominio}
                  <small>
                    {d.region} · {d.dias.join(', ')}
                  </small>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

// Una entrada tiene varios niveles con días distintos (p. ej. Mansión Taishan: esfuerzo y oro);
// el domingo se abren todos, así que se muestran en una sola tarjeta
function juntarPorEntrada(dominios) {
  const porEntrada = new Map()
  for (const d of dominios) {
    const previo = porEntrada.get(d.dominio)
    porEntrada.set(d.dominio, previo ? { ...previo, materiales: [...previo.materiales, ...d.materiales] } : d)
  }
  return [...porEntrada.values()]
}

function TarjetaDominio({ dominio }) {
  return (
    <article className="tarjeta-dominio">
      <header>
        <span className="habilidad-tipo">
          {dominio.deTalentos ? 'Libros de talento' : 'Materiales de arma'} · {dominio.region}
        </span>
        <h3>{dominio.dominio}</h3>
      </header>
      <ul className="materiales">
        {dominio.materiales.map((m) => (
          <li key={m.id}>
            <img src={m.icono} alt="" className={`material-icono rareza-material-${m.rareza}`} loading="lazy" />
            <span className="material-nombre">
              {m.nombre}
              <small>Para: {m.para.map((p) => `${p.nombre} (${formatearNumero(p.faltan)})`).join(', ')}</small>
            </span>
            <strong className="material-faltan">faltan {formatearNumero(m.faltan)}</strong>
          </li>
        ))}
      </ul>
    </article>
  )
}
