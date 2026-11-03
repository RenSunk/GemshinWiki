import materiales from '../data/materiales.json'
import { agruparMateriales, expEnInventario } from '../utils/calculos.js'
import { formatearNumero } from '../utils/constantes.js'

// Si recibe `inventario`, cada material muestra un campo "Tengo" y cuánto falta.
// `cubiertos` (opcional) indica qué parte del inventario le toca a esta lista cuando
// varios planes comparten materiales; sin él se usa el inventario completo.
// `fabricados` (opcional) indica cuántos se cubren fabricándolos con alquimia.
export default function ListaMateriales({
  totales,
  inventario,
  cubiertos,
  fabricados,
  onCambiarInventario,
  ocultarCompletos = false,
}) {
  const conInventario = Boolean(inventario)
  const tengo = (m) => (m.exp ? expEnInventario(m.exp, inventario ?? {}) : (inventario?.[m.id] ?? 0))
  const cubierto = (m) => cubiertos?.get(m.id) ?? tengo(m)

  const grupos = agruparMateriales(totales)
    .map((g) => ({ ...g, items: ocultarCompletos ? g.items.filter((m) => cubierto(m) < m.cantidad) : g.items }))
    .filter((g) => g.items.length)

  if (!grupos.length) {
    return <p className="vacio">{totales.size ? '¡Ya tienes todo lo necesario!' : 'No hace falta ningún material.'}</p>
  }

  const campoTengo = (id, etiqueta = 'Tengo') => (
    <label className="material-tengo">
      <span>{etiqueta}</span>
      <input
        type="number"
        min="0"
        inputMode="numeric"
        value={inventario[id] || ''}
        placeholder="0"
        onChange={(e) => onCambiarInventario(id, Math.max(0, Math.floor(Number(e.target.value) || 0)))}
      />
    </label>
  )

  return (
    <div className="grupos-materiales">
      {grupos.map((grupo) => (
        <section key={grupo.titulo}>
          <h3 className="grupo-titulo">{grupo.titulo}</h3>
          <ul className="materiales">
            {grupo.items.map((m) => {
              const faltan = Math.max(0, m.cantidad - cubierto(m))
              const conAlquimia = fabricados?.get(m.id) ?? 0
              const [idPrincipal, puntosPrincipal] = m.exp?.fuentes[0] ?? []
              return (
                <li
                  key={m.id}
                  className={`${conInventario && faltan === 0 ? 'completo' : ''} ${m.exp && conInventario ? 'material-exp' : ''}`}
                >
                  <img src={m.icono} alt="" className={`material-icono rareza-material-${m.rareza}`} loading="lazy" />
                  <span className="material-nombre">
                    {m.nombre}
                    {m.dias && <small>{m.dias.join(', ')}</small>}
                    {m.exp && (
                      <small>
                        {formatearNumero(m.cantidad)} pts. ≈ {formatearNumero(Math.ceil(m.cantidad / puntosPrincipal))} ×{' '}
                        {materiales[idPrincipal].nombre}
                      </small>
                    )}
                    {conInventario && (
                      <small className="material-faltan">
                        {m.exp ? 'Tienes ' + formatearNumero(tengo(m)) + ' pts.' : 'Necesitas ' + formatearNumero(m.cantidad)} ·{' '}
                        {faltan
                          ? `faltan ${formatearNumero(faltan)}${m.exp ? ` pts. (≈ ${formatearNumero(Math.ceil(faltan / puntosPrincipal))} × ${materiales[idPrincipal].nombre})` : ''}`
                          : '✓ completo'}
                        {conAlquimia > 0 && ` · ${formatearNumero(conAlquimia)} con alquimia`}
                        {faltan > 0 && cubierto(m) < tengo(m) && ' (lo que tienes va a otro con más prioridad)'}
                      </small>
                    )}
                  </span>
                  {!conInventario && <strong>{formatearNumero(m.cantidad)}</strong>}
                  {conInventario && !m.exp && campoTengo(m.id)}
                  {conInventario && m.exp && (
                    <div className="exp-fuentes">
                      {m.exp.fuentes.map(([id, puntos]) => (
                        <div key={id} className="exp-fuente" title={materiales[id].nombre}>
                          <img
                            src={materiales[id].icono}
                            alt=""
                            className={`material-icono rareza-material-${materiales[id].rareza}`}
                          />
                          {campoTengo(id, `${formatearNumero(puntos)} pts.`)}
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
