import star from '@/assets/icons/star.svg'
import starEmpty from '@/assets/icons/star-empty.svg'

/** Cinco estrelas decorativas; o texto acessível traz a nota. A nota é string ("4.8"): arredonda sem float de dinheiro. */
export function Stars({ average }: { average: string }) {
  const filled = Math.min(5, Math.max(0, Math.round(Number(average))))
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <img key={i} src={i < filled ? star : starEmpty} alt="" width={15} height={14} className="block" />
      ))}
    </span>
  )
}
