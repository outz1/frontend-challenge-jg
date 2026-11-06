import type { RequestHandler } from 'msw'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { favoritesHandlers } from './favorites'
import { nftHandlers } from './nfts'
import { quoteHandlers } from './quotes'

/** Handlers REST por recurso, a partir dos contratos em src/api/contracts. */
export const handlers: RequestHandler[] = [
  ...authHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...quoteHandlers,
  ...nftHandlers,
]
