use std::sync::atomic::{AtomicBool, AtomicPtr, Ordering};
use std::sync::{Arc, Mutex, OnceLock};
use std::thread::{self, JoinHandle};

use windows::core::w;
use windows::Win32::Foundation::*;
use windows::Win32::Graphics::Gdi::HBRUSH;
use windows::Win32::Media::*;
use windows::Win32::System::LibraryLoader::GetModuleHandleW;
use windows::Win32::System::Diagnostics::ToolHelp::*;
use windows::Win32::System::Performance::*;
use windows::Win32::UI::Input::*;
use windows::Win32::UI::Input::KeyboardAndMouse::*;
use windows::Win32::UI::WindowsAndMessaging::*;

use crate::models::AppSettings;

const PULSE_NORMALIZE: f64 = 0.4878;
const PROCESS_QUERY_LIMITED_INFORMATION: u32 = 0x1000;

#[link(name = "kernel32")]
extern "system" {
    fn QueryFullProcessImageNameW(hProcess: *mut std::ffi::c_void, dwFlags: u32, lpExeName: *mut u16, lpdwSize: *mut u32) -> i32;
    fn OpenProcess(dwDesiredAccess: u32, bInheritHandle: i32, dwProcessId: u32) -> *mut std::ffi::c_void;
}

static G_RUNNING: AtomicBool = AtomicBool::new(false);
static G_HOOK_HANDLE: AtomicPtr<std::ffi::c_void> = AtomicPtr::new(std::ptr::null_mut());
static G_MESSAGE_WINDOW: AtomicPtr<std::ffi::c_void> = AtomicPtr::new(std::ptr::null_mut());
static G_PENDING_V: OnceLock<Mutex<f64>> = OnceLock::new();
static G_PENDING_H: OnceLock<Mutex<f64>> = OnceLock::new();
static G_LAST_EVENT_TIME: OnceLock<Mutex<f64>> = OnceLock::new();
static G_SETTINGS: OnceLock<Mutex<AppSettings>> = OnceLock::new();

struct EngineState {
    hook_thread: Option<JoinHandle<()>>,
    send_thread: Option<JoinHandle<()>>,
    send_stop: Arc<AtomicBool>,
}

static G_ENGINE: OnceLock<Mutex<EngineState>> = OnceLock::new();

thread_local! {
    static LAST_SCROLL_TIME: std::cell::Cell<f64> = const { std::cell::Cell::new(0.0) };
    static PATH_BUF: std::cell::UnsafeCell<[u16; 260]> = const { std::cell::UnsafeCell::new([0u16; 260]) };
}

fn get_time_ms() -> f64 {
    unsafe {
        let mut freq: i64 = 0;
        let mut count: i64 = 0;
        QueryPerformanceFrequency(&mut freq).ok();
        QueryPerformanceCounter(&mut count).ok();
        count as f64 * 1000.0 / freq as f64
    }
}

fn read_mouse_flags_and_data(l_param: LPARAM) -> (u32, i32) {
    unsafe {
        let p = &*(l_param.0 as *const MSLLHOOKSTRUCT);
        (p.flags, (p.mouseData >> 16) as i16 as i32)
    }
}

fn is_foreground_app_excluded(excluded: &str, buf: &mut [u16; 260]) -> bool {
    if excluded.trim().is_empty() {
        return false;
    }
    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.is_invalid() {
            return false;
        }
        let mut pid: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut pid));
        if pid == 0 {
            return false;
        }
        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
        if handle.is_null() {
            return false;
        }
        let mut size = buf.len() as u32;
        let ok = QueryFullProcessImageNameW(handle, 0, buf.as_mut_ptr(), &mut size);
        let _ = CloseHandle(HANDLE(handle));
        if ok == 0 {
            return false;
        }
        let path = String::from_utf16_lossy(&buf[..size as usize]);
        let exe_name = path.rsplit('\\').next().unwrap_or("").to_lowercase();
        let exe_stripped = exe_name.strip_suffix(".exe").unwrap_or(&exe_name).to_string();
        for app in excluded.split(',') {
            let trimmed = app.trim().to_lowercase();
            if !trimmed.is_empty() && (exe_name == trimmed || exe_stripped == trimmed) {
                return true;
            }
        }
    }
    false
}

