import facebook from '@/assets/icons/facebook.svg'
import g1 from '@/assets/icons/g-1.svg'
import g2 from '@/assets/icons/g-2.svg'
import g3 from '@/assets/icons/g-3.svg'
import g4 from '@/assets/icons/g-4.svg'
import g5 from '@/assets/icons/g-5.svg'
import g6 from '@/assets/icons/g-6.svg'
import g7 from '@/assets/icons/g-7.svg'

const BTN =
  'flex h-10 w-full items-center justify-center gap-3 rounded-[5px] border border-line text-[13px] leading-4 font-medium text-text-secondary'

/** Login social (Figma 70504:2994). Fora do escopo (§3): os botões existem mas informam que estão indisponíveis. */
export function SocialBlock({ onUnavailable, gap = 'md:gap-3' }: { onUnavailable: () => void; /** O modal de login usa 12 px entre os botões, o de cadastro 16 px (Figma 70381:247, 70383:248). */ gap?: string }) {
  return (
    <div className="flex flex-col gap-3 md:gap-3 md:pt-6">
      <div className="flex items-center gap-[10px] md:gap-3">
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
        <p className="text-[13px] leading-4 text-text-foreground">Ou continue com</p>
        <span aria-hidden="true" className="h-px flex-1 bg-line" />
      </div>
      <div className={`flex flex-col gap-4 md:px-20 ${gap}`}>
        <button type="button" aria-disabled="true" onClick={onUnavailable} className={BTN}>
          <GoogleMark />
          Continuar com Google
        </button>
        <button type="button" aria-disabled="true" onClick={onUnavailable} className={BTN}>
          <img src={facebook} alt="" width={20} height={20} className="block" />
          Continuar com Facebook
        </button>
      </div>
    </div>
  )

}

/** Marca composta por 7 vetores posicionados como no Figma (70483:242). */
function GoogleMark() {
  const layer = 'absolute block max-w-none size-full'
  return (
    <span aria-hidden="true" className="relative block size-5 overflow-hidden">
      <span className="absolute inset-[57.68%_17.83%_0_7.11%]"><img src={g1} alt="" className={layer} /></span>
      <span className="absolute inset-[71.33%_17.83%_0_50%]"><img src={g2} alt="" className={layer} /></span>
      <span className="absolute inset-[24.69%_75.25%_24.69%_0]"><img src={g3} alt="" className={layer} /></span>
      <span className="absolute inset-[38.28%_0_11.97%_47.07%]"><img src={g4} alt="" className={layer} /></span>
      <span className="absolute inset-[38.28%_0_11.97%_50%]"><img src={g5} alt="" className={layer} /></span>
      <span className="absolute inset-[0_17.01%_57.68%_7.11%]"><img src={g6} alt="" className={layer} /></span>
      <span className="absolute inset-[0_17.01%_70.51%_50%]"><img src={g7} alt="" className={layer} /></span>
    </span>
  )
}
