import type { Network, Wallet, WalletProvider } from '@/api/contracts'

export const NETWORKS: { id: Network; label: string }[] = [
  { id: 'ethereum', label: 'Ethereum' },
  { id: 'polygon', label: 'Polygon' },
  { id: 'solana', label: 'Solana' },
]

export const PROVIDERS: { id: WalletProvider; label: string; initial: string }[] = [
  { id: 'walletconnect', label: 'WalletConnect', initial: 'W' },
  { id: 'metamask', label: 'MetaMask', initial: 'M' },
  { id: 'coinbase', label: 'Coinbase Wallet', initial: '' },
]

export const networkLabel = (network: Network) => NETWORKS.find((n) => n.id === network)?.label ?? network
export const providerLabel = (provider: WalletProvider) => PROVIDERS.find((p) => p.id === provider)?.label ?? provider

/** Legenda de rede dos cartões de carteira (Figma 16:748: "Rede principal Ethereum", "Rede Polygon"). */
export const walletNetworkCaption = (network: Network) => (network === 'ethereum' ? 'Rede principal Ethereum' : `Rede ${networkLabel(network)}`)

export const walletKindLabel = (wallet: Wallet) => wallet.label ?? (wallet.kind === 'primary' ? 'Principal' : 'Secundária')

/** `0xA91F…E82C`: endereço abreviado como no Figma. */
export const shortAddress = (address: string) => (address.length > 14 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address)

/** Único sufixo do seletor "Nome ENS" do layout. */
export const ENS_SUFFIX = '.eth'
