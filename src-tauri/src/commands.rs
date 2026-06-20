use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;
use winreg::enums::*;
use winreg::RegKey;

use crate::models::AppSettings;
use crate::smooth_scroll::SmoothScrollEngine;

pub struct SettingsState(pub Mutex<AppSettings>);

fn get_config_path() -> PathBuf {
    let mut path = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("SmoothScrollForEveryone");
    fs::create_dir_all(&path).ok();
    path.push("settings.json");
    path
}

fn load_from_disk() -> AppSettings {
    let path = get_config_path();
    if path.exists() {
        if let Ok(content) = fs::read_to_string(&path) {
            if let Ok(settings) = serde_json::from_str(&content) {
                return settings;
            }
        }
    }
    AppSettings::default()
}

fn save_to_disk(settings: &AppSettings) -> Result<(), String> {
    let path = get_config_path();
    let content = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_settings(state: State<SettingsState>) -> Result<AppSettings, String> {
    let settings = state.0.lock().map_err(|e| e.to_string())?;
    Ok(settings.clone())
}

#[tauri::command]
pub fn update_settings(
    state: State<SettingsState>,
    settings: AppSettings,
) -> Result<(), String> {
    {
        let mut current = state.0.lock().map_err(|e| e.to_string())?;
        *current = settings.clone();
    }
    {
        let current = state.0.lock().map_err(|e| e.to_string())?;
        save_to_disk(&current)?;
        apply_auto_start(current.auto_start)?;
    }
    SmoothScrollEngine::update_settings(settings);
    Ok(())
}

#[tauri::command]
pub fn set_auto_start(enabled: bool) -> Result<(), String> {
    apply_auto_start(enabled)
}

#[tauri::command]
pub fn start_engine() -> Result<(), String> {
    SmoothScrollEngine::start()
}

#[tauri::command]
pub fn stop_engine() -> Result<(), String> {
    SmoothScrollEngine::stop()
}

#[tauri::command]
pub fn engine_status() -> Result<bool, String> {
    Ok(SmoothScrollEngine::is_running())
}

fn apply_auto_start(enabled: bool) -> Result<(), String> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let path = r"Software\Microsoft\Windows\CurrentVersion\Run";
    let key = hkcu.open_subkey_with_flags(path, KEY_SET_VALUE | KEY_QUERY_VALUE)
        .map_err(|e| e.to_string())?;

    let app_name = "SmoothScrollForEveryone";

    if enabled {
        let exe_path = std::env::current_exe()
            .map_err(|e| e.to_string())?
            .to_string_lossy()
            .to_string();
        key.set_value(app_name, &exe_path).map_err(|e| e.to_string())?;
    } else {
        key.delete_value(app_name).ok();
    }
    Ok(())
}

#[tauri::command]
pub fn reset_settings(state: State<SettingsState>) -> Result<(), String> {
    let defaults = AppSettings::default();
    {
        let mut current = state.0.lock().map_err(|e| e.to_string())?;
        *current = defaults.clone();
    }
    save_to_disk(&defaults)?;
    apply_auto_start(defaults.auto_start)?;
    SmoothScrollEngine::update_settings(defaults);
    Ok(())
}

#[tauri::command]
pub fn set_minimize_to_tray(_enabled: bool) -> Result<(), String> {
    Ok(())
}

#[tauri::command]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

pub fn init_settings() -> SettingsState {
    let settings = load_from_disk();
    SmoothScrollEngine::init(settings.clone());
    SettingsState(Mutex::new(settings))
}
