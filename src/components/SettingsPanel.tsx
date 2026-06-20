import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SettingsPanelProps {
  visible: boolean
  version: string
  minimizeToTray: boolean
  pulseEnabled: boolean
  horizontalScrollKey: number
  excludedApps: string
  toggleKey: number
  ignoreRawInput: boolean
  ignoreAnticheat: boolean
  onMinimizeTrayChange: (v: boolean) => void
  onPulseChange: (v: boolean) => void
  onHorizontalKeyChange: (v: number) => void
  onExcludedAppsChange: (v: string) => void
  onToggleKeyChange: (v: number) => void
  onIgnoreRawInputChange: (v: boolean) => void
  onIgnoreAnticheatChange: (v: boolean) => void
  onReset: () => void
}

function SectionHeader({ label, description }: { label: string; description: string }) {
  return (
    <div className="mb-3">
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
    <div className="rounded-lg bg-card text-card-foreground shadow-sm card-hover">
      <div className="p-5">
        <div className="flex items-center justify-between gap-5">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-foreground select-none">
              {label}
            </div>
            {description && (
              <p className="text-[11px] text-muted-foreground/70 mt-0.5 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

export function SettingsPanel({
  visible,
  version,
  minimizeToTray,
  pulseEnabled,
  horizontalScrollKey,
  excludedApps,
  toggleKey,
  ignoreRawInput,
  ignoreAnticheat,
  onMinimizeTrayChange,
  onPulseChange,
  onHorizontalKeyChange,
  onExcludedAppsChange,
  onToggleKeyChange,
  onIgnoreRawInputChange,
  onIgnoreAnticheatChange,
  onReset,
}: SettingsPanelProps) {
  const { t, i18n } = useTranslation()
  const [langOpen, setLangOpen] = useState(false)
  const [keyOpen, setKeyOpen] = useState(false)
  const [toggleKeyOpen, setToggleKeyOpen] = useState(false)

  const KEY_LABELS: Record<number, string> = {
    0: t('keys.disabled'),
    0x10: t('keys.shift'),
    0x11: t('keys.ctrl'),
    0x12: t('keys.alt'),
  }
  const KEY_OPTIONS: { value: number; label: string }[] = [
    { value: 0, label: t('keys.disabled') },
    { value: 0x10, label: t('keys.shift') },
    { value: 0x11, label: t('keys.ctrl') },
    { value: 0x12, label: t('keys.alt') },
  ]

  const TOGGLE_KEY_LABELS: Record<number, string> = {
    0: t('keys.disabled'),
    0x10: t('keys.shift'),
    0x12: t('keys.alt'),
    0x09: t('keys.tab'),
    0x14: t('keys.capslock'),
    0x24: t('keys.home'),
  }
  const TOGGLE_KEY_OPTIONS: { value: number; label: string }[] = [
    { value: 0, label: t('keys.disabled') },
    { value: 0x10, label: t('keys.shift') },
    { value: 0x12, label: t('keys.alt') },
    { value: 0x09, label: t('keys.tab') },
    { value: 0x14, label: t('keys.capslock') },
    { value: 0x24, label: t('keys.home') },
  ]

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
  }

  return (
    <div className={cn(
      "flex-1 overflow-y-auto transition-all duration-300 ease-out",
      visible ? "opacity-100" : "opacity-0 pointer-events-none"
    )}>
      <div className="p-10 space-y-6">
        {/* About */}
        <div>
          <SectionHeader
            label={t('settings.about')}
            description={t('settings.about_desc')}
          />
          <div className="space-y-2">
            <div className="rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden card-hover">
              <div className="p-5">
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
                      <svg viewBox="40 50 160 200" fill="currentColor" className="h-4 w-4">
                        <path d="M44.3,164.5L76.9,51.6H127l-10.1,35c-0.1,0.2-0.2,0.4-0.3,0.6L90,179.6h24.8c-10.4,25.9-18.5,46.2-24.3,60.9c-45.8-0.5-58.6-33.3-47.4-72.1 M90.7,240.6l60.4-86.9h-25.6l22.3-55.7c38.2,4,56.2,34.1,45.6,70.5c-11.3,39.1-57.1,72.1-101.7,72.1C91.3,240.6,91,240.6,90.7,240.6z"/>
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
            <div className="rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden card-hover">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground select-none">
                    {t('settings.version')}
                  </span>
                  <span className="text-sm font-mono text-muted-foreground tabular-nums">
                    {version ? `v${version}` : ''}
                  </span>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden card-hover">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground select-none">
                    {t('settings.author')}
                  </span>
                  <span className="text-sm text-muted-foreground select-none">
                    Denis Solicen
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

        {/* Engine */}
        <div>
          <SectionHeader
            label={t('settings.engine')}
            description={t('settings.engine_desc')}
          />
          <div className="space-y-2">
            <SettingRow
              label={t('settings.pulse')}
              description={t('settings.pulse_desc')}
            >
              <Switch
                checked={pulseEnabled}
                onCheckedChange={onPulseChange}
              />
            </SettingRow>
            <SettingRow
              label={t('settings.horizontal_scroll')}
              description={t('settings.horizontal_scroll_desc')}
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setKeyOpen(!keyOpen)}
                  className="h-8 w-[120px] rounded-md border border-border/50 bg-secondary/60 hover:bg-secondary/80 px-2.5 text-sm text-foreground outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all duration-150 cursor-pointer flex items-center justify-between gap-1"
                >
                  <span>{KEY_LABELS[horizontalScrollKey] || 'Disabled'}</span>
                  <svg className="h-3.5 w-3.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {keyOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setKeyOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-[120px] rounded-md border border-border/50 bg-card shadow-lg overflow-hidden">
                      {KEY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { onHorizontalKeyChange(opt.value); setKeyOpen(false) }}
                          className={cn(
                            "w-full px-2.5 py-1.5 text-sm text-left transition-colors duration-150",
                            horizontalScrollKey === opt.value
                              ? "bg-accent/10 text-accent"
                              : "text-foreground hover:bg-secondary/80"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </SettingRow>
            <SettingRow
              label={t('settings.toggle_key')}
              description={t('settings.toggle_key_desc')}
            >
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setToggleKeyOpen(!toggleKeyOpen)}
                  className="h-8 w-[120px] rounded-md border border-border/50 bg-secondary/60 hover:bg-secondary/80 px-2.5 text-sm text-foreground outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all duration-150 cursor-pointer flex items-center justify-between gap-1"
                >
                  <span>{TOGGLE_KEY_LABELS[toggleKey] || 'Disabled'}</span>
                  <svg className="h-3.5 w-3.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {toggleKeyOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setToggleKeyOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 w-[120px] rounded-md border border-border/50 bg-card shadow-lg overflow-hidden">
                      {TOGGLE_KEY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { onToggleKeyChange(opt.value); setToggleKeyOpen(false) }}
                          className={cn(
                            "w-full px-2.5 py-1.5 text-sm text-left transition-colors duration-150",
                            toggleKey === opt.value
                              ? "bg-accent/10 text-accent"
                              : "text-foreground hover:bg-secondary/80"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </SettingRow>
            <SettingRow
              label={t('settings.excluded_apps')}
              description={t('settings.excluded_apps_desc')}
            >
              <input
                type="text"
                value={excludedApps}
                onChange={(e) => onExcludedAppsChange(e.target.value)}
                placeholder={t('settings.excluded_apps_placeholder')}
                className="h-8 w-[200px] rounded-md border border-border/50 bg-secondary/60 hover:bg-secondary/80 px-2.5 text-sm text-foreground outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all duration-150"
              />
            </SettingRow>
          </div>
        </div>

        {/* Security */}
        <div>
          <SectionHeader
            label={t('settings.security')}
            description={t('settings.security_desc')}
          />
          <SettingRow
            label={t('settings.ignore_raw_input')}
            description={t('settings.ignore_raw_input_desc')}
          >
            <Switch
              checked={ignoreRawInput}
              onCheckedChange={onIgnoreRawInputChange}
            />
          </SettingRow>
          <SettingRow
            label={t('settings.ignore_anticheat')}
            description={t('settings.ignore_anticheat_desc')}
          >
            <Switch
              checked={ignoreAnticheat}
              onCheckedChange={onIgnoreAnticheatChange}
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
            label={t('settings.language')}
            description=""
          >
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen(!langOpen)}
                className="h-8 w-[120px] rounded-md border border-border/50 bg-secondary/60 hover:bg-secondary/80 px-2.5 text-sm text-foreground outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-all duration-150 cursor-pointer flex items-center justify-between gap-1"
              >
                <span>{i18n.language?.startsWith('ru') ? t('settings.lang_ru') : t('settings.lang_en')}</span>
                <svg className="h-3.5 w-3.5 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {langOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-50 w-[120px] rounded-md border border-border/50 bg-card shadow-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => { changeLanguage('en'); setLangOpen(false) }}
                      className={cn(
                        "w-full px-2.5 py-1.5 text-sm text-left transition-colors duration-150",
                        !i18n.language?.startsWith('ru')
                          ? "bg-accent/10 text-accent"
                          : "text-foreground hover:bg-secondary/80"
                      )}
                    >
                      {t('settings.lang_en')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { changeLanguage('ru'); setLangOpen(false) }}
                      className={cn(
                        "w-full px-2.5 py-1.5 text-sm text-left transition-colors duration-150",
                        i18n.language?.startsWith('ru')
                          ? "bg-accent/10 text-accent"
                          : "text-foreground hover:bg-secondary/80"
                      )}
                    >
                      {t('settings.lang_ru')}
                    </button>
                  </div>
                </>
              )}
            </div>
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
              onClick={onReset}
            >
              {t('settings.reset_button')}
            </Button>
          </SettingRow>
        </div>
      </div>
    </div>
  )
}