import { useEffect, useState } from 'react'

// Como useState, pero el valor se guarda en el navegador (localStorage)
export function useAlmacenado(clave, valorInicial) {
  const [valor, setValor] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(clave)) ?? valorInicial
    } catch {
      return valorInicial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(clave, JSON.stringify(valor))
    } catch {
      // Sin almacenamiento (modo privado, etc.): el valor solo dura esta sesión
    }
  }, [clave, valor])

  return [valor, setValor]
}
