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

interface SessionTimerProps {
  sessionTime: string
}

export function SessionTimer({ sessionTime }: SessionTimerProps) {
  return (
    <div className="absolute top-0 right-0 p-gutter z-40 flex flex-col items-end">
      <div className="bg-surface-container px-3 py-1 border border-surface-variant flex items-center gap-2">
        <span className="w-2 h-2 bg-primary-container animate-pulse" />
        <span className="font-label-bold text-label-bold text-on-surface">
          SESSION {sessionTime}
        </span>
      </div>
      <span className="font-label-sm text-label-sm text-on-surface-variant mt-2">
        UPLINK: ACTIVE
      </span>
    </div>
  )
}
