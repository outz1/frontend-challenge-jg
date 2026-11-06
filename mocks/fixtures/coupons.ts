/** Cupons do mock (README): KURIO10 e WELCOME5 valem; EXPIRED20 expirou; qualquer outro é inválido. */
export type CouponRecord = { code: string; percent: string; expired: boolean }

export const COUPONS: CouponRecord[] = [
  { code: 'KURIO10', percent: '10', expired: false },
  { code: 'WELCOME5', percent: '5', expired: false },
  { code: 'EXPIRED20', percent: '20', expired: true },
]

export const findCoupon = (code: string) => COUPONS.find((c) => c.code === code.trim().toUpperCase())
