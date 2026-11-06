import type { RequestHandler } from 'msw'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { favoritesHandlers } from './favorites'
import { nftHandlers } from './nfts'
import { orderHandlers } from './orders'
import { profileHandlers } from './profile'
import { quoteHandlers } from './quotes'
import { walletHandlers } from './wallets'

/** Handlers REST por recurso, a partir dos contratos em src/api/contracts. */
export const handlers: RequestHandler[] = [
  ...authHandlers,
  ...profileHandlers,
  ...walletHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...quoteHandlers,
  ...orderHandlers,
  ...nftHandlers,
]
