import { ArrowLeft, ArrowUp, X } from 'lucide-react';

interface ReturnBarProps {
  returnPoint: { scrollY: number; label: string } | null;
  showBackToSummary: boolean;
  onReturnPrevious: () => void;
  onDismissReturn: () => void;
  onBackToSummary: () => void;
}

export function ReturnBar({
  returnPoint,
  showBackToSummary,
  onReturnPrevious,
  onDismissReturn,
  onBackToSummary,
}: ReturnBarProps) {
  if (!showBackToSummary && !returnPoint) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 max-w-[calc(100vw-2rem)]">
      {returnPoint && (
        <div className="inline-flex items-center bg-slate-900 text-white rounded-md shadow-md overflow-hidden">
          <button
            type="button"
            onClick={onReturnPrevious}
            className="inline-flex items-center gap-1.5 pl-3 pr-2 py-2 text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate max-w-[180px] sm:max-w-none">
              Return to {returnPoint.label}
            </span>
          </button>
          <button
            type="button"
            onClick={onDismissReturn}
            aria-label="Dismiss return button"
            className="px-2 py-2 text-slate-300 hover:text-white hover:bg-slate-800 border-l border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {showBackToSummary && (
        <button
          type="button"
          onClick={onBackToSummary}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:border-slate-900 rounded-md shadow-sm transition-colors cursor-pointer whitespace-nowrap"
        >
          <ArrowUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">Back to Summary</span>
          <span className="sm:hidden">Top</span>
        </button>
      )}
    </div>
  );
}
