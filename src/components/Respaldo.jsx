import { useRef, useState } from 'react'
import { crearRespaldo, leerRespaldo, respaldoAEnlace } from '../utils/respaldo.js'

// Exportar e importar el plan para pasarlo a otro dispositivo o guardar una copia
export default function Respaldo({ planificador }) {
  const entrada = useRef(null)
  const [mensaje, setMensaje] = useState(null)
  const hayAlgo = planificador.planes.length > 0 || Object.keys(planificador.inventario).length > 0

  const exportarArchivo = () => {
    const contenido = JSON.stringify(crearRespaldo(planificador), null, 2)
    const url = URL.createObjectURL(new Blob([contenido], { type: 'application/json' }))
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `genshin-wiki-plan-${new Date().toISOString().slice(0, 10)}.json`
    enlace.click()
    URL.revokeObjectURL(url)
    setMensaje({ tipo: 'ok', texto: 'Archivo descargado.' })
  }

  const copiarEnlace = async () => {
    const enlace = respaldoAEnlace(crearRespaldo(planificador))
    try {
      await navigator.clipboard.writeText(enlace)
      setMensaje({ tipo: 'ok', texto: 'Enlace copiado. Ábrelo en el otro dispositivo para importar el plan.' })
    } catch {
      // Sin permiso para el portapapeles: se muestra para copiarlo a mano
      window.prompt('Copia este enlace:', enlace)
    }
  }

  const importarArchivo = async (e) => {
    const archivo = e.target.files[0]
    e.target.value = ''
    if (!archivo) return
    try {
      const respaldo = leerRespaldo(JSON.parse(await archivo.text()))
      const confirmado = window.confirm(
        `El archivo tiene ${respaldo.planes.length} en el plan y ${Object.keys(respaldo.inventario).length} materiales ` +
          'en el inventario.\n\nSe reemplazará todo lo que tienes ahora. ¿Continuar?',
      )
      if (!confirmado) return
      planificador.restaurar(respaldo)
      setMensaje({ tipo: 'ok', texto: 'Plan importado.' })
    } catch (error) {
      const texto = error.name === 'ErrorDeRespaldo' ? error.message : 'No se pudo leer el archivo.'
      setMensaje({ tipo: 'error', texto })
    }
  }

  return (
    <section className="respaldo">
      <h2>Copia de seguridad</h2>
      <p className="nota">
        El plan solo se guarda en este navegador. Expórtalo para pasarlo a otro dispositivo o para no perderlo.
      </p>
      <div className="respaldo-botones">
        <button className="boton-secundario" onClick={exportarArchivo} disabled={!hayAlgo}>
          Descargar archivo
        </button>
        <button className="boton-secundario" onClick={copiarEnlace} disabled={!hayAlgo}>
          Copiar enlace
        </button>
        <button className="boton-secundario" onClick={() => entrada.current.click()}>
          Importar archivo
        </button>
        <input ref={entrada} type="file" accept=".json,application/json" hidden onChange={importarArchivo} />
      </div>
      {mensaje && (
        <p className={`respaldo-mensaje ${mensaje.tipo}`} role="status">
          {mensaje.texto}
        </p>
      )}
    </section>
  )
}