fn foreground_uses_raw_input() -> bool {
    unsafe {
        let mut count: u32 = 0;
        let cb = std::mem::size_of::<RAWINPUTDEVICE>() as u32;
        let _ = GetRegisteredRawInputDevices(None, &mut count as *mut u32, cb);
        if count == 0 {
            return false;
        }
        let mut devices = vec![RAWINPUTDEVICE::default(); count as usize];
        let written = GetRegisteredRawInputDevices(
            Some(devices.as_mut_ptr()),
            &mut count as *mut u32,
            cb,
        );
        if written == 0 || written == u32::MAX {
            return false;
        }
        let actual = written.min(count) as usize;
        for dev in &devices[..actual] {
            if dev.usUsagePage == 1 && dev.usUsage == 2 && dev.hwndTarget.is_invalid() {
                return true;
            }
        }
    }
    false
}

const ANTICHEAT_DLLS: [&str; 20] = [
    "easyanticheat_x64.dll", "easyanticheat_x86.dll",
    "beclient_x64.dll", "beclient.dll", "beclient_x86.dll",
    "ace-base64.dll", "ace-gdp.dll", "ace-service.dll",
    "x3.xem", "x2.xem",
    "pbcl.dll", "pbag.dll", "pbsvc.dll",
    "fbanticheat.dll",
    "ricochet.dll",
    "taslogin.dll", "tencentanticheat.dll",
    "faceitclient.dll",
    "esea.dll",
    "blackcipher.dll",
];

fn process_has_anticheat(pid: u32) -> bool {
    unsafe {
        let snapshot = match CreateToolhelp32Snapshot(TH32CS_SNAPMODULE, pid) {
            Ok(h) => h,
            Err(_) => return false,
        };

        let mut me = MODULEENTRY32W::default();
        me.dwSize = std::mem::size_of::<MODULEENTRY32W>() as u32;

        if Module32FirstW(snapshot, &mut me).is_ok() {
            loop {
                let name = String::from_utf16_lossy(&me.szModule).to_lowercase();
                let name = name.trim_end_matches('\0');
                if ANTICHEAT_DLLS.contains(&name) {
                    let _ = CloseHandle(snapshot);
                    return true;
                }
                if Module32NextW(snapshot, &mut me).is_err() {
                    break;
                }
            }
        }

        let _ = CloseHandle(snapshot);
        false
    }
}

fn pulse(x: f64) -> f64 {
    let x = x * 3.0;
    if x < 1.0 {
        (x - (1.0 - (-x).exp())) * PULSE_NORMALIZE
    } else {
        let start = (-1.0_f64).exp();
        (start + ((1.0 - (-x + 1.0).exp()) * (1.0 - start))) * PULSE_NORMALIZE
    }
}

fn accumulate_delta(pending: &Mutex<f64>, delta: i32, settings: &Mutex<AppSettings>, last_event: &Mutex<f64>) {
    let (multiplier, max_accel, decay_time) = {
        let s = settings.lock().unwrap();
        (s.scroll_multiplier, s.max_accel, s.accel_decay_time)
    };

    let now = get_time_ms();
    let dt = LAST_SCROLL_TIME.with(|cell| {
        let last = cell.get();
        if last == 0.0 { 1000.0 } else { now - last }
    });
    LAST_SCROLL_TIME.with(|cell| cell.set(now));

    let accel = 1.0 + (max_accel - 1.0) * (-dt / decay_time).exp();
    let scaled = delta as f64 * multiplier * accel;

    let mut p = pending.lock().unwrap();
    let was_empty = p.abs() < 0.01;
    *p += scaled;

    if was_empty {
        let mut le = last_event.lock().unwrap();
        *le = now;
    }
}

