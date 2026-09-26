import { Paperclip, LayoutTemplate, FileText } from 'lucide-react';

interface NoteHeaderProps {
  sessionDate: string;
  attachedLabCount: number;
  onAttachLabsClick: () => void;
  onTemplatesClick: () => void;
}

export default function NoteHeader({
  sessionDate,
  attachedLabCount,
  onAttachLabsClick,
  onTemplatesClick,
}: NoteHeaderProps) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm">
          <FileText className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">Clinical Encounter Note</h2>
          <p className="text-xs text-gray-400">SOAP documentation · Session {sessionDate}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onAttachLabsClick}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <Paperclip className="h-3.5 w-3.5" />
          Attach Labs
          {attachedLabCount > 0 && (
            <span className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-[10px] font-bold text-white">
              {attachedLabCount}
            </span>
          )}
        </button>
        <button
          onClick={onTemplatesClick}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <LayoutTemplate className="h-3.5 w-3.5" />
          Templates
        </button>
      </div>
    </div>
  );
}