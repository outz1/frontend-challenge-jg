import { useState, type FormEvent } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import searchIcon from '@/assets/icons/search.svg'
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

/** Busca do Header (desktop): grava `q` na URL do Início, onde o catálogo a lê (§3). */
export function SearchDialog() {
  const navigate = useNavigate()
  const current = useSearch({ strict: false }) as { q?: string }
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (next) setText(current.q ?? '')
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = text.trim()
    void navigate({ to: '/', search: { q: q || undefined } })
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger aria-label="Buscar" className="size-5 shrink-0">
        <img src={searchIcon} alt="" className="block size-full" />
      </SheetTrigger>
      <SheetContent className="inset-x-0 top-0 right-0 bottom-auto left-0 mx-auto mt-24 h-auto w-[min(560px,92vw)] gap-4 rounded-[12px] bg-surface-card p-6">
        <SheetTitle className="text-heading font-bold text-text-foreground">Buscar NFTs</SheetTitle>
        <SheetDescription className="text-body text-text-secondary">
          Procure por nome do NFT ou do criador.
        </SheetDescription>
        <form role="search" onSubmit={onSubmit} className="mt-4 flex gap-2">
          <label htmlFor="header-search" className="sr-only">
            Nome do NFT ou do criador
          </label>
          <input
            id="header-search"
            type="search"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={80}
            placeholder="Ex.: Golden, Marina Costa"
            className="h-10 min-w-0 flex-1 rounded-[6px] border border-line-soft bg-surface-dark px-3 text-body text-text-foreground placeholder:text-brand-secondary"
          />
          <button type="submit" className="h-10 rounded-[6px] bg-brand px-4 text-[16px] font-bold text-ink">
            Buscar
          </button>
        </form>
        <SheetClose className="mt-2 w-fit text-[14px] text-text-accent underline underline-offset-4">Cancelar</SheetClose>
      </SheetContent>
    </Sheet>
  )
}