unsafe extern "system" fn low_level_mouse_proc(
    n_code: i32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    let hook = HHOOK(G_HOOK_HANDLE.load(Ordering::Relaxed));

    if n_code < 0 {
        return CallNextHookEx(Some(hook), n_code, w_param, l_param);
    }

    if w_param.0 == WM_MOUSEWHEEL as usize {
        let (_flags, delta) = read_mouse_flags_and_data(l_param);
        if delta.abs() < WHEEL_DELTA as i32 {
            return CallNextHookEx(Some(hook), n_code, w_param, l_param);
        }

        let settings = match G_SETTINGS.get() {
            Some(s) => s,
            None => return CallNextHookEx(Some(hook), n_code, w_param, l_param),
        };

        let (hotkey, toggle_key, ignore_raw, ignore_ac) = {
            let s = settings.lock().unwrap();
            (s.horizontal_scroll_key, s.toggle_key, s.ignore_raw_input, s.ignore_anticheat)
        };

        if toggle_key != 0 && (GetAsyncKeyState(toggle_key) as i32) & 0x8000 != 0 {
            return CallNextHookEx(Some(hook), n_code, w_param, l_param);
        }

        let is_excluded = {
            let s = settings.lock().unwrap();
            let excluded = s.excluded_apps.clone();
            if excluded.is_empty() {
                false
            } else {
                PATH_BUF.with(|buf| {
                    let buf = unsafe { &mut *buf.get() };
                    is_foreground_app_excluded(&excluded, buf)
                })
            }
        };
        if is_excluded {
            return CallNextHookEx(Some(hook), n_code, w_param, l_param);
        }

        if ignore_raw && foreground_uses_raw_input() {
            return CallNextHookEx(Some(hook), n_code, w_param, l_param);
        }

        if ignore_ac {
            let ac_pid = {
                let hwnd_ac = GetForegroundWindow();
                if hwnd_ac.is_invalid() {
                    0
                } else {
                    let mut pid_ac: u32 = 0;
                    GetWindowThreadProcessId(hwnd_ac, Some(&mut pid_ac));
                    pid_ac
                }
            };
            if ac_pid != 0 && process_has_anticheat(ac_pid) {
                return CallNextHookEx(Some(hook), n_code, w_param, l_param);
            }
        }

        let is_horizontal = if hotkey != 0 {
            (GetAsyncKeyState(hotkey) as i32) & 0x8000 != 0
        } else {
            false
        };

        if is_horizontal {
            if let Some(p) = G_PENDING_H.get() {
                if let Some(le) = G_LAST_EVENT_TIME.get() {
                    accumulate_delta(p, delta, settings, le);
                }
            }
        } else {
            if let Some(p) = G_PENDING_V.get() {
                if let Some(le) = G_LAST_EVENT_TIME.get() {
                    accumulate_delta(p, delta, settings, le);
                }
            }
        }

        return LRESULT(1);
    }

    CallNextHookEx(Some(hook), n_code, w_param, l_param)
}

fn init_globals(settings: AppSettings) {
    G_PENDING_V.get_or_init(|| Mutex::new(0.0));
    G_PENDING_H.get_or_init(|| Mutex::new(0.0));
    G_LAST_EVENT_TIME.get_or_init(|| Mutex::new(0.0));
    G_SETTINGS.get_or_init(|| Mutex::new(settings));
    G_ENGINE.get_or_init(|| {
        Mutex::new(EngineState {
            hook_thread: None,
            send_thread: None,
            send_stop: Arc::new(AtomicBool::new(false)),
        })
    });
}

unsafe extern "system" fn wnd_proc(
    h_wnd: HWND,
    msg: u32,
    w_param: WPARAM,
    l_param: LPARAM,
) -> LRESULT {
    if msg == WM_DESTROY {
        PostQuitMessage(0);
        LRESULT(0)
    } else {
        DefWindowProcW(h_wnd, msg, w_param, l_param)
    }
}

