export default function TopOverlay() {
  return (
    <header className="flex items-start p-gutter z-[102] relative">
      <div className="flex flex-col">
        <span className="font-label-bold text-[10px] sm:text-label-bold text-primary tracking-[0.15em] sm:tracking-[0.2em]">
          MINISTRY OF INTERNAL AFFAIRS
        </span>
        <div className="flex items-center gap-2 sm:gap-4 mt-1 sm:mt-2">
          <span className="font-headline-md text-xl sm:text-headline-md text-on-surface tracking-tighter">
            SECTOR 7
          </span>
          <div className="classified-stamp text-xs sm:text-base px-1 sm:px-2 py-0">CLASSIFIED</div>
        </div>
        <span className="font-label-sm text-[10px] sm:text-label-sm text-on-surface-variant mt-0.5 sm:mt-1">
          CASE #4471-B
        </span>
      </div>
    </header>
  )
}

const TOTAL_SECONDS = 300

function formatTime(seconds: number): string {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

interface SessionTimerProps {
  secondsRemaining: number
}

export function SessionTimer({ secondsRemaining }: SessionTimerProps) {
  const timeLeft = TOTAL_SECONDS - secondsRemaining
  const isWarning = timeLeft <= 60
  const isCritical = timeLeft <= 30
  const timeStr = formatTime(secondsRemaining)

  return (
    <div className="absolute top-0 right-0 p-gutter z-[102] flex flex-col items-end">
      <div className={`bg-surface-container px-2 sm:px-3 py-1 border flex items-center gap-1 sm:gap-2 ${
        isCritical ? 'border-red-500' : isWarning ? 'border-red-700' : 'border-surface-variant'
      }`}>
        <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 animate-pulse ${isWarning ? 'bg-red-500' : 'bg-primary-container'}`} />
        <span className={`font-label-bold text-[10px] sm:text-label-bold ${
          isCritical ? 'animate-pulse text-red-400' : isWarning ? 'text-red-500' : 'text-on-surface'
        }`}>
          SESSION {timeStr}
        </span>
      </div>
      <span className={`font-label-sm text-[10px] sm:text-label-sm mt-1 sm:mt-2 ${
        isCritical ? 'text-red-500 animate-pulse' : 'text-on-surface-variant'
      }`}>
        {isCritical ? 'TIME CRITICAL' : 'UPLINK: ACTIVE'}
      </span>
    </div>
  )
}
