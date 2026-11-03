import { useMemo, useState } from 'react'
import { NIVELES, NOMBRES_TALENTOS, calcularPlan, repartirInventario, sumarTotales } from '../utils/calculos.js'
import ListaMateriales from './ListaMateriales.jsx'

const NIVELES_TALENTO = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const VISTAS = { personaje: 'Por personaje', total: 'Todo junto' }

export default function Planificador({ personajes, planificador, slugInicial = null }) {
  const { agregar, quitar, actualizar, mover, inventario, cambiarInventario, vaciarInventario } = planificador
  const [seleccion, setSeleccion] = useState('')
  const [abierto, setAbierto] = useState(slugInicial)
  const [vista, setVista] = useState('personaje')
  const [ocultarCompletos, setOcultarCompletos] = useState(false)

  const porSlug = useMemo(() => new Map(personajes.map((p) => [p.slug, p])), [personajes])
  // Ignora personajes guardados que ya no existan en los datos
  const planes = planificador.planes.filter((plan) => porSlug.has(plan.slug))
  const disponibles = personajes.filter((p) => !planes.some((plan) => plan.slug === p.slug))

  const necesidades = planes.map((plan) => calcularPlan(porSlug.get(plan.slug), plan))
  const cubiertos = repartirInventario(necesidades, inventario)

  // Si no hay ninguno abierto (o se quitó), se muestra el último añadido
  const indiceAbierto = planes.some((p) => p.slug === abierto)
    ? planes.findIndex((p) => p.slug === abierto)
    : planes.length - 1
  const planAbierto = planes[indiceAbierto]

  const alAgregar = (e) => {
    e.preventDefault()
    if (seleccion) {
      agregar(seleccion)
      setAbierto(seleccion)
      setVista('personaje')
    }
    setSeleccion('')
  }

  const alVaciar = () => {
    if (window.confirm('¿Borrar todas las cantidades de tu inventario?')) vaciarInventario()
  }

  const propsLista = { inventario, onCambiarInventario: cambiarInventario, ocultarCompletos }

  return (
    <section className="planificador">
      <h1 className="titulo-pagina">Planificador de materiales</h1>
      <p className="nota">
        Elige el nivel actual y el objetivo de cada personaje y sus talentos, y escribe en «Tengo» cuánto tienes de
        cada material. El plan se guarda en este navegador.
      </p>

      <form className="agregar-personaje" onSubmit={alAgregar}>
        <select value={seleccion} onChange={(e) => setSeleccion(e.target.value)}>
          <option value="">Elige un personaje…</option>
          {disponibles.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.nombre}
            </option>
          ))}
        </select>
        <button type="submit" className="boton-principal" disabled={!seleccion}>
          Añadir
        </button>
      </form>

      {planes.length === 0 ? (
        <p className="vacio">
          Todavía no hay personajes en el plan. Añade uno arriba o desde su página en la <a href="#/">galería</a>.
        </p>
      ) : (
        <>
          <div className="barra-planificador">
            <div className="pestanas-vista" role="tablist">
              {Object.entries(VISTAS).map(([clave, nombre]) => (
                <button
                  key={clave}
                  role="tab"
                  aria-selected={vista === clave}
                  className={vista === clave ? 'activa' : ''}
                  onClick={() => setVista(clave)}
                >
                  {nombre}
                </button>
              ))}
            </div>
            <label>
              <input type="checkbox" checked={ocultarCompletos} onChange={(e) => setOcultarCompletos(e.target.checked)} />
              Ocultar completos
            </label>
            <button className="boton-enlace" onClick={alVaciar} disabled={!Object.keys(inventario).length}>
              Vaciar inventario
            </button>
          </div>

          {vista === 'personaje' ? (
            <>
              <div className="selector-plan" role="tablist" aria-label="Personajes del plan">
                {planes.map((plan, i) => {
                  const personaje = porSlug.get(plan.slug)
                  const { porcentaje } = contarProgreso(necesidades[i], cubiertos[i])
                  return (
                    <button
                      key={plan.slug}
                      role="tab"
                      aria-selected={i === indiceAbierto}
                      className={`chip-plan ${i === indiceAbierto ? 'abierto' : ''}`}
                      onClick={() => setAbierto(plan.slug)}
                    >
                      <span className="chip-plan-orden">{i + 1}</span>
                      <img src={personaje.icono} alt="" className={`rareza-${personaje.rareza}`} />
                      <span className="chip-plan-nombre">{personaje.nombre}</span>
                      <span className="progreso progreso-mini">
                        <span style={{ width: `${porcentaje}%` }} />
                      </span>
                    </button>
                  )
                })}
              </div>
              {planes.length > 1 && (
                <p className="nota">
                  «Tengo» es tu inventario total. Si varios personajes usan el mismo material, se reparte en el orden
                  de la lista (el número de cada uno): usa ← → en su panel para cambiar quién va primero.
                </p>
              )}
              <TarjetaPlan
                key={planAbierto.slug}
                personaje={porSlug.get(planAbierto.slug)}
                plan={planAbierto}
                posicion={indiceAbierto + 1}
                total={planes.length}
                onCambiar={(cambios) => actualizar(planAbierto.slug, cambios)}
                onQuitar={() => quitar(planAbierto.slug)}
                onMover={(direccion) => mover(planAbierto.slug, direccion)}
              >
                <Progreso necesita={necesidades[indiceAbierto]} cubiertos={cubiertos[indiceAbierto]} />
                <ListaMateriales
                  totales={necesidades[indiceAbierto]}
                  cubiertos={cubiertos[indiceAbierto]}
                  {...propsLista}
                />
              </TarjetaPlan>
            </>
          ) : (
            <div className="tarjeta-plan">
              <p className="nota">Suma de los materiales de todos los personajes del plan.</p>
              <TodoJunto necesidades={necesidades} propsLista={propsLista} />
            </div>
          )}
        </>
      )}
    </section>
  )
}

