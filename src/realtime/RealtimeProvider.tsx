import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { SOCKET_EVENTS } from '@/api/contracts'
import { useSession } from '@/api/queries/session'
import { getToken } from '@/auth/token'
import { EventLedger, applyNftUpdated, applyOrderUpdated } from './apply'
import { connectSocket, disconnectSocket, type AppSocket } from './socket'

/**
 * Dono do ciclo de vida do socket: uma conexão por identidade (visitante ou usuário).
 * Ao trocar de usuário ou sair, o efeito fecha a conexão, solta os listeners e abre outra com o novo `auth`,
 * então eventos e assinaturas da sessão anterior não sobrevivem (§3, §7).
 */
export function RealtimeProvider() {
  const queryClient = useQueryClient()
  const { user, isPending } = useSession()
  const userId = user?.id ?? null

  useEffect(() => {
    if (isPending) return
    let cancelled = false
    const ledger = new EventLedger()
    let connectedBefore = false

    function wire(socket: AppSocket) {
      socket.on('connect', () => {
        // Pedidos podem ter terminado enquanto a conexão não existia (primeira conexão ou reconexão).
        void queryClient.invalidateQueries({ queryKey: ['orders'] })
        if (connectedBefore) {
          // Reconexão: refaz por REST o que está na tela e pode ter perdido eventos (§7).
          void queryClient.invalidateQueries({ queryKey: ['nfts'], refetchType: 'active' })
          void queryClient.invalidateQueries({ queryKey: ['cart'] })
          void queryClient.invalidateQueries({ queryKey: ['quote'] })
        }
        connectedBefore = true
      })
      socket.on(SOCKET_EVENTS.nftUpdated, (event) => applyNftUpdated(queryClient, event, ledger))
      socket.on(SOCKET_EVENTS.orderUpdated, (event) => applyOrderUpdated(queryClient, event, ledger, userId))
      // Token recusado pelo servidor: segue sem credencial em vez de insistir; a sessão em si é validada por REST.
      socket.on('connect_error', () => undefined)
    }

    void connectSocket(getToken()).then((socket) => {
      // `null` ou efeito limpo: logout ou troca de usuário aconteceu enquanto o módulo carregava.
      if (!socket || cancelled) return
      wire(socket)
    })

    return () => {
      cancelled = true
      disconnectSocket()
    }
  }, [queryClient, userId, isPending])

  return null
}