fn hook_thread_main() {
    unsafe {
        timeBeginPeriod(1);

        let class_name = w!("SSFEEngine");
        let h_instance = GetModuleHandleW(None).unwrap();

        let wc = WNDCLASSEXW {
            cbSize: std::mem::size_of::<WNDCLASSEXW>() as u32,
            style: WNDCLASS_STYLES(0),
            lpfnWndProc: Some(wnd_proc),
            cbClsExtra: 0,
            cbWndExtra: 0,
            hInstance: h_instance.into(),
            hIcon: HICON::default(),
            hCursor: HCURSOR::default(),
            hbrBackground: HBRUSH(std::ptr::null_mut()),
            lpszMenuName: windows::core::PCWSTR::null(),
            lpszClassName: windows::core::PCWSTR(class_name.as_ptr()),
            hIconSm: HICON::default(),
        };
        RegisterClassExW(&wc as *const WNDCLASSEXW);

        let h_wnd = CreateWindowExW(
            WINDOW_EX_STYLE(0),
            windows::core::PCWSTR(class_name.as_ptr()),
            windows::core::PCWSTR::null(),
            WINDOW_STYLE(0),
            0, 0, 0, 0,
            Some(HWND_MESSAGE),
            None,
            Some(h_instance.into()),
            None,
        ).unwrap();
        G_MESSAGE_WINDOW.store(h_wnd.0, Ordering::SeqCst);

        let hook = SetWindowsHookExW(
            WH_MOUSE_LL,
            Some(low_level_mouse_proc),
            Some(h_instance.into()),
            0,
        ).unwrap();
        G_HOOK_HANDLE.store(hook.0, Ordering::SeqCst);
        G_RUNNING.store(true, Ordering::SeqCst);

        let mut msg = MSG::default();
        while GetMessageW(&mut msg as *mut MSG, None, 0, 0).as_bool() {
            let _ = TranslateMessage(&msg as *const MSG);
            DispatchMessageW(&msg as *const MSG);
        }

        G_HOOK_HANDLE.store(std::ptr::null_mut(), Ordering::SeqCst);
        G_MESSAGE_WINDOW.store(std::ptr::null_mut(), Ordering::SeqCst);
        UnhookWindowsHookEx(hook).ok();
        DestroyWindow(h_wnd).ok();
        timeEndPeriod(1);
        G_RUNNING.store(false, Ordering::SeqCst);
    }
}

fn take_from_pending(pending: &Mutex<f64>, _is_horizontal: bool, last_event: &Mutex<f64>, settings: &Mutex<AppSettings>) -> f64 {
    let (duration, pulse_enabled) = {
        let s = settings.lock().unwrap();
        (s.animation_duration_ms as f64, s.pulse_enabled)
    };

    let mut p = pending.lock().unwrap();
    let abs_delta = p.abs();
    if abs_delta < 0.01 {
        return 0.0;
    }

    let (step_size, max_step, step_gain) = {
        let s = settings.lock().unwrap();
        (s.step_size, s.max_send_step, s.step_gain)
    };

    let raw_step = step_size + (abs_delta / step_gain);

    let step = if pulse_enabled {
        let elapsed = get_time_ms() - *last_event.lock().unwrap();
        let progress = (elapsed / duration).min(1.0);
        let pulse_factor = if progress >= 1.0 { 1.0 } else { pulse(progress) };
        let s = raw_step * pulse_factor;
        let lo = step_size * pulse_factor;
        s.clamp(lo, max_step).max(1.0)
    } else {
        raw_step.clamp(step_size, max_step)
    };

    let taken = if *p > 0.0 {
        f64::min(step, *p)
    } else {
        f64::max(-step, *p)
    };
    *p -= taken;
    taken
}

fn send_scroll(delta: i32, is_horizontal: bool) {
    unsafe {
        let mut pos = POINT::default();
        let _ = GetCursorPos(&mut pos);
        let hwnd = WindowFromPoint(pos);
        if hwnd.is_invalid() {
            return;
        }
        let msg = if is_horizontal { WM_MOUSEHWHEEL } else { WM_MOUSEWHEEL };
        let w_param = WPARAM(((delta as i16 as u16 as usize) << 16) | 0);
        let l_param = LPARAM(((pos.y as i16 as u16 as isize) << 16) | (pos.x as i16 as u16 as isize));
        let _ = PostMessageW(Some(hwnd), msg, w_param, l_param);
    }
}

