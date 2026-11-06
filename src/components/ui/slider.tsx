import * as SliderPrimitive from '@radix-ui/react-slider'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/** Faixa de preço (Figma 70485:360): trilho de 2px e bolinhas de 15px na cor primária. */
export function Slider({
  className,
  thumbLabels,
  ...props
}: ComponentProps<typeof SliderPrimitive.Root> & { thumbLabels?: string[] }) {
  const thumbs = props.value ?? props.defaultValue ?? [0]
  return (
    <SliderPrimitive.Root
      className={cn('relative flex h-[15px] w-full touch-none items-center select-none', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-0.5 grow rounded-full bg-brand">
        <SliderPrimitive.Range className="absolute h-full bg-brand" />
      </SliderPrimitive.Track>
      {thumbs.map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          aria-label={thumbLabels?.[index]}
          className="block size-[15px] rounded-full border-2 border-text-accent bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-accent"
        />
      ))}
    </SliderPrimitive.Root>
  )
}
