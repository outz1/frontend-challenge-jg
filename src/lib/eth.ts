import Big from 'big.js'

/** ETH sempre como string decimal; aqui só se formata, nunca se converte para number (CLAUDE.md). */
export function formatEth(value: string): string {
  const big = new Big(value)
  // Mantém ao menos 2 casas e remove zeros além disso (1.5 vira 1.50; 0.123 segue 0.123).
  const trimmed = big.toFixed().replace(/(\.\d{2}\d*?)0+$/, '$1')
  return /\.\d$/.test(trimmed) ? `${trimmed}0` : trimmed.includes('.') ? trimmed : `${trimmed}.00`
}

export const withEthUnit = (value: string) => `${formatEth(value)} ETH`

/** Texto da faixa de preço da sidebar: o Figma usa vírgula decimal neste rótulo (70485:366). */
export function formatEthRange(min: string, max: string): string {
  const comma = (v: string) => formatEth(v).replace('.', ',')
  return `Preço: ${comma(min)} - ${comma(max)} ETH`
}

/** Valor em ETH (string) para centavos inteiros: o slider trabalha em passos inteiros, sem float. */
export function ethToCents(value: string): number {
  return Number(new Big(value).times(100).round(0, Big.roundDown).toFixed(0))
}

export function centsToEth(cents: number): string {
  return new Big(cents).div(100).toFixed(2)
}
