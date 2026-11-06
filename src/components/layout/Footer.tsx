import { useId, useState, type FormEvent } from 'react'
import facebook from '@/assets/icons/social-facebook.svg'
import instagram from '@/assets/icons/social-instagram.svg'
import twitter from '@/assets/icons/social-twitter.svg'
import linkedin from '@/assets/icons/social-linkedin.svg'
import youtube from '@/assets/icons/social-youtube.svg'

const HIGHLIGHTS = [
  { letter: 'W', title: 'Segurança da carteira', text: 'Proteja sua carteira e colecione arte digital verificada com confiança.' },
  { letter: 'C', title: 'Criadores em destaque', text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.' },
  { letter: 'D', title: 'Alertas de lançamentos', text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.' },
]

const LINK_COLUMNS = [
  { title: 'Meu perfil', items: ['Meu perfil', 'Minha coleção', 'Atividade', 'Estúdio do criador', 'Lista de interesse'] },
  { title: 'Central de ajuda', items: ['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item'] },
  { title: 'Coleções', items: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'] },
]

const SOCIALS = [
  { name: 'Facebook', icon: facebook },
  { name: 'Instagram', icon: instagram },
  { name: 'Twitter', icon: twitter },
  { name: 'LinkedIn', icon: linkedin },
  { name: 'YouTube', icon: youtube },
]

const UNAVAILABLE = 'Indisponível nesta demonstração'

export function Footer() {
  return (
    <footer className="mt-16 w-full">
      <div className="bg-surface-card">
        <div className="mx-auto grid w-full max-w-page gap-8 p-8 md:grid-cols-2 min-[1100px]:grid-cols-4 min-[1100px]:gap-0">
          {HIGHLIGHTS.map((item, index) => (
            <section
              key={item.title}
              className={`flex flex-col gap-3 px-4 ${index > 0 ? 'min-[1100px]:border-l min-[1100px]:border-brand' : ''}`}
            >
              <div
                aria-hidden="true"
                className="flex size-[74px] items-center justify-center rounded-full bg-brand text-heading font-bold text-ink"
              >
                {item.letter}
              </div>
              <h2 className="text-[17px] leading-4 font-bold text-text-foreground">{item.title}</h2>
              <p className="max-w-[204px] text-body leading-[22px] text-text-secondary">{item.text}</p>
            </section>
          ))}
          <Newsletter />
        </div>
      </div>

      <div className="bg-surface-dark">
        <div className="mx-auto grid w-full max-w-page items-center gap-4 p-8 md:grid-cols-2 min-[1100px]:min-h-[88px] min-[1100px]:grid-cols-[1fr_1fr_1fr_228px] min-[1100px]:gap-[92px] min-[1100px]:py-0">
          <p className="py-2 text-body font-bold tracking-[0.1em] text-text-foreground">KURIO</p>
          <p className="text-body leading-[22px] text-text-foreground">
            Feito para colecionadores, <span className="block">criadores e cultura</span>
          </p>
          <p className="text-body leading-[22px] text-text-foreground">contato@email.com</p>
          <p className="text-body leading-[22px] text-text-foreground">+55 11 4002 8922</p>
        </div>
      </div>

      <div className="bg-surface-card">
        <div className="mx-auto grid w-full max-w-page gap-8 p-8 sm:grid-cols-2 min-[1100px]:grid-cols-[1fr_1fr_1fr_228px] min-[1100px]:gap-[124px]">
          {LINK_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="flex flex-col gap-2">
              <h2 className="text-[18px] leading-4 font-bold text-text-foreground">{column.title}</h2>
              <ul className="text-body leading-[30px] text-text-foreground">
                {column.items.map((label) => (
                  <li key={label}>{label}</li>
                ))}
              </ul>
            </nav>
          ))}
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-5">
              <h2 className="text-[18px] leading-4 font-bold text-text-foreground">Redes sociais</h2>
              <ul className="flex gap-[10px]">
                {SOCIALS.map((social) => (
                  <li key={social.name}>
                    <button
                      type="button"
                      aria-disabled="true"
                      aria-label={`${social.name} (${UNAVAILABLE.toLowerCase()})`}
                      title={UNAVAILABLE}
                      className="block size-[32px] cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-accent"
                    >
                      <img src={social.icon} alt="" width={32} height={32} className="block" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
            <section className="flex flex-col gap-3">
              <h2 className="text-[18px] leading-4 font-bold text-text-foreground">Carteiras compatíveis</h2>
              <p className="rounded-[6px] border border-line-soft bg-surface-dark px-2 py-2 text-center text-[9px] font-bold tracking-[0.1px] whitespace-pre text-text-accent">
                METAMASK • WALLETCONNECT • COINBASE
              </p>
            </section>
          </div>
        </div>
      </div>

      <p className="bg-ink py-[6px] text-center text-body leading-[30px] text-text-foreground">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}

function Newsletter() {
  const inputId = useId()
  const statusId = useId()
  const [status, setStatus] = useState<string | null>(null)

  // Newsletter está fora do escopo (§3): não aparenta sucesso, só informa a indisponibilidade.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus(`${UNAVAILABLE}: o envio de e-mail não faz parte do escopo.`)
  }

  return (
    <section className="flex flex-col gap-3 px-4 min-[1100px]:border-l min-[1100px]:border-brand">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <label htmlFor={inputId} className="text-[18px] leading-4 font-bold text-text-foreground">
          Antecipe-se ao próximo lançamento
        </label>
        <div className="flex h-10 items-stretch rounded-[6px] bg-surface-dark shadow-[0_0_10px_rgba(10,6,4,0.45)]">
          <input
            id={inputId}
            type="email"
            placeholder="digite seu e-mail..."
            aria-describedby={statusId}
            className="min-w-0 flex-1 rounded-l-[6px] bg-transparent pl-3 text-body text-text-foreground placeholder:text-brand-secondary focus-visible:outline-2 focus-visible:outline-text-accent"
          />
          <button
            type="submit"
            className="w-[85px] rounded-r-[6px] bg-brand pr-1 pl-4 text-[18px] font-bold text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-accent"
          >
            Enviar
          </button>
        </div>
      </form>
      <p id={statusId} role="status" className="text-[13px] leading-[22px] text-text-secondary">
        {status ?? 'Receba lançamentos selecionados, histórias de criadores e novidades do mercado.'}
      </p>
    </section>
  )
}
