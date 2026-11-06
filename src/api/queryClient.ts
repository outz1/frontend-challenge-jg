import { QueryClient } from '@tanstack/react-query'
import { ApiRequestError, isCancel } from './client'

/**
 * Política de cache e retries (documentada em ARCHITECTURE.md):
 * - dados ficam frescos por 30 s; ao voltar à aba ou reconectar, refaz em segundo plano;
 * - só falhas transitórias (sem resposta, timeout, 503) repetem, no máximo 2 vezes, com backoff exponencial;
 * - 4xx nunca repete: erro de negócio não melhora tentando de novo;
 * - mutations não repetem sozinhas; reenvio seguro depende de chave de idempotência.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: (failureCount, error) =>
          !isCancel(error) && error instanceof ApiRequestError && error.transient && failureCount < 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
      },
      mutations: { retry: false },
    },
  })
}
