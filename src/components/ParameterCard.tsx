import { Info } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface ParameterCardProps {
  label: string
  description: string
  value: string | number
  unit?: string
  children: React.ReactNode
  className?: string
}

export function ParameterCard({
  label,
  description,
  value,
  unit,
  children,
  className,
}: ParameterCardProps) {
  return (
    <Card className={cn("overflow-hidden transition-all duration-200", className)}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
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
            <span className="text-[15px] font-semibold text-foreground truncate select-none">
              {label}
            </span>
          </div>
          <span className="text-sm font-mono text-muted-foreground tabular-nums shrink-0 ml-3">
            {value}{unit && <span className="text-xs ml-0.5">{unit}</span>}
          </span>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}