function TodoJunto({ necesidades, propsLista }) {
  const totales = sumarTotales(necesidades)
  return (
    <>
      <Progreso necesita={totales} cubiertos={repartirInventario([totales], propsLista.inventario)[0]} />
      <ListaMateriales totales={totales} {...propsLista} />
    </>
  )
}

function contarProgreso(necesita, cubiertos) {
  const completos = [...necesita].filter(([id, cantidad]) => cubiertos.get(id) >= cantidad).length
  const porcentaje = necesita.size ? Math.round((completos / necesita.size) * 100) : 100
  return { completos, porcentaje }
}

function Progreso({ necesita, cubiertos }) {
  const { completos, porcentaje } = contarProgreso(necesita, cubiertos)

  return (
    <div className="progreso-bloque">
      <span>
        {completos} de {necesita.size} materiales completos
      </span>
      <div className="progreso" role="progressbar" aria-valuenow={porcentaje} aria-valuemin="0" aria-valuemax="100">
        <div style={{ width: `${porcentaje}%` }} />
      </div>
    </div>
  )
}

function TarjetaPlan({ personaje, plan, posicion, total, onCambiar, onQuitar, onMover, children }) {
  const sinTalentos = personaje.costesTalento.length === 0

  // Si el actual supera al objetivo, el objetivo sube con él (y al revés)
  const cambiarNivel = (campo, valor) => {
    const cambios = { [campo]: valor }
    if (campo === 'nivelActual' && valor > plan.nivelObjetivo) cambios.nivelObjetivo = valor
    if (campo === 'nivelObjetivo' && valor < plan.nivelActual) cambios.nivelActual = valor
    onCambiar(cambios)
  }

  const cambiarTalento = (indice, posicion, valor) => {
    const talentos = plan.talentos.map((t) => [...t])
    talentos[indice][posicion] = valor
    if (talentos[indice][0] > talentos[indice][1]) talentos[indice][1 - posicion] = valor
    onCambiar({ talentos })
  }

  return (
    <article className="tarjeta-plan">
      <header>
        <img src={personaje.icono} alt="" className={`rareza-${personaje.rareza}`} />
        <a href={`#/personaje/${personaje.slug}`}>{personaje.nombre}</a>
        {total > 1 && (
          <>
            <span className="prioridad">
              Prioridad {posicion} de {total}
            </span>
            <button className="boton-icono" onClick={() => onMover(-1)} disabled={posicion === 1} aria-label="Subir prioridad">
              ←
            </button>
            <button className="boton-icono" onClick={() => onMover(1)} disabled={posicion === total} aria-label="Bajar prioridad">
              →
            </button>
          </>
        )}
        <button
          className="boton-icono boton-quitar"
          onClick={onQuitar}
          aria-label={`Quitar a ${personaje.nombre}`}
        >
          ✕
        </button>
      </header>

      <div className="tarjeta-plan-cuerpo">
        <div className="tarjeta-plan-niveles">
          <div className="fila-plan">
            <span>Nivel</span>
            <Rango
              opciones={NIVELES.map((n, i) => [i, n.etiqueta])}
              desde={plan.nivelActual}
              hasta={plan.nivelObjetivo}
              onDesde={(v) => cambiarNivel('nivelActual', v)}
              onHasta={(v) => cambiarNivel('nivelObjetivo', v)}
            />
          </div>

          {sinTalentos ? (
            <p className="nota">Los talentos de este personaje no están disponibles en los datos.</p>
          ) : (
            NOMBRES_TALENTOS.map((nombre, i) => (
              <div className="fila-plan" key={nombre}>
                <span>{nombre}</span>
                <Rango
                  opciones={NIVELES_TALENTO.map((n) => [n, n])}
                  desde={plan.talentos[i][0]}
                  hasta={plan.talentos[i][1]}
                  onDesde={(v) => cambiarTalento(i, 0, v)}
                  onHasta={(v) => cambiarTalento(i, 1, v)}
                />
              </div>
            ))
          )}
        </div>

        <div className="tarjeta-plan-materiales">{children}</div>
      </div>
    </article>
  )
}

function Rango({ opciones, desde, hasta, onDesde, onHasta }) {
  const select = (valor, alCambiar) => (
    <select value={valor} onChange={(e) => alCambiar(Number(e.target.value))}>
      {opciones.map(([v, etiqueta]) => (
        <option key={v} value={v}>
          {etiqueta}
        </option>
      ))}
    </select>
  )
  return (
    <div className="rango">
      {select(desde, onDesde)}
      <span>→</span>
      {select(hasta, onHasta)}
    </div>
  )
}
