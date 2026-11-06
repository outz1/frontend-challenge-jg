import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { resetDb } from './db'
import { setScenario } from './network'

export const worker = setupWorker(...handlers)

/** `?scenario=slow` escolhe o cenário de rede e o mantém em localStorage até outro ser escolhido. */
export function applyScenarioFromUrl() {
  const params = new URLSearchParams(window.location.search)
  // `?reset=1` restaura o cenário conhecido (usuários das fixtures, sem sessões, favoritos nem pedidos).
  if (params.has('reset')) {
    resetDb()
    setScenario('default')
    try {
      localStorage.removeItem('kurio:token')
    } catch {
      // sem storage
    }
  }
  const name = params.get('scenario')
  if (name) setScenario(name)
}
