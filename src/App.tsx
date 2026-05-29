import { useState, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { invoke } from '@tauri-apps/api/core'
import { getCurrentWindow, PhysicalSize } from '@tauri-apps/api/window'
import { Header } from '@/components/Header'
import { SettingsPanel } from '@/components/SettingsPanel'
import { ToggleCard } from '@/components/ToggleCard'
import { CompactParam } from '@/components/CompactParam'
import type { AppSettings } from '@/lib/types'

const DEFAULT_SETTINGS: AppSettings = {
  enabled: true,
  auto_start: false,
  minimize_to_tray: false,
  scroll_multiplier: 1.5,
  send_interval_ms: 8,
  step_size: 20.0,
  max_send_step: 120.0,
  step_gain: 40.0,
  max_accel: 2.0,
  accel_decay_time: 150.0,
  horizontal_scroll_key: 0x10,
  pulse_enabled: false,
  pulse_scale: 3.0,
  animation_duration_ms: 200,
  excluded_apps: '',
  toggle_key: 0,
  ignore_raw_input: true,
  ignore_anticheat: true,
}

const SIZE_MAIN = { w: 760, h: 380 }
const SIZE_SETTINGS = { w: 760, h: 600 }

async function animateResize(targetW: number, targetH: number) {
  try {
    const win = getCurrentWindow()
    const size = await win.innerSize()
    const startW = size.width
    const startH = size.height
    if (startW === targetW && startH === targetH) return
    const steps = 12
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const eased = 1 - Math.pow(1 - t, 3)
      const w = Math.round(startW + (targetW - startW) * eased)
      const h = Math.round(startH + (targetH - startH) * eased)
      await win.setSize(new PhysicalSize(w, h))
      await new Promise(r => setTimeout(r, 10))
    }
  } catch {}
}

