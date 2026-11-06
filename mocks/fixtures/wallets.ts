import type { Wallet } from '../../src/api/contracts'

const disconnected: Wallet['connection'] = { status: 'disconnected', network: null, provider: null, connectedAt: null }

/** Carteiras iniciais por usuário. Usuários novos começam sem carteira. */
export function buildWalletFixtures(): Record<string, Wallet[]> {
  return {
    'user-ana': [
      {
        id: 'wallet-ana-1',
        kind: 'primary',
        network: 'ethereum',
        address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        label: 'Principal',
        displayName: 'Ana Colecionadora',
        profileName: 'Ana Kurio',
        email: 'ana@kurio.test',
        walletType: 'metamask',
        ensName: 'ana',
        referralCode: null,
        secondaryAddress: null,
        connection: disconnected,
      },
      {
        id: 'wallet-ana-2',
        kind: 'secondary',
        network: 'polygon',
        address: '0x2910543Af39abA0Cd09dBb2D50200b3E800A63D2',
        label: 'Reserva',
        displayName: 'Ana Colecionadora',
        profileName: 'Ana Reserva',
        email: 'ana@kurio.test',
        walletType: 'walletconnect',
        ensName: null,
        referralCode: null,
        secondaryAddress: null,
        connection: disconnected,
      },
    ],
    'user-bruno': [
      {
        id: 'wallet-bruno-1',
        kind: 'primary',
        network: 'solana',
        address: 'DRpbCBMxVnDK7maPM5tGv6MvB3v1sRMC86PZ8okm21hy',
        label: 'Criador',
        displayName: 'Bruno Criador',
        profileName: 'Bruno Kurio',
        email: 'bruno@kurio.test',
        walletType: 'coinbase',
        ensName: null,
        referralCode: null,
        secondaryAddress: null,
        connection: disconnected,
      },
    ],
  }
}
