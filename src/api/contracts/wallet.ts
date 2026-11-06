import { z } from 'zod'
import { isoDateSchema, networkSchema } from './common'
import { ENS_LABEL } from './profile'

export const walletProviderSchema = z.enum(['walletconnect', 'metamask', 'coinbase'])
export type WalletProvider = z.infer<typeof walletProviderSchema>

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
  /** "Apelido da carteira". */
  label: z.string().nullable(),
  /** Campos do formulário de Carteiras (Figma 9:1670). */
  displayName: z.string(),
  profileName: z.string(),
  email: z.email(),
  /** "Tipo de carteira": aplicativo preferido para conectar. */
  walletType: walletProviderSchema,
  ensName: z.string().nullable(),
  referralCode: z.string().nullable(),
  /** "ENS ou carteira secundária (opcional)": endereço 0x ou nome `.eth`. */
  secondaryAddress: z.string().nullable(),
  connection: z.object({
    status: z.enum(['connected', 'disconnected']),
    network: networkSchema.nullable(),
    provider: walletProviderSchema.nullable(),
    connectedAt: isoDateSchema.nullable(),
  }),
})
export type Wallet = z.infer<typeof walletSchema>

const emptyToNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v)
const ENS_FULL = /^[a-z0-9-]{3,63}\.eth$/i

/** Campos do formulário. Marcados no Figma: nome, apelido, rede, perfil, endereço, tipo e e-mail. ENS e indicação são opcionais (decisão 0007). */
const walletFields = {
  label: z.string().trim().min(2, 'Informe o apelido da carteira').max(40, 'Máximo de 40 caracteres'),
  displayName: z.string().trim().min(2, 'Informe o nome de exibição').max(60, 'Máximo de 60 caracteres'),
  profileName: z.string().trim().min(2, 'Informe o nome do perfil').max(60, 'Máximo de 60 caracteres'),
  email: z.email('E-mail inválido'),
  walletType: walletProviderSchema,
  ensName: z.preprocess(emptyToNull, z.string().trim().regex(ENS_LABEL, 'Use de 3 a 63 letras, números ou -').nullable()),
  referralCode: z.preprocess(emptyToNull, z.string().trim().regex(/^[A-Z0-9-]{4,16}$/i, 'Código inválido (4 a 16 letras, números ou -)').nullable()),
  secondaryAddress: z.preprocess(
    emptyToNull,
    z
      .string()
      .trim()
      .refine((v) => evmAddress.test(v) || ENS_FULL.test(v), 'Informe um endereço 0x ou um nome .eth')
      .nullable(),
  ),
}

const addressRule = (v: { network: z.infer<typeof networkSchema>; address: string }) => walletAddressValid(v.network, v.address)
const addressIssue = { path: ['address'], message: 'Endereço inválido para a rede selecionada' }

export const createWalletRequestSchema = z
  .object({
    kind: walletKindSchema,
    network: networkSchema,
    address: z.string().trim().min(1, 'Informe o endereço'),
    ...walletFields,
  })
  .refine(addressRule, addressIssue)
export type CreateWalletRequest = z.infer<typeof createWalletRequestSchema>

/** "Igual à carteira principal": o servidor copia os dados da principal para a secundária (Figma 9:1866). */
export const copyPrimaryWalletRequestSchema = z.object({ kind: z.literal('secondary'), sameAsPrimary: z.literal(true) })
export type CopyPrimaryWalletRequest = z.infer<typeof copyPrimaryWalletRequestSchema>

export const updateWalletRequestSchema = z
  .object({
    network: networkSchema,
    address: z.string().trim().min(1, 'Informe o endereço'),
    ...walletFields,
  })
  .refine(addressRule, addressIssue)
export type UpdateWalletRequest = z.infer<typeof updateWalletRequestSchema>

export const walletsResponseSchema = z.object({ items: z.array(walletSchema) })
export type WalletsResponse = z.infer<typeof walletsResponseSchema>

export const connectWalletRequestSchema = z.object({ network: networkSchema, provider: walletProviderSchema })
export type ConnectWalletRequest = z.infer<typeof connectWalletRequestSchema>
