import { useCallback, useRef, useEffect } from 'react'
import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Slider } from '@/components/ui/slider'
import { NumberInput } from '@/components/NumberInput'
import { cn } from '@/lib/utils'

interface CompactParamProps {
  label: string
  description: string
  value: number
  unit?: string
  inputType: 'slider' | 'input'
  onChange: (value: number) => void
  sliderMin?: number
  sliderMax?: number
  sliderStep?: number
  inputMin?: number
  inputMax?: number
  inputStep?: number
  inline?: boolean
  className?: string
  onScrollStart?: () => void
  onScrollEnd?: () => void
}

export function CompactParam({
  label,
  description,
  value,
  unit,
  inputType,
  onChange,
  sliderMin = 0.1,
  sliderMax = 5.0,
  sliderStep = 0.1,
  inputMin,
  inputMax,
  inputStep = 1,
  inline = false,
  className,
  onScrollStart,
  onScrollEnd,
}: CompactParamProps) {
  const sliderScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (sliderScrollTimer.current) clearTimeout(sliderScrollTimer.current)
    }
  }, [])

  const handleSliderWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onScrollStart?.()
    if (sliderScrollTimer.current) clearTimeout(sliderScrollTimer.current)
    sliderScrollTimer.current = setTimeout(() => {
      onScrollEnd?.()
    }, 400)
    const dir = e.deltaY > 0 ? -1 : 1
    let newVal = value + sliderStep * dir
    newVal = Math.max(sliderMin, Math.min(sliderMax, newVal))
    const rounded = Math.round(newVal / sliderStep) * sliderStep
    onChange(parseFloat(rounded.toFixed(4)))
  }, [value, sliderStep, sliderMin, sliderMax, onChange, onScrollStart, onScrollEnd])
  return (
    <div className={cn("rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden transition-all duration-200", className)}>
      <div className={cn(inline ? "p-3" : "p-3 space-y-2")}>
        {inline ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="inline-flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px]">
                    <p>{description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-sm font-medium text-foreground select-none truncate">
                {label}
              </span>
            </div>

            {inputType === 'slider' ? (
              <div className="flex items-center gap-2 flex-1 max-w-[60%]" onWheel={handleSliderWheel}>
                <Slider
                  className="flex-1"
                  value={[value]}
                  onValueChange={([v]) => onChange(v)}
                  min={sliderMin}
                  max={sliderMax}
                  step={sliderStep}
                />
                <span className="text-sm font-mono text-muted-foreground tabular-nums shrink-0 w-10 text-right">
                  {value.toFixed(1)}
                </span>
              </div>
            ) : (
              <NumberInput
                value={value}
                min={inputMin}
                max={inputMax}
                step={inputStep}
                unit={unit}
                onChange={onChange}
                onScrollStart={onScrollStart}
                onScrollEnd={onScrollEnd}
              />
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 min-w-0">
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="inline-flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none">
                      <Info className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <p>{description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-sm font-medium text-foreground select-none truncate">
                {label}
              </span>
            </div>

            {inputType === 'slider' ? (
              <div className="flex items-center gap-2" onWheel={handleSliderWheel}>
                <Slider
                  className="flex-1"
                  value={[value]}
                  onValueChange={([v]) => onChange(v)}
                  min={sliderMin}
                  max={sliderMax}
                  step={sliderStep}
                />
                <span className="text-sm font-mono text-muted-foreground tabular-nums shrink-0 w-10 text-right">
                  {value.toFixed(1)}
                </span>
              </div>
            ) : (
              <NumberInput
                value={value}
                min={inputMin}
                max={inputMax}
                step={inputStep}
                unit={unit}
                onChange={onChange}
                onScrollStart={onScrollStart}
                onScrollEnd={onScrollEnd}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
