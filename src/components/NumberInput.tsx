import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface NumberInputProps {
  value: number
  min?: number
  max?: number
  step?: number
  unit?: string
  onChange: (value: number) => void
  onScrollStart?: () => void
  onScrollEnd?: () => void
  className?: string
}

export function NumberInput({
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
  onScrollStart,
  onScrollEnd,
  className,
}: NumberInputProps) {
  const [local, setLocal] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)
  const isFocused = useRef(false)
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isFocused.current) setLocal(String(value))
  }, [value])

  useEffect(() => {
    return () => {
      if (scrollTimer.current) clearTimeout(scrollTimer.current)
    }
  }, [])

  const commit = useCallback(() => {
    const parsed = parseFloat(local)
    if (!isNaN(parsed)) {
      let clamped = parsed
      if (min !== undefined) clamped = Math.max(min, clamped)
      if (max !== undefined) clamped = Math.min(max, clamped)
      const rounded = step >= 1 ? Math.round(clamped) : Math.round(clamped / step) * step
      onChange(rounded)
    } else {
      setLocal(String(value))
    }
  }, [local, min, max, step, onChange, value])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onScrollStart?.()
    if (scrollTimer.current) clearTimeout(scrollTimer.current)
    scrollTimer.current = setTimeout(() => {
      onScrollEnd?.()
    }, 400)
    const dir = e.deltaY > 0 ? -1 : 1
    let newVal = value + step * dir
    if (min !== undefined) newVal = Math.max(min, newVal)
    if (max !== undefined) newVal = Math.min(max, newVal)
    const rounded = step >= 1 ? Math.round(newVal) : Math.round(newVal / step) * step
    onChange(rounded)
  }, [value, step, min, max, onChange, onScrollStart, onScrollEnd])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      inputRef.current?.blur()
    }
  }

  return (
    <div className={cn("flex items-center", className)}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onFocus={() => { isFocused.current = true }}
        onBlur={() => { isFocused.current = false; commit() }}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        className="w-20 bg-secondary/60 hover:bg-secondary/80 focus:bg-secondary text-sm font-mono text-foreground tabular-nums text-right outline-none rounded-md px-2.5 py-1.5 border border-border/50 focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all duration-150 cursor-default"
      />
      {unit && <span className="text-xs text-muted-foreground ml-1.5 shrink-0 w-6 select-none">{unit}</span>}
    </div>
  )
}
