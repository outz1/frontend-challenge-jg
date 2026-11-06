import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { setScenario } from './network'

export const worker = setupWorker(...handlers)

/** `?scenario=slow` escolhe o cenário de rede e o mantém em localStorage até outro ser escolhido. */
export function applyScenarioFromUrl() {
  const name = new URLSearchParams(window.location.search).get('scenario')
  if (name) setScenario(name)
}
