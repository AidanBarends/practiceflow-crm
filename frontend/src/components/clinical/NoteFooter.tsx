import { Save, Eye, Trash2, CheckCircle } from 'lucide-react';

interface NoteFooterProps {
  lastSavedAt: Date | null;
  canComplete: boolean;
  incompleteMessage: string;
  onDiscard: () => void;
  onPreview: () => void;
  onComplete: () => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function NoteFooter({
  lastSavedAt,
  canComplete,
  incompleteMessage,
  onDiscard,
  onPreview,
  onComplete,
}: NoteFooterProps) {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-gray-200 bg-white px-4 sm:px-5 py-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Save className="h-3.5 w-3.5" />
        {lastSavedAt ? (
          <span>Auto-saved at <span className="font-medium text-gray-500">{formatTime(lastSavedAt)}</span></span>
        ) : (
          <span>No changes yet</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {!canComplete && incompleteMessage && (
          <span role="status" className="text-xs font-medium text-amber-600">
            {incompleteMessage}
          </span>
        )}
        <button
          onClick={onDiscard}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Discard Draft
        </button>
        <button
          onClick={onPreview}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          Preview Note
        </button>
        <button
          onClick={onComplete}
          disabled={!canComplete}
          title={canComplete ? undefined : incompleteMessage}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:from-teal-700 hover:to-emerald-700 transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:from-teal-600 disabled:hover:to-emerald-600"
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Complete Encounter
        </button>
      </div>
    </div>
  );
}