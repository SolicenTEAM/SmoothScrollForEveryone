import { useState } from 'react'
import { Settings, Minus, X, Mouse } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { cn } from '@/lib/utils'

interface HeaderProps {
  view: 'main' | 'settings'
  onViewChange: (view: 'main' | 'settings') => void
}

export function Header({ view, onViewChange }: HeaderProps) {
  const { t } = useTranslation()
  const [gearSpin, setGearSpin] = useState(false)

  const handleMinimize = () => {
    getCurrentWindow().minimize()
  }

  const handleClose = () => {
    getCurrentWindow().close()
  }

  const handleGearClick = () => {
    if (view !== 'settings') {
      setGearSpin(true)
    }
    onViewChange('settings')
  }

  return (
    <header className="h-9 bg-titlebar select-none shrink-0 relative" data-tauri-drag-region>
      <div className="absolute inset-0 flex items-center pointer-events-none">
        <div className="pointer-events-auto ml-1.5 flex items-center gap-0.5">
          <button
            onClick={handleGearClick}
            className={cn(
              "h-7 w-7 flex items-center justify-center rounded-md transition-all duration-200",
              view === 'settings'
                ? "text-foreground bg-secondary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <Settings
              className={cn("h-4 w-4", gearSpin && "gear-click")}
              onAnimationEnd={() => setGearSpin(false)}
            />
          </button>
          <button
            onClick={() => onViewChange('main')}
            className={cn(
              "h-7 w-7 flex items-center justify-center rounded-md transition-all duration-200",
              view === 'main'
                ? "text-foreground bg-secondary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <Mouse className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center self-stretch pointer-events-auto">
          <button
            onClick={handleMinimize}
            className="h-full px-3 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleClose}
            className="h-full px-3 text-muted-foreground hover:text-white hover:bg-red-500 transition-colors duration-150"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-sm font-medium text-foreground/80 tracking-tight">
          {t('app.title')}
        </span>
      </div>
    </header>
  )
}
