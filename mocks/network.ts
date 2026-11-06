import { delay, HttpResponse } from 'msw'
import { errorStatus, type ApiError, type ErrorCode } from '../src/api/contracts'

/**
 * Cenários de rede configuráveis e reproduzíveis (§6).
 * Selecionados por `?scenario=<nome>` (persistido em localStorage) ou `localStorage['kurio:scenario']`.
 */
export const SCENARIOS = [
  'default',
  'slow',
  'empty',
  'error-500',
  'error-503',
  'offline',
  'timeout',
  'session-expired',
  'favorites-error',
] as const
export type Scenario = (typeof SCENARIOS)[number]

export const SCENARIO_KEY = 'kurio:scenario'

export function currentScenario(): Scenario {
  try {
    const stored = localStorage.getItem(SCENARIO_KEY)
    return (SCENARIOS as readonly string[]).includes(stored ?? '') ? (stored as Scenario) : 'default'
  } catch {
    return 'default'
  }
}

export function setScenario(name: string) {
  try {
    if ((SCENARIOS as readonly string[]).includes(name)) localStorage.setItem(SCENARIO_KEY, name)
  } catch {
    // Sem storage (modo privado): o cenário padrão continua valendo.
  }
}

export function errorResponse(code: ErrorCode, message: string, extra?: Partial<ApiError['error']>) {
  const body: ApiError = { error: { code, message, ...extra } }
  return HttpResponse.json(body, { status: errorStatus[code] })
}

/** Hash simples e estável: a mesma URL sempre recebe a mesma latência, mas URLs diferentes variam. */
function hash(text: string) {
  let h = 0
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0
  return Math.abs(h)
}

/**
 * Aplica o cenário ativo antes do handler real. Devolve uma resposta de falha, ou `undefined`
 * para seguir o fluxo normal depois de esperar a latência do cenário.
 */
export async function applyNetwork(request: Request): Promise<Response | undefined> {
  const scenario = currentScenario()
  switch (scenario) {
    case 'slow':
      await delay(3000)
      return undefined
    case 'offline':
      return HttpResponse.error()
    case 'timeout':
      await delay('infinite')
      return undefined
    case 'error-500':
      await delay(300)
      // 500 genérico, fora do envelope tipado: o cliente o trata como erro inesperado.
      return HttpResponse.json({ message: 'Erro interno simulado.' }, { status: 500 })
    case 'error-503':
      await delay(300)
      return errorResponse('transient_error', 'Serviço temporariamente indisponível.', { retryAfterMs: 1000 })
    default:
      // Latência variável (150 a 749 ms) derivada da URL: reproduzível e capaz de inverter a ordem das respostas.
      await delay(150 + (hash(request.url) % 600))
      return undefined
  }
}
