use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub enabled: bool,
    pub auto_start: bool,
    pub minimize_to_tray: bool,
    pub scroll_multiplier: f64,
    pub send_interval_ms: u64,
    pub step_size: f64,
    pub max_send_step: f64,
    pub step_gain: f64,
    pub max_accel: f64,
    pub accel_decay_time: f64,
    pub horizontal_scroll_key: i32,
    pub pulse_enabled: bool,
    pub pulse_scale: f64,
    pub animation_duration_ms: u64,
    pub excluded_apps: String,
    pub toggle_key: i32,
    pub ignore_raw_input: bool,
    pub ignore_anticheat: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
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
            excluded_apps: String::new(),
            toggle_key: 0,
            ignore_raw_input: true,
            ignore_anticheat: true,
        }
    }
}
