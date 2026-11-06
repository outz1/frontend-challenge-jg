/** Caminhos REST compartilhados entre o cliente Axios e os handlers MSW. */
export const API_BASE = '/api'

export const endpoints = {
  signup: '/auth/signup',
  login: '/auth/login',
  session: '/auth/session',
  logout: '/auth/logout',
  nfts: '/nfts',
  featured: '/nfts/featured',
  nft: (id: string) => `/nfts/${id}`,
  favorites: '/favorites',
  favorite: (nftId: string) => `/favorites/${nftId}`,
  cart: '/cart',
  cartItems: '/cart/items',
  cartItem: (itemId: string) => `/cart/items/${itemId}`,
  cartCoupon: '/cart/coupon',
  quotes: '/quotes',
  orders: '/orders',
  order: (id: string) => `/orders/${id}`,
  profile: '/profile',
  profileAvatar: '/profile/avatar',
  profilePassword: '/profile/password',
  wallets: '/wallets',
  wallet: (id: string) => `/wallets/${id}`,
  walletConnect: (id: string) => `/wallets/${id}/connect`,
  walletDisconnect: (id: string) => `/wallets/${id}/disconnect`,
} as const

/** Padrões `:param` para os handlers MSW. */
export const routePatterns = {
  nft: '/nfts/:id',
  favorite: '/favorites/:nftId',
  cartItem: '/cart/items/:itemId',
  order: '/orders/:id',
  wallet: '/wallets/:id',
  walletConnect: '/wallets/:id/connect',
  walletDisconnect: '/wallets/:id/disconnect',
} as const
