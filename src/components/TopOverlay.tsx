export default function TopOverlay() {
  return (
    <header className="flex items-start p-gutter z-[110] relative">
      <div className="flex flex-col">
        <span className="font-label-bold text-label-bold text-primary tracking-[0.2em]">
          MINISTRY OF INTERNAL AFFAIRS
        </span>
        <div className="flex items-center gap-4 mt-2">
          <span className="font-headline-md text-headline-md text-on-surface tracking-tighter">
            SECTOR 7
          </span>
          <div className="classified-stamp text-base px-2 py-0">CLASSIFIED</div>
        </div>
        <span className="font-label-sm text-label-sm text-on-surface-variant mt-1">
          CASE #4471-B
        </span>
      </div>
    </header>
  )
}

function formatTime(seconds: number): string {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

interface SessionTimerProps {
  secondsRemaining: number
}

export function SessionTimer({ secondsRemaining }: SessionTimerProps) {
  const isWarning = secondsRemaining <= 60
  const isCritical = secondsRemaining <= 30
  const timeStr = formatTime(secondsRemaining)

  return (
    <div className="absolute top-0 right-0 p-gutter z-40 flex flex-col items-end">
      <div className={`bg-surface-container px-3 py-1 border flex items-center gap-2 ${
        isCritical ? 'border-red-500' : isWarning ? 'border-red-700' : 'border-surface-variant'
      }`}>
        <span className={`w-2 h-2 animate-pulse ${isWarning ? 'bg-red-500' : 'bg-primary-container'}`} />
        <span className={`font-label-bold text-label-bold ${
          isCritical ? 'animate-pulse text-red-400' : isWarning ? 'text-red-500' : 'text-on-surface'
        }`}>
          {secondsRemaining === 0 ? 'TIME EXPIRED' : `SESSION ${timeStr}`}
        </span>
      </div>
      <span className={`font-label-sm text-label-sm mt-2 ${
        isCritical ? 'text-red-500 animate-pulse' : 'text-on-surface-variant'
      }`}>
        {isCritical ? 'TIME CRITICAL' : 'UPLINK: ACTIVE'}
      </span>
    </div>
  )
}
