import { z } from 'zod'
import { isoDateSchema, networkSchema } from './common'

export const walletKindSchema = z.enum(['primary', 'secondary'])

const evmAddress = /^0x[a-fA-F0-9]{40}$/
const solanaAddress = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

export const walletAddressValid = (network: z.infer<typeof networkSchema>, address: string) =>
  network === 'solana' ? solanaAddress.test(address) : evmAddress.test(address)

export const walletSchema = z.object({
  id: z.string(),
  kind: walletKindSchema,
  network: networkSchema,
  address: z.string(),
  label: z.string().nullable(),
  connection: z.object({
    status: z.enum(['connected', 'disconnected']),
    network: networkSchema.nullable(),
    connectedAt: isoDateSchema.nullable(),
  }),
})
export type Wallet = z.infer<typeof walletSchema>

export const createWalletRequestSchema = z
  .object({
    kind: walletKindSchema,
    network: networkSchema,
    address: z.string().trim().min(1, 'Informe o endereço'),
    label: z.string().trim().max(40).optional(),
  })
  .refine((v) => walletAddressValid(v.network, v.address), {
    path: ['address'],
    message: 'Endereço inválido para a rede selecionada',
  })
export type CreateWalletRequest = z.infer<typeof createWalletRequestSchema>

export const updateWalletRequestSchema = z.object({
  network: networkSchema.optional(),
  address: z.string().trim().min(1).optional(),
  label: z.string().trim().max(40).nullable().optional(),
})
export type UpdateWalletRequest = z.infer<typeof updateWalletRequestSchema>

export const walletsResponseSchema = z.object({ items: z.array(walletSchema) })
export type WalletsResponse = z.infer<typeof walletsResponseSchema>

export const connectWalletRequestSchema = z.object({ network: networkSchema })
export type ConnectWalletRequest = z.infer<typeof connectWalletRequestSchema>
