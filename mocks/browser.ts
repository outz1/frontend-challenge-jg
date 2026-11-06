import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { mockControls, socketHandlers } from './socket'
import { resetDb } from './db'
import { setScenario } from './network'
import { resumeSettlements } from './orders'

export const worker = setupWorker(...handlers, ...socketHandlers)

/** Controles do mock para demonstração e testes (`window.__kurioMock`); só existem com os mocks ligados. */
;(window as unknown as { __kurioMock: typeof mockControls }).__kurioMock = mockControls

/** Pedidos pendentes de antes do refresh voltam a andar (vencem na hora ou ganham novo timer). */
resumeSettlements()

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
