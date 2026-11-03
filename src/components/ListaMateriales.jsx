import { agruparMateriales } from '../utils/calculos.js'
import { formatearNumero } from '../utils/constantes.js'

// Si recibe `inventario`, cada material muestra un campo "Tengo" y cuánto falta.
// `cubiertos` (opcional) indica qué parte del inventario le toca a esta lista cuando
// varios personajes comparten materiales; sin él se usa el inventario completo.
export default function ListaMateriales({ totales, inventario, cubiertos, onCambiarInventario, ocultarCompletos = false }) {
  const conInventario = Boolean(inventario)
  const tengo = (id) => inventario?.[id] ?? 0
  const cubierto = (id) => cubiertos?.get(id) ?? tengo(id)

  const visibles = ocultarCompletos ? new Map([...totales].filter(([id, cantidad]) => cubierto(id) < cantidad)) : totales
  const grupos = agruparMateriales(visibles)

  if (!grupos.length) {
    return <p className="vacio">{totales.size ? '¡Ya tienes todo lo necesario!' : 'No hace falta ningún material.'}</p>
  }

  return (
    <div className="grupos-materiales">
      {grupos.map((grupo) => (
        <section key={grupo.titulo}>
          <h3 className="grupo-titulo">{grupo.titulo}</h3>
          <ul className="materiales">
            {grupo.items.map((m) => {
              const faltan = Math.max(0, m.cantidad - cubierto(m.id))
              return (
                <li key={m.id} className={conInventario && faltan === 0 ? 'completo' : ''}>
                  <img src={m.icono} alt="" className={`material-icono rareza-material-${m.rareza}`} loading="lazy" />
                  <span className="material-nombre">
                    {m.nombre}
                    {m.dias && <small>{m.dias.join(', ')}</small>}
                    {conInventario && (
                      <small className="material-faltan">
                        Necesitas {formatearNumero(m.cantidad)} ·{' '}
                        {faltan ? `faltan ${formatearNumero(faltan)}` : '✓ completo'}
                        {faltan > 0 && cubierto(m.id) < tengo(m.id) && ' (lo que tienes va a un personaje con más prioridad)'}
                      </small>
                    )}
                  </span>
                  {conInventario ? (
                    <label className="material-tengo">
                      <span>Tengo</span>
                      <input
                        type="number"
                        min="0"
                        inputMode="numeric"
                        value={tengo(m.id) || ''}
                        placeholder="0"
                        onChange={(e) => onCambiarInventario(m.id, Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                      />
                    </label>
                  ) : (
                    <strong>{formatearNumero(m.cantidad)}</strong>
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
