import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  minimizeToTray: boolean
  onMinimizeTrayChange: (v: boolean) => void
  onReset: () => void
}

function SectionHeader({ label, description }: { label: string; description: string }) {
  return (
    <div className="mb-2">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest select-none">
        {label}
      </span>
      <p className="text-[11px] text-muted-foreground/70 mt-0.5 leading-relaxed">
        {description}
      </p>
    </div>
  )
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-foreground select-none">
              {label}
            </div>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5 leading-relaxed">
              {description}
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export function SettingsDialog({
  open,
  onOpenChange,
  minimizeToTray,
  onMinimizeTrayChange,
  onReset,
}: SettingsDialogProps) {
  const { t, i18n } = useTranslation()

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 -mt-1">
          {/* About */}
          <div>
            <SectionHeader
              label={t('settings.about')}
              description={t('settings.about_desc')}
            />
            <div className="space-y-1.5">
              <div className="rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden">
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground select-none">
                      {t('settings.support_me')}
                    </span>
                    <div className="flex items-center gap-1">
                      <a
                        href="https://boosty.to/denissolicen"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm1-13h-2v6l5.25 3.15.75-1.23-4-2.37z"/>
                        </svg>
                      </a>
                      <a
                        href="https://github.com/SolicenTEAM/Smooth-Scroll-For-Everyone"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors duration-150"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden">
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground select-none">
                      {t('settings.version')}
                    </span>
                    <span className="text-sm font-mono text-muted-foreground tabular-nums">
                      v1.0.1
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Startup */}
          <div>
            <SectionHeader
              label={t('settings.startup')}
              description={t('settings.startup_desc')}
            />
            <SettingRow
              label={t('settings.minimize_tray')}
              description={t('settings.minimize_tray_desc')}
            >
              <Switch
                checked={minimizeToTray}
                onCheckedChange={onMinimizeTrayChange}
              />
            </SettingRow>
          </div>

          {/* Appearance */}
          <div>
            <SectionHeader
              label={t('settings.appearance')}
              description={t('settings.appearance_desc')}
            />
            <SettingRow
              label={t('settings.language_desc')}
              description=""
            >
              <select
                value={i18n.language?.startsWith('ru') ? 'ru' : 'en'}
                onChange={(e) => changeLanguage(e.target.value)}
                className="h-8 rounded-md border border-border bg-secondary/40 px-2 text-sm text-foreground outline-none focus:border-accent focus:bg-secondary transition-colors duration-150 cursor-pointer"
              >
                <option value="en">English</option>
                <option value="ru">Русский</option>
              </select>
            </SettingRow>
          </div>

          {/* Reset */}
          <div>
            <SectionHeader
              label={t('settings.reset')}
              description={t('settings.reset_desc')}
            />
            <SettingRow
              label={t('settings.reset_all')}
              description={t('settings.reset_all_desc')}
            >
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onReset()
                  onOpenChange(false)
                }}
              >
                {t('settings.reset_button')}
              </Button>
            </SettingRow>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