fn send_thread_main(
    stop: Arc<AtomicBool>,
    pending_v: &Mutex<f64>,
    pending_h: &Mutex<f64>,
    last_event: &Mutex<f64>,
    settings: &Mutex<AppSettings>,
) {
    unsafe {
        timeBeginPeriod(1);

        loop {
            if stop.load(Ordering::Relaxed) {
                break;
            }

            let interval = {
                let s = settings.lock().unwrap();
                s.send_interval_ms as u32
            };

            let deadline = get_time_ms() + interval as f64;
            while get_time_ms() < deadline {
                if stop.load(Ordering::Relaxed) {
                    timeEndPeriod(1);
                    return;
                }
                thread::sleep(std::time::Duration::from_millis(1));
            }

            if stop.load(Ordering::Relaxed) {
                break;
            }

            let take_v = take_from_pending(pending_v, false, last_event, settings);
            let take_h = take_from_pending(pending_h, true, last_event, settings);

            if take_v.abs() >= 0.01 {
                send_scroll(take_v as i32, false);
            }
            if take_h.abs() >= 0.01 {
                send_scroll(take_h as i32, true);
            }
        }

        timeEndPeriod(1);
    }
}

pub struct SmoothScrollEngine;

impl SmoothScrollEngine {
    pub fn init(settings: AppSettings) {
        init_globals(settings);
    }

    pub fn is_running() -> bool {
        G_RUNNING.load(Ordering::SeqCst)
    }

    pub fn update_settings(settings: AppSettings) {
        if let Some(g) = G_SETTINGS.get() {
            *g.lock().unwrap() = settings;
        }
    }

    pub fn start() -> Result<(), String> {
        if G_RUNNING.load(Ordering::SeqCst) {
            return Err("Already running".into());
        }

        let settings = G_SETTINGS.get().ok_or("Engine not initialized")?;
        let pending_v = G_PENDING_V.get().ok_or("Engine not initialized")?;
        let pending_h = G_PENDING_H.get().ok_or("Engine not initialized")?;
        let last_event = G_LAST_EVENT_TIME.get().ok_or("Engine not initialized")?;
        let engine = G_ENGINE.get().ok_or("Engine not initialized")?;

        let send_stop = Arc::new(AtomicBool::new(false));

        let s = send_stop.clone();
        let send_handle = thread::Builder::new()
            .name("SSFE-send".into())
            .spawn(move || send_thread_main(s, pending_v, pending_h, last_event, settings))
            .map_err(|e| format!("Failed to spawn send thread: {}", e))?;

        let hook_handle = thread::Builder::new()
            .name("SSFE-hook".into())
            .spawn(|| hook_thread_main())
            .map_err(|e| {
                send_stop.store(true, Ordering::Relaxed);
                format!("Failed to spawn hook thread: {}", e)
            })?;

        {
            let mut e = engine.lock().unwrap();
            e.send_thread = Some(send_handle);
            e.send_stop = send_stop;
            e.hook_thread = Some(hook_handle);
        }

        thread::sleep(std::time::Duration::from_millis(200));

        if !G_RUNNING.load(Ordering::SeqCst) {
            Self::stop().ok();
            return Err("Hook thread failed to install hook".into());
        }

        Ok(())
    }

    pub fn stop() -> Result<(), String> {
        G_RUNNING.store(false, Ordering::SeqCst);

        let engine = G_ENGINE.get().ok_or("Engine not initialized")?;

        let (hook_thread, send_thread, send_stop) = {
            let mut e = engine.lock().unwrap();
            (e.hook_thread.take(), e.send_thread.take(), e.send_stop.clone())
        };

        send_stop.store(true, Ordering::Relaxed);

        unsafe {
            let hwnd_ptr = G_MESSAGE_WINDOW.load(Ordering::Relaxed);
            if !hwnd_ptr.is_null() {
                PostMessageW(Some(HWND(hwnd_ptr)), WM_QUIT, WPARAM(0), LPARAM(0)).ok();
            }
        }

        if let Some(h) = hook_thread {
            let _ = h.join();
        }

        if let Some(s) = send_thread {
            let _ = s.join();
        }

        G_HOOK_HANDLE.store(std::ptr::null_mut(), Ordering::SeqCst);
        G_MESSAGE_WINDOW.store(std::ptr::null_mut(), Ordering::SeqCst);

        for pending in [G_PENDING_V.get(), G_PENDING_H.get()].iter().flatten() {
            let mut p = pending.lock().unwrap();
            *p = 0.0;
        }

        if let Some(le) = G_LAST_EVENT_TIME.get() {
            *le.lock().unwrap() = 0.0;
        }

        Ok(())
    }
}