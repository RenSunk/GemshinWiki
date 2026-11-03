import { enlaceARespaldo } from '../utils/respaldo.js'

// Página que abre un enlace "Copiar enlace": enseña qué trae y solo reemplaza el plan si se confirma
export default function ImportarEnlace({ codigo, planificador }) {
  let respaldo
  let error
  try {
    respaldo = enlaceARespaldo(codigo)
  } catch (e) {
    error = e.message
  }

  const importar = () => {
    planificador.restaurar(respaldo)
    window.location.hash = '#/planificador'
  }

  const yaTienesAlgo = planificador.planes.length > 0 || Object.keys(planificador.inventario).length > 0

  return (
    <section className="importar">
      <h1 className="titulo-pagina">Importar plan</h1>
      {error ? (
        <>
          <p className="respaldo-mensaje error">{error}</p>
          <a href="#/planificador">Ir al planificador</a>
        </>
      ) : (
        <>
          <p>
            Este enlace trae <strong>{respaldo.planes.length}</strong> personajes y armas en el plan y{' '}
            <strong>{Object.keys(respaldo.inventario).length}</strong> materiales en el inventario.
          </p>
          {yaTienesAlgo && (
            <p className="respaldo-mensaje error">
              Ya tienes un plan en este navegador: si importas, se reemplazará por completo.
            </p>
          )}
          <div className="respaldo-botones">
            <button className="boton-principal" onClick={importar}>
              {yaTienesAlgo ? 'Reemplazar mi plan' : 'Importar'}
            </button>
            <a href="#/planificador" className="boton-secundario">
              Cancelar
            </a>
          </div>
        </>
      )}
    </section>
  )
}
