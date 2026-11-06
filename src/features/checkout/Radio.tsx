import radioOff from '@/assets/icons/pay-radio-off.svg'
import radioOffSoft from '@/assets/icons/pay-radio-off-soft.svg'
import radioOn from '@/assets/icons/pay-radio-on.svg'
import radioOnWide from '@/assets/icons/pay-radio-on-wide.svg'
import toggleOff from '@/assets/icons/pay-toggle-off.svg'

type Tone = 'desktop' | 'mobile' | 'toggle'

/** Indicador visual dos radios do Figma. O controle real (input nativo) fica por cima, oculto, e dá o teclado e a semântica. */
export function RadioMark({ checked, tone }: { checked: boolean; tone: Tone }) {
  if (checked) {
    // No desktop o ícone selecionado vem num quadro de 39x16 (Figma 70504:3184); só o círculo à esquerda aparece.
    if (tone === 'desktop') {
      return (
        <span aria-hidden="true" className="block size-4 shrink-0 overflow-hidden">
          <img src={radioOnWide} alt="" width={39} height={16} className="block max-w-none" />
        </span>
      )
    }
    return <img src={radioOn} alt="" width={16} height={16} aria-hidden="true" className="block shrink-0" />
  }
  if (tone === 'toggle') return <img src={toggleOff} alt="" width={15} height={15} aria-hidden="true" className="block shrink-0" />
  return (
    <img
      src={tone === 'mobile' ? radioOffSoft : radioOff}
      alt=""
      width={16}
      height={16}
      aria-hidden="true"
      className="block shrink-0"
    />
  )
}
