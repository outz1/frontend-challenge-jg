import { Link } from '@tanstack/react-router'
import { useSession } from '@/api/queries/session'
import bg from '@/assets/icons/tab-bg.svg'
import center from '@/assets/icons/tab-center.svg'
import home from '@/assets/icons/tab-home.svg'
import heart from '@/assets/icons/tab-heart.svg'
import shop from '@/assets/icons/tab-shop.svg'
import user from '@/assets/icons/tab-user.svg'
import scan1 from '@/assets/icons/tab-scan-1.svg'
import scan2 from '@/assets/icons/tab-scan-2.svg'
import scan3 from '@/assets/icons/tab-scan-3.svg'
import scan4 from '@/assets/icons/tab-scan-4.svg'
import scan5 from '@/assets/icons/tab-scan-5.svg'

const HIT = 'before:absolute before:-inset-3 before:content-[""]'
const UNAVAILABLE = 'Indisponível nesta demonstração'

/**
 * Barra inferior do mobile (Figma 70395:245). Posições em porcentagem, como no frame.
 * Favoritos e o botão central ficam indisponíveis: favoritos nascem com a sessão e o scan está fora do escopo (§3).
 */
export function TabBar({ cartCount = 0 }: { cartCount?: number }) {
  // Logado, o item de usuário abre o perfil; visitante vai ao login.
  const { user: sessionUser } = useSession()
  return (
    <nav aria-label="Navegação principal" className="fixed inset-x-0 bottom-0 z-30 h-[126px] overflow-hidden md:hidden">
      <div className="pointer-events-none absolute inset-[24.6%_0_0.04%_0]">
        <img src={bg} alt="" className="absolute inset-[-42.13%_-7.25%_-21.06%_-7.25%] block size-auto max-w-none" style={{ width: '114.5%', height: '163.2%' }} />
      </div>
      <img src={center} alt="" className="pointer-events-none absolute top-0 left-1/2 block size-[65px] -translate-x-1/2" />

      <Link to="/" aria-label="Início" aria-current="page" className={`absolute inset-[56.35%_86.47%_27.78%_8.7%] ${HIT}`}>
        <img src={home} alt="" className="absolute inset-[8.33%_10.42%] block size-[83%] max-w-none" />
      </Link>
      <button
        type="button"
        aria-disabled="true"
        aria-label={`Favoritos (${UNAVAILABLE.toLowerCase()})`}
        title={UNAVAILABLE}
        className={`absolute inset-[57.14%_69.08%_28.74%_26.09%] cursor-not-allowed ${HIT}`}
      >
        <img src={heart} alt="" className="absolute inset-0 block size-full max-w-none" />
      </button>
      {/* Glifo de scan nas posições exatas do Figma (15:5529); o botão por cima carrega a semântica. O `inset` fica
          no `span`: num `<img>` absoluto, `size-full` venceria o `right`/`bottom` e esticaria o traço pela barra toda. */}
      <span aria-hidden="true" className="pointer-events-none absolute inset-[25.48%_46.66%_73.1%_46.86%]">
        <img src={scan1} alt="" className="block size-full max-w-none" />
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute inset-[27.53%_50.32%_64.29%_47.18%]">
        <img src={scan2} alt="" className="block size-full max-w-none" />
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute inset-[16.73%_46.98%_75.09%_50.51%]">
        <img src={scan3} alt="" className="block size-full max-w-none" />
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute inset-[27.54%_47%_64.33%_50.51%]">
        <img src={scan4} alt="" className="block size-full max-w-none" />
      </span>
      <span aria-hidden="true" className="pointer-events-none absolute inset-[16.67%_50.31%_75.15%_47.18%]">
        <img src={scan5} alt="" className="block size-full max-w-none" />
      </span>
      <button
        type="button"
        aria-disabled="true"
        aria-label={`Escanear (${UNAVAILABLE.toLowerCase()})`}
        title={UNAVAILABLE}
        className="absolute top-0 left-1/2 size-[65px] -translate-x-1/2 cursor-not-allowed rounded-full"
      />
      <Link
        to="/cart"
        aria-label={`Carrinho, ${cartCount} itens`}
        className={`absolute inset-[56.35%_24.64%_27.78%_70.53%] ${HIT}`}
      >
        <img src={shop} alt="" className="absolute inset-0 block size-full max-w-none" />
      </Link>
      <Link
        to={sessionUser ? '/profile' : '/login'}
        aria-label={sessionUser ? 'Meu perfil' : 'Entrar'}
        className={`absolute inset-[56.35%_9.66%_27.78%_85.51%] ${HIT}`}
      >
        <img src={user} alt="" className="absolute inset-0 block size-full max-w-none" />
      </Link>
    </nav>
  )
}
