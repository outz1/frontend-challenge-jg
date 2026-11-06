import type { Socket } from 'socket.io-client'
import { SOCKET_EVENTS, type ClientToServerEvents, type ServerToClientEvents } from '@/api/contracts'

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>

/** O servidor aceita no máximo 50 recursos por `subscribe` (contrato 0002). */
const CHUNK = 50

let socket: AppSocket | null = null
/** Sobe a cada desconexão: uma abertura que ainda carregava o módulo percebe que foi superada e desiste. */
let generation = 0
/** Quantos componentes pedem cada NFT. A assinatura só sai quando o último desiste. */
const refs = new Map<string, number>()
/** O que o servidor da conexão atual já conhece. Zera a cada (re)conexão: o servidor perde as assinaturas. */
let sent = new Set<string>()

const asResources = (ids: string[]) => ({ resources: ids.map((id) => ({ type: 'nft' as const, id })) })

function flush() {
  if (!socket?.connected) return
  const missing = [...refs.keys()].filter((id) => !sent.has(id))
  for (let i = 0; i < missing.length; i += CHUNK) {
    const chunk = missing.slice(i, i + CHUNK)
    socket.emit(SOCKET_EVENTS.subscribe, asResources(chunk), (res) => {
      if (res?.ok) chunk.forEach((id) => sent.add(id))
    })
  }
}

/**
 * Abre a conexão. `transports: ['websocket']` porque o mock só simula WebSocket (ver mocks/socket).
 * O `token` vai no `auth` do handshake; sem ele, a conexão é de visitante e só recebe eventos públicos de NFT.
 *
 * O `socket.io-client` é carregado com `import()` dinâmico DE PROPÓSITO: o `engine.io-client` guarda o construtor
 * de `WebSocket` quando o módulo é avaliado. Importado de forma estática, ele pegaria o `WebSocket` nativo antes de
 * o MSW iniciar e o mock nunca veria a conexão.
 */
export async function connectSocket(token: string | null): Promise<AppSocket | null> {
  disconnectSocket()
  const mine = generation
  const { io } = await import('socket.io-client')
  if (mine !== generation) return null // logout ou troca de usuário aconteceu durante o carregamento
  const next: AppSocket = io('/', {
    // Path próprio: o MSW não mocka o `/socket.io/` padrão sem capturar também o HMR do Vite (ver mocks/socket).
    path: '/realtime',
    transports: ['websocket'],
    auth: token ? { token } : {},
    reconnectionDelay: 500,
    reconnectionDelayMax: 3000,
  })
  socket = next
  sent = new Set()
  next.on('connect', () => {
    sent = new Set()
    flush()
  })
  return next
}


/** Fim do ciclo de vida (logout, troca de usuário, unmount): solta listeners e fecha a conexão. */
export function disconnectSocket() {
  generation += 1
  if (!socket) return
  socket.removeAllListeners()
  socket.disconnect()
  socket = null
  sent = new Set()
}

/** Assina eventos de NFTs enquanto o chamador estiver montado. Devolve a função que libera. */
export function subscribeNfts(ids: string[]): () => void {
  const unique = [...new Set(ids)]
  for (const id of unique) refs.set(id, (refs.get(id) ?? 0) + 1)
  flush()
  return () => {
    const gone: string[] = []
    for (const id of unique) {
      const left = (refs.get(id) ?? 1) - 1
      if (left <= 0) {
        refs.delete(id)
        sent.delete(id)
        gone.push(id)
      } else refs.set(id, left)
    }
    if (gone.length > 0 && socket?.connected) socket.emit(SOCKET_EVENTS.unsubscribe, asResources(gone), () => {})
  }
}

export function currentSocket() {
  return socket
}