function App() {
  const { t } = useTranslation()
  const [view, setView] = useState<'main' | 'settings'>('main')
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const initialLoadDone = useRef(false)
  const transitioning = useRef(false)
  const wasEngineRunning = useRef(false)
  const interactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const paramsScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    invoke<AppSettings>('get_settings')
      .then((s) => {
        setSettings(s)
        if (s.enabled) {
          invoke('start_engine').catch(console.warn)
        }
      })
      .catch(() => {})
      .finally(() => { initialLoadDone.current = true })
  }, [])

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!initialLoadDone.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      invoke('update_settings', { settings }).catch(console.warn)
    }, 300)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [settings])

  const updateParam = useCallback(<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    if (key === 'auto_start') {
      invoke('set_auto_start', { enabled: value as boolean }).catch(console.warn)
    }
    if (key === 'minimize_to_tray') {
      invoke('set_minimize_to_tray', { enabled: value as boolean }).catch(console.warn)
    }
  }, [])

  const handleEnabledChange = useCallback((v: boolean) => {
    setSettings(prev => ({ ...prev, enabled: v }))
    if (v) {
      invoke('start_engine').catch(console.warn)
    } else {
      invoke('stop_engine').catch(console.warn)
    }
  }, [])

  const handleReset = useCallback(() => {
    const defaults: AppSettings = { ...DEFAULT_SETTINGS }
    setSettings(defaults)
    invoke('reset_settings').catch(console.warn)
    if (defaults.enabled) {
      invoke('start_engine').catch(console.warn)
    } else {
      invoke('stop_engine').catch(console.warn)
    }
  }, [])

  const handleInputScrollStart = useCallback(() => {
    if (paramsScrollRef.current) {
      paramsScrollRef.current.style.overflow = 'hidden'
    }
    if (settings.enabled) {
      wasEngineRunning.current = true
      invoke('stop_engine').catch(console.warn)
    }
  }, [settings.enabled])

  const handleInputScrollEnd = useCallback(() => {
    if (paramsScrollRef.current) {
      paramsScrollRef.current.style.overflow = ''
    }
    if (wasEngineRunning.current) {
      wasEngineRunning.current = false
      if (interactionTimer.current) clearTimeout(interactionTimer.current)
      interactionTimer.current = setTimeout(() => {
        invoke('start_engine').catch(console.warn)
      }, 250)
    }
  }, [])

  const handleViewChange = useCallback(async (newView: 'main' | 'settings') => {
    if (transitioning.current || newView === view) return
    transitioning.current = true
    const target = newView === 'settings' ? SIZE_SETTINGS : SIZE_MAIN
    await animateResize(target.w, target.h)
    setView(newView)
    transitioning.current = false
  }, [view])

  return (
    <div className="h-screen bg-background flex flex-col" onContextMenu={(e) => e.preventDefault()}>
      <Header view={view} onViewChange={handleViewChange} />

      <main className="flex-1 min-h-0">
        {view === 'main' && (
          <div key="main" className="animate-fadeIn h-full grid grid-cols-2 gap-4 p-10">
            <div className="flex flex-col min-h-0">
              <h2 className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-0.5 pb-1.5 select-none shrink-0">
                {t('sections.params')}
              </h2>
              <div ref={paramsScrollRef} className="space-y-1.5 overflow-y-auto flex-1 min-h-0 pr-1">

              <CompactParam
                label={t('params.scroll_multiplier')}
                description={t('params.scroll_multiplier_desc')}
                value={settings.scroll_multiplier}
                inputType="slider"
                onScrollStart={handleInputScrollStart}
                onScrollEnd={handleInputScrollEnd}
                sliderMin={0.1}
                sliderMax={5.0}
                sliderStep={0.1}
                inline
                onChange={(v) => updateParam('scroll_multiplier', v)}
              />

              <CompactParam
                label={t('params.send_interval_ms')}
                description={t('params.send_interval_desc')}
                value={settings.send_interval_ms}
                unit={t('units.ms')}
                inputType="input"
                inputMin={1}
                inputMax={50}
                inputStep={1}
                inline
                onChange={(v) => updateParam('send_interval_ms', v)}
                onScrollStart={handleInputScrollStart}
                onScrollEnd={handleInputScrollEnd}
              />

              <CompactParam
                label={t('params.step_size')}
                description={t('params.step_size_desc')}
                value={settings.step_size}
                unit={t('units.px')}
                inputType="input"
                inputMin={1}
                inputMax={30}
                inputStep={1}
                inline
                onChange={(v) => updateParam('step_size', v)}
                onScrollStart={handleInputScrollStart}
                onScrollEnd={handleInputScrollEnd}
              />

              <CompactParam
                label={t('params.max_send_step')}
                description={t('params.max_send_step_desc')}
                value={settings.max_send_step}
                unit={t('units.px')}
                inputType="input"
                inputMin={1}
                inputMax={200}
                inputStep={1}
                inline
                onChange={(v) => updateParam('max_send_step', v)}
                onScrollStart={handleInputScrollStart}
                onScrollEnd={handleInputScrollEnd}
              />

              <CompactParam
                label={t('params.step_gain')}
                description={t('params.step_gain_desc')}
                value={settings.step_gain}
                inputType="input"
                inputMin={0.5}
                inputMax={80}
                inputStep={0.5}
                inline
                onChange={(v) => updateParam('step_gain', v)}
                onScrollStart={handleInputScrollStart}
                onScrollEnd={handleInputScrollEnd}
              />

              <CompactParam
                label={t('params.max_accel')}
                description={t('params.max_accel_desc')}
                value={settings.max_accel}
                inputType="input"
                inputMin={1}
                inputMax={10}
                inputStep={0.1}
                inline
                onChange={(v) => updateParam('max_accel', v)}
                onScrollStart={handleInputScrollStart}
                onScrollEnd={handleInputScrollEnd}
              />

              <CompactParam
                label={t('params.accel_decay_time')}
                description={t('params.accel_decay_time_desc')}
                value={settings.accel_decay_time}
                unit={t('units.ms')}
                inputType="input"
                inputMin={10}
                inputMax={1000}
                inputStep={5}
                inline
                onChange={(v) => updateParam('accel_decay_time', v)}
                onScrollStart={handleInputScrollStart}
                onScrollEnd={handleInputScrollEnd}
              />
            </div>
            </div>

            <div className="flex flex-col space-y-1.5">
              <h2 className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest px-0.5 pb-0 select-none">
                {t('sections.controls')}
              </h2>

              <ToggleCard
                label={t('toggles.enable')}
                description={t('toggles.enable_desc')}
                checked={settings.enabled}
                onCheckedChange={handleEnabledChange}
                warning={t('toggles.enable_warning')}
              />

              <ToggleCard
                label={t('toggles.auto_start')}
                description={t('toggles.auto_start_desc')}
                checked={settings.auto_start}
                onCheckedChange={(v) => updateParam('auto_start', v)}
              />

              <div className="flex-1" />
            </div>
          </div>
        )}

        {view === 'settings' && (
          <div key="settings" className="animate-fadeIn h-full flex flex-col">
            <SettingsPanel
              visible={true}
              minimizeToTray={settings.minimize_to_tray}
              pulseEnabled={settings.pulse_enabled}
              horizontalScrollKey={settings.horizontal_scroll_key}
              excludedApps={settings.excluded_apps}
              toggleKey={settings.toggle_key}
              ignoreRawInput={settings.ignore_raw_input}
              ignoreAnticheat={settings.ignore_anticheat}
              onMinimizeTrayChange={(v) => updateParam('minimize_to_tray', v)}
              onPulseChange={(v) => updateParam('pulse_enabled', v)}
              onHorizontalKeyChange={(v) => updateParam('horizontal_scroll_key', v)}
              onExcludedAppsChange={(v) => updateParam('excluded_apps', v)}
              onToggleKeyChange={(v) => updateParam('toggle_key', v)}
              onIgnoreRawInputChange={(v) => updateParam('ignore_raw_input', v)}
              onIgnoreAnticheatChange={(v) => updateParam('ignore_anticheat', v)}
              onReset={handleReset}
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
