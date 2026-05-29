import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface OffOnToggleProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  id?: string
}

export function OffOnToggle({ checked, onCheckedChange, id }: OffOnToggleProps) {
  const { t } = useTranslation()
  return (
    <button
      id={id}
      type="button"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex items-center rounded-md border border-border overflow-hidden text-xs font-semibold select-none leading-none shrink-0",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      )}
    >
      <span
        className={cn(
          "px-3 py-1.5 transition-colors duration-200",
          !checked
            ? "bg-red-500/15 text-red-400"
            : "text-muted-foreground/60"
        )}
      >
        {t('toggles.off')}
      </span>
      <span className="w-px self-stretch bg-border" />
      <span
        className={cn(
          "px-3 py-1.5 transition-colors duration-200",
          checked
            ? "bg-emerald-500/15 text-emerald-400"
            : "text-muted-foreground/60"
        )}
      >
        {t('toggles.on')}
      </span>
    </button>
  )
}

interface ToggleCardProps {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  warning?: string
  className?: string
}

export function ToggleCard({
  label,
  description,
  checked,
  onCheckedChange,
  warning,
  className,
}: ToggleCardProps) {
  return (
    <div className={cn("rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden transition-all duration-200", className)}>
      <div className="p-4">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-foreground select-none leading-tight inline-flex items-center gap-1.5">
              {warning && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="inline-flex items-center justify-center text-amber-400 hover:text-amber-300 transition-colors duration-150 focus:outline-none shrink-0">
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[280px]">
                      <p>{warning}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {label}
            </span>
            <OffOnToggle
              id={label}
              checked={checked}
              onCheckedChange={onCheckedChange}
            />
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}
