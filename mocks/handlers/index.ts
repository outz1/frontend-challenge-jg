import type { RequestHandler } from 'msw'
import { nftHandlers } from './nfts'

/** Handlers REST por recurso, a partir dos contratos em src/api/contracts. */
export const handlers: RequestHandler[] = [...nftHandlers]
