import { toSocketIo } from '@mswjs/socket.io-binding'
import { ws } from 'msw'
import { SOCKET_EVENTS, type NftUpdatedEvent, type OrderUpdatedEvent } from '../../src/api/contracts'
import { db, type OrderRecord } from '../db'
import type { NftRecord } from '../fixtures/nfts'
import { onNftChanged } from '../nftState'
import { onOrderSettled } from '../orders'

/**
 * Transporte de tempo real do mock (§6): `socket.io-client` real, WebSocket interceptado pelo MSW.
 *
 * Limitações conhecidas do `@mswjs/socket.io-binding` 0.2 e como estão cobertas aqui:
 * - handshake fixo (`sid: "test"`) e sempre aceito: o `auth` do cliente é lido do pacote CONNECT cru e,
 *   se o token for inválido, o servidor responde CONNECT_ERROR;
 * - sem acks: `subscribe`/`unsubscribe` respondem o pacote ACK cru (`43<id>[...]`);
 * - sem ping: o servidor manda o ping do Engine.IO (`2`) e o cliente responde pong (`3`);
 * - sem salas nem broadcast: o registro de conexões (`conns`) faz esse papel, por usuário e por NFT;
 * - só o transporte `websocket` (o cliente usa `transports: ["websocket"]`); long-polling não é simulado;
 * - uma única namespace (`/`).
 */
/**
 * Mesma origem da página (`ws://` em dev, `wss://` no deploy), no `path` próprio `/realtime/`.
 * Não dá para usar o `/socket.io/` padrão: o MSW remove esse prefixo ao comparar e o padrão passaria a casar com
 * qualquer WebSocket da origem, inclusive o HMR do Vite, que ficaria mockado.
 */
