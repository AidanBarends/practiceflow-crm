'use client';

import { useEffect, useRef } from 'react';
import { X, FileText, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface ClinicalNoteRecord {
  id: string;
  session_date: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface FullMedicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientId: string;
  records: ClinicalNoteRecord[];
  isLoading: boolean;
}

const soapLabels: { key: keyof Omit<ClinicalNoteRecord, 'id' | 'session_date'>; label: string; color: string }[] = [
  { key: 'subjective', label: 'Subjective', color: 'text-blue-700' },
  { key: 'objective', label: 'Objective', color: 'text-green-700' },
  { key: 'assessment', label: 'Assessment', color: 'text-purple-700' },
  { key: 'plan', label: 'Plan', color: 'text-orange-700' },
];

function NoteAccordion({ record, index }: { record: ClinicalNoteRecord; index: number }) {
  const [open, setOpen] = useState(index === 0);

  const hasContent = [record.subjective, record.objective, record.assessment, record.plan].some(v => v?.trim());

  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
            <FileText className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-800">Encounter — {record.session_date}</p>
            <p className="text-xs text-gray-400">
              {hasContent ? 'SOAP note documented' : 'No content recorded'}
            </p>
          </div>
        </div>
        {open ? (
          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 py-4 flex flex-col gap-3 bg-white">
          {soapLabels.map(({ key, label, color }) => (
            <div key={key}>
              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${color}`}>{label}</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {record[key]?.trim() || <span className="italic text-gray-400">Not documented</span>}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FullMedicalRecordModal({
  isOpen,
  onClose,
  patientName,
  patientId,
  records,
  isLoading,
}: FullMedicalRecordModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Full Medical Record</h2>
              <p className="text-xs text-gray-400">{patientName} · ID: {patientId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <Clock className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-gray-700">No clinical notes yet</p>
              <p className="mt-1 text-xs text-gray-400">
                Complete an encounter to start building this patient&apos;s medical record.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-gray-400 mb-1">
                {records.length} encounter{records.length !== 1 ? 's' : ''} on record · Most recent first
              </p>
              {records.map((record, i) => (
                <NoteAccordion key={record.id} record={record} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-100 px-6 py-4 shrink-0">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
