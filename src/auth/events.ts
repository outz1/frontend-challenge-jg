/**
 * A camada HTTP avisa que a sessão acabou sem conhecer o router: quem monta a aplicação registra o tratamento
 * (limpar cache privado e levar ao login guardando o contexto).
 */
export type SessionLostReason = 'expired' | 'unauthenticated'

let handler: ((reason: SessionLostReason) => void) | null = null

export function onSessionLost(next: (reason: SessionLostReason) => void) {
  handler = next
  return () => {
    if (handler === next) handler = null
  }
}

export function notifySessionLost(reason: SessionLostReason) {
  handler?.(reason)
}
