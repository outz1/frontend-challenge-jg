import type { NftListQuery } from '@/api/contracts'
import { Select, SelectContent, SelectItem, SelectValue, SelectTrigger } from '@/components/ui/select'
import { SORTS } from './sorts'

/** Select de ordenação (Radix), só a partir de `md`: o `Toolbar` carrega este módulo sob demanda. */
export function SortSelect({
  labelId,
  value,
  onChange,
}: {
  labelId: string
  value: NftListQuery['sort']
  onChange: (sort: NftListQuery['sort']) => void
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as NftListQuery['sort'])}>
      <SelectTrigger aria-labelledby={labelId} className="w-[210px] justify-between whitespace-nowrap [&>span:first-child]:text-left">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORTS.map((sort) => (
          <SelectItem key={sort.id} value={sort.id}>
            {sort.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
