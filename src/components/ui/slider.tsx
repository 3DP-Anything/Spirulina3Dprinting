import * as React from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"
import { cn } from "@/lib/utils"

export interface SliderProps extends Omit<React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>, 'onValueChange'> {
  onValueChange?: (value: number[]) => void;
}

export function Slider({
  className,
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  ...props
}: SliderProps) {
  // Base UI Slider Root behaves as a range slider if 'value' is an array.
  // We ensure we always treat it as an array to maintain consistency with the expected callback.
  const valArray = Array.isArray(value) ? value : (value !== undefined ? [value] : undefined);
  const defValArray = Array.isArray(defaultValue) ? defaultValue : (defaultValue !== undefined ? [defaultValue] : undefined);

  // Determine how many thumbs to render
  const thumbs = valArray || defValArray || [min];

  return (
    <SliderPrimitive.Root
      value={valArray}
      defaultValue={defValArray}
      onValueChange={(newValue: number | number[]) => {
        if (onValueChange) {
          onValueChange(Array.isArray(newValue) ? newValue : [newValue]);
        }
      }}
      min={min}
      max={max}
      step={step}
      className={cn("relative flex w-full touch-none items-center select-none py-1.5", className)}
      {...props}
    >
      <SliderPrimitive.Control className="relative flex w-full items-center h-4">
        <SliderPrimitive.Track className="relative h-1 w-full grow rounded-full bg-slate-200 border border-slate-300/30">
          <SliderPrimitive.Indicator className="absolute h-full rounded-full bg-[#6366F1]" />
        </SliderPrimitive.Track>
        {thumbs.map((_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            className="block h-4 w-4 rounded-full border-2 border-[#6366F1] bg-white ring-offset-background transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-lg z-10"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}