export const REALTIME_PATH = '/realtime'
const socketLink = ws.link(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}${REALTIME_PATH}/`)

const PING_MS = 20_000

type Conn = {
  id: string
  userId: string | null
  /** NFTs que esta conexão assinou. */
  subs: Set<string>
  io: ReturnType<typeof toSocketIo>
  raw: { send: (data: string) => void; close: (code?: number, reason?: string) => void }
}

const conns = new Set<Conn>()
/** Últimos eventos emitidos, para reenviar duplicata ou estagnado nos cenários de teste. */
const sent: { type: string; payload: NftUpdatedEvent | OrderUpdatedEvent; to: 'nft' | 'user' }[] = []
let offline = false

function userIdFromToken(token: unknown): string | null | 'invalid' {
  if (typeof token !== 'string' || !token) return null // visitante: só recebe eventos públicos de NFT
  const session = db.sessions.find((s) => s.token === token)
  if (!session || session.expired || Date.parse(session.expiresAt) <= Date.now()) return 'invalid'
  return session.userId
}

function nftEvent(nft: NftRecord, version = nft.version): NftUpdatedEvent {
  return {
    // Estável: a reentrega do mesmo evento traz o mesmo id (§7).
    eventId: `evt_nft_${nft.id}_v${version}`,
    type: 'nft.updated',
    resource: { type: 'nft', id: nft.id },
    version,
    occurredAt: new Date().toISOString(),
    data: {
      priceEth: nft.priceEth,
      compareAtEth: nft.compareAtEth,
      soldOut: nft.soldOut,
      editions: nft.editions.map((e) => ({ editionId: e.id, priceEth: e.priceEth, available: e.available })),
    },
  }
}

function orderEvent(order: OrderRecord): OrderUpdatedEvent {
  return {
    eventId: `evt_order_${order.id}_v${order.version}`,
    type: 'order.updated',
    resource: { type: 'order', id: order.id },
    version: order.version,
    occurredAt: new Date().toISOString(),
    userId: order.userId,
    data: {
      status: order.status,
      txHash: order.txHash,
      explorerUrl: order.explorerUrl,
      rejectionReason: order.rejectionReason,
    },
  }
}

function emitNft(event: NftUpdatedEvent) {
  sent.push({ type: event.type, payload: event, to: 'nft' })
  for (const conn of conns) if (conn.subs.has(event.resource.id)) conn.io.client.emit(SOCKET_EVENTS.nftUpdated, event)
}

function emitOrder(event: OrderUpdatedEvent) {
  sent.push({ type: event.type, payload: event, to: 'user' })
  // "Sala" do usuário: pedido só chega às conexões do dono (§7, isolamento).
  for (const conn of conns) if (conn.userId === event.userId) conn.io.client.emit(SOCKET_EVENTS.orderUpdated, event)
}

// REST e eventos leem a mesma fonte: toda mudança em NFT ou pedido vira evento.
onNftChanged((nft) => emitNft(nftEvent(nft)))
onOrderSettled((order) => emitOrder(orderEvent(order)))

/** Pacote EVENT cru do Socket.IO: `42`, id de ack opcional e `[nome, ...args]`. */
const EVENT_PACKET = /^42(\d*)(\[[\s\S]*\])$/

export const socketHandlers = [
  socketLink.addEventListener('connection', (connection) => {
    if (offline) {
      // Recusa como uma falha real de conexão: o Engine.IO só reage a `error` durante o handshake (um `close` sozinho
      // deixa a tentativa presa em "opening" até o timeout de 20 s), então dispara `error` e fecha, logo depois de abrir.
      setTimeout(() => {
        // `socket` existe na implementação do cliente do MSW, mas não na interface pública tipada.
        ;(connection.client as unknown as { socket: EventTarget }).socket.dispatchEvent(new Event('error'))
        connection.client.close(1013, 'offline')
      }, 50)
      return
    }
    const io = toSocketIo(connection)
    const conn: Conn = {
      id: crypto.randomUUID(),
      userId: null,
      subs: new Set(),
      io,
      raw: connection.client,
    }
    conns.add(conn)
    const ping = setInterval(() => connection.client.send('2'), PING_MS)

    connection.client.addEventListener('message', (event) => {
      const data = event.data
      if (typeof data !== 'string') return

      // CONNECT do cliente: `40` + auth JSON.
      if (data.startsWith('40')) {
        let auth: { token?: unknown }
        try {
          auth = data.length > 2 ? JSON.parse(data.slice(2)) : {}
        } catch {
          auth = {}
        }
        const user = userIdFromToken(auth.token)
        if (user === 'invalid') {
          connection.client.send('44' + JSON.stringify({ message: 'unauthenticated' }))
          return
        }
        conn.userId = user
        return
      }

      const match = EVENT_PACKET.exec(data)
      if (!match) return
      const [, ackId, body] = match
      let args: unknown[]
      try {
        args = JSON.parse(body)
      } catch {
        return
      }
      const [name, payload] = args as [string, { resources?: { type: string; id: string }[] }]
      if (name === SOCKET_EVENTS.subscribe || name === SOCKET_EVENTS.unsubscribe) {
        for (const resource of payload?.resources ?? []) {
          if (resource.type !== 'nft') continue
          if (name === SOCKET_EVENTS.subscribe) conn.subs.add(resource.id)
          else conn.subs.delete(resource.id)
        }
        // ACK cru: `43` + id + dados.
        if (ackId) connection.client.send(`43${ackId}${JSON.stringify([{ ok: true }])}`)
      }
    })

    connection.client.addEventListener('close', () => {
      clearInterval(ping)
      conns.delete(conn)
    })
  }),
]

/**
 * Controles do mock para demonstração e testes, expostos em `window.__kurioMock`.
 * Tudo passa pelo servidor simulado e chega ao `socket.io-client` real: nenhum atalho para a UI (§6).
 */
export const mockControls = {
  /** Muda preço e/ou estoque de uma edição. Gera `nft.updated` e aparece no REST. */
  updateNft: async (nftId: string, editionId: string, patch: { priceEth?: string; available?: number | null }) => {
    const { mutateNft } = await import('../nftState')
    return mutateNft(nftId, { [editionId]: patch })?.version ?? null
  },
  /** Reenvia o último evento (mesmo `eventId`): o cliente deve ignorar a duplicata. */
  resendLast: (count = 1) => {
    for (const item of sent.slice(-count)) {
      if (item.type === 'nft.updated') emitNft(item.payload as NftUpdatedEvent)
      else emitOrder(item.payload as OrderUpdatedEvent)
    }
    return sent.length
  },
  /** Emite um `nft.updated` com versão antiga: o cliente não pode regredir o estado. */
  emitStale: (nftId: string) => {
    const nft = db.nfts.find((n) => n.id === nftId)
    if (!nft) return false
    const stale = nftEvent(nft, Math.max(0, nft.version - 1))
    stale.data.priceEth = '99.99'
    emitNft(stale)
    return true
  },
  /** Derruba as conexões (o cliente reconecta e reconcilia por REST). Com `stayDown`, recusa reconexões até `reconnect()`. */
  disconnect: (stayDown = false) => {
    offline = stayDown
    for (const conn of conns) conn.raw.close(1012, 'mock disconnect')
  },
  reconnect: () => {
    offline = false
  },
  connections: () => [...conns].map((c) => ({ userId: c.userId, subs: [...c.subs] })),
}
