export interface AppSettings {
  enabled: boolean
  auto_start: boolean
  minimize_to_tray: boolean
  scroll_multiplier: number
  send_interval_ms: number
  step_size: number
  max_send_step: number
  step_gain: number
  max_accel: number
  accel_decay_time: number
  horizontal_scroll_key: number
  pulse_enabled: boolean
  pulse_scale: number
  animation_duration_ms: number
  excluded_apps: string
  toggle_key: number
  ignore_raw_input: boolean
  ignore_anticheat: boolean
}
