import axios, { AxiosError } from 'axios'
import { API_BASE, apiErrorSchema, type ApiError } from './contracts'

/** Única porta de saída REST (CLAUDE.md): sessão, erros tipados e cancelamento passam por aqui. */
export const http = axios.create({
  baseURL: API_BASE,
  timeout: 10_000,
  headers: { Accept: 'application/json' },
})

/** Erro de API normalizado: `code` e `message` do envelope, ou `network`/`timeout` sem resposta. */
export class ApiRequestError extends Error {
  readonly status: number | null
  readonly code: ApiError['error']['code'] | 'network' | 'timeout' | 'unknown'
  readonly fieldErrors?: Record<string, string[]>
  readonly details?: Record<string, unknown>
  readonly retryAfterMs?: number

  constructor(init: {
    message: string
    status: number | null
    code: ApiRequestError['code']
    fieldErrors?: Record<string, string[]>
    details?: Record<string, unknown>
    retryAfterMs?: number
  }) {
    super(init.message)
    this.name = 'ApiRequestError'
    this.status = init.status
    this.code = init.code
    this.fieldErrors = init.fieldErrors
    this.details = init.details
    this.retryAfterMs = init.retryAfterMs
  }

  /** Falhas que podem se resolver repetindo (sem resposta, timeout ou 503). */
  get transient() {
    return this.code === 'network' || this.code === 'timeout' || this.code === 'transient_error'
  }
}

export function isCancel(error: unknown) {
  return axios.isCancel(error)
}

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isCancel(error)) return Promise.reject(error)
    if (error instanceof AxiosError) {
      if (!error.response) {
        const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
        return Promise.reject(
          new ApiRequestError({
            status: null,
            code: timedOut ? 'timeout' : 'network',
            message: timedOut ? 'A requisição demorou demais para responder.' : 'Sem conexão com o servidor.',
          }),
        )
      }
      const parsed = apiErrorSchema.safeParse(error.response.data)
      if (parsed.success) {
        const { code, message, fieldErrors, details, retryAfterMs } = parsed.data.error
        return Promise.reject(new ApiRequestError({ status: error.response.status, code, message, fieldErrors, details, retryAfterMs }))
      }
      return Promise.reject(
        new ApiRequestError({ status: error.response.status, code: 'unknown', message: 'Erro inesperado do servidor.' }),
      )
    }
    return Promise.reject(error)
  },
)
