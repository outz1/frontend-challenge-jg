import * as SelectPrimitive from '@radix-ui/react-select'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import sortArrow from '@/assets/icons/sort-arrow.svg'

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value

export function SelectTrigger({ className, ...props }: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'flex items-center gap-2 text-[15px] leading-[18px] text-text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-text-accent',
        className,
      )}
      {...props}
    >
      {props.children}
      <SelectPrimitive.Icon asChild>
        <img src={sortArrow} alt="" width={11} height={6} className="block" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position="popper"
        align="end"
        sideOffset={8}
        className={cn(
          'z-50 min-w-[220px] rounded-[6px] border border-line-soft bg-surface-card p-1 text-text-foreground shadow-[0_0_10px_rgba(10,6,4,0.45)]',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({ className, children, ...props }: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'flex cursor-pointer items-center justify-between gap-3 rounded-[4px] px-3 py-2 text-[15px] outline-none data-[highlighted]:bg-surface-dark data-[state=checked]:font-bold data-[state=checked]:text-text-accent',
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator aria-hidden="true">✓</SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
}
