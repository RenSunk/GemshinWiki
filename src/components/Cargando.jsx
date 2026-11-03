// Mensaje mientras se descargan los textos de una página de detalle (o si la descarga falla)
export default function Cargando({ error = false }) {
  return (
    <p className="vacio" role="status">
      {error ? 'No se pudieron cargar los datos. Revisa tu conexión y recarga la página.' : 'Cargando…'}
    </p>
  )
}
