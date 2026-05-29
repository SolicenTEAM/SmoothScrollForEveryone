import { open } from '@tauri-apps/plugin-shell'

const CURRENT = '1.0.0'
const LATEST = '1.2.0'

export function UpdateBanner() {
  const handleDownload = () => {
    open('https://github.com/SolicenTEAM/Smooth-Scroll-For-Everyone/releases/latest')
  }

  return (
    <div className="bg-orange-600 text-white text-xs flex items-center justify-center gap-2.5 h-8 shrink-0 px-4 select-none">
      <span className="font-mono tabular-nums">v{CURRENT}</span>
      <span className="text-orange-200/80">→</span>
      <span className="font-mono tabular-nums font-semibold">v{LATEST}</span>
      <button
        onClick={handleDownload}
        className="ml-1 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors px-3.5 py-0.5 text-[11px] font-medium leading-tight"
      >
        Download and Install
      </button>
    </div>
  )
}
