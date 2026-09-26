'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PatientContextBar from '@/components/clinical/PatientContextBar';
import ActiveMedicationsList from '@/components/clinical/ActiveMedicationsList';
import VisitHistoryTimeline from '@/components/clinical/VisitHistoryTimeline';
import ClinicalNoteEditor from '@/components/clinical/ClinicalNoteEditor';
import NoteFooter from '@/components/clinical/NoteFooter';
import TemplatesModal from '@/components/clinical/TemplatesModal';
import AttachLabsModal from '@/components/clinical/AttachLabsModal';
import PreviewNoteModal from '@/components/clinical/PreviewNoteModal';
import FullMedicalRecordModal from '@/components/clinical/FullMedicalRecordModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Patient, SoapNote, Vitals } from '@/types/clinical';
import { useAutoSave } from '@/hooks/useAutoSave';
import {
  saveClinicalNote,
  getClinicalPatient,
  getPatientClinicalHistory,
  getMissingRequiredSections,
  getIncompleteNoteMessage,
  ClinicalNoteRecord,
} from '@/services/clinicalService';
import { useToast } from '@/components/ui/Toast';
import { Calendar, Clock, Save } from 'lucide-react';

const emptyNote: SoapNote = { subjective: '', objective: '', assessment: '', plan: '' };
const defaultVitals: Vitals = { bloodPressure: '—', heartRate: '—', temperature: '—' };

function ClinicalWorkspaceContent({ patientId }: { patientId: string | null }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [note, setNote] = useState<SoapNote>(emptyNote);
  const [vitals, setVitals] = useState<Vitals>(defaultVitals);
  const [attachedLabIds, setAttachedLabIds] = useState<string[]>([]);

  // Modal states
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isAttachLabsOpen, setIsAttachLabsOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);
  const [isCompleteConfirmOpen, setIsCompleteConfirmOpen] = useState(false);
  const [isFullRecordOpen, setIsFullRecordOpen] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  // Full medical record data
  const [clinicalHistory, setClinicalHistory] = useState<ClinicalNoteRecord[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const [sessionTime, setSessionTime] = useState(0);

  const { addToast } = useToast();
  const router = useRouter();

  // Content is keyed by patientId, so state starts fresh for each patient
  useEffect(() => {
    let isCancelled = false;

    getClinicalPatient(patientId || '').then((data) => {
      if (!isCancelled) {
        setPatient(data);
        // Pre-fill vitals from the loaded patient data if available
        if (data?.vitals) {
          setVitals(data.vitals);
        }
        setIsLoading(false);
      }
    });

    const timer = setInterval(() => {
      setSessionTime((prev) => prev + 1);
    }, 1000);

    return () => {
      isCancelled = true;
      clearInterval(timer);
    };
  }, [patientId]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const lastSavedAt = useAutoSave(note);
  const missingSections = getMissingRequiredSections(note);
  const canComplete = missingSections.length === 0;

  function updateNoteField(key: keyof SoapNote, value: string) {
    setNote((prev) => ({ ...prev, [key]: value }));
  }

  function handleVitalsChange(field: keyof Vitals, value: string) {
    setVitals((prev) => ({ ...prev, [field]: value }));
  }

  function handleConfirmDiscard() {
    setNote(emptyNote);
    setVitals(patient?.vitals ?? defaultVitals);
    setAttachedLabIds([]);
    setIsDiscardConfirmOpen(false);
    addToast({ type: 'warning', title: 'Draft Discarded', message: 'Note content has been cleared.' });
  }

  async function handleConfirmComplete() {
    if (!patient || !canComplete) return;
    setIsCompleting(true);
    const saved = await saveClinicalNote({
      patientId: patient.id,
      sessionDate: new Date().toISOString().slice(0, 10),
      note,
      attachedLabIds,
    });
    setIsCompleting(false);
    setIsCompleteConfirmOpen(false);

    if (saved) {
      addToast({
        type: 'success',
        title: 'Encounter Finalized',
        message: `Notes for ${patient.name} saved and locked.`,
      });
      // Reset editor
      setNote(emptyNote);
      setVitals(defaultVitals);
      setAttachedLabIds([]);
      // Redirect back to patient directory after a short delay
      setTimeout(() => router.push('/patients'), 1200);
    } else {
      addToast({
        type: 'warning',
        title: 'Save Failed',
        message: 'Note could not be saved. Check your connection and try again.',
      });
    }
  }

  async function handleOpenFullRecord() {
    setIsFullRecordOpen(true);
    if (!patient) return;
    setIsHistoryLoading(true);
    const history = await getPatientClinicalHistory(patient.id);
    setClinicalHistory(history);
    setIsHistoryLoading(false);
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6 animate-pulse">
          <div className="h-24 bg-slate-200 rounded-2xl w-full"></div>
          <div className="h-16 bg-slate-200 rounded-xl w-full"></div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
            <div className="h-96 bg-slate-200 rounded-2xl w-full"></div>
            <div className="h-[600px] bg-slate-200 rounded-2xl w-full"></div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!patient) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-[80vh] text-center animate-fade-in">
          <div className="bg-teal-50 w-20 h-20 rounded-full flex items-center justify-center mb-6">
            <Calendar className="w-10 h-10 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">No Patient Selected</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8">
            Please navigate to the Patient Directory and click &quot;Start Clinical Note&quot; on a patient&#39;s row to open their
            clinical workspace.
          </p>
          <a
            href="/patients"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:from-teal-600 hover:to-emerald-700 transition-all card-hover"
          >
            Go to Patient Directory
          </a>
        </div>
      </AppShell>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const shortDate = new Date().toLocaleDateString('en-US');

  return (
    <AppShell>
      <PatientContextBar
        patient={patient}
        vitals={vitals}
        onVitalsChange={handleVitalsChange}
      />

      {/* Session Info Bar */}
      <div className="my-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-4 rounded-xl bg-white p-4 shadow-sm border border-slate-100 animate-slide-up">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-4 w-4 text-teal-500" />
            <span className="font-semibold">{currentDate}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="h-4 w-4 text-teal-500" />
            <span className="font-semibold tracking-wide">Session: {formatTime(sessionTime)}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Save className="h-4 w-4 text-slate-400" />
          <span className="text-slate-500">
            {lastSavedAt
              ? `Auto-saved at ${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Draft not saved yet'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] animate-fade-in">
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-6">
          <ActiveMedicationsList medications={patient.medications} />
          <VisitHistoryTimeline
            visits={patient.visitHistory}
            onViewFullRecord={handleOpenFullRecord}
          />
        </div>

        <ClinicalNoteEditor
          sessionDate={shortDate}
          note={note}
          onChange={updateNoteField}
          attachedLabCount={attachedLabIds.length}
          onAttachLabsClick={() => setIsAttachLabsOpen(true)}
          onTemplatesClick={() => setIsTemplatesOpen(true)}
        />
      </div>

      <NoteFooter
        lastSavedAt={lastSavedAt}
        canComplete={canComplete}
        incompleteMessage={getIncompleteNoteMessage(missingSections)}
        onDiscard={() => setIsDiscardConfirmOpen(true)}
        onPreview={() => setIsPreviewOpen(true)}
        onComplete={() => setIsCompleteConfirmOpen(true)}
      />

      {/* Modals */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={setNote}
      />

      {isAttachLabsOpen && (
        <AttachLabsModal
          isOpen={isAttachLabsOpen}
          onClose={() => setIsAttachLabsOpen(false)}
          attachedLabIds={attachedLabIds}
          onSave={setAttachedLabIds}
        />
      )}

      <PreviewNoteModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        note={note}
        patientName={patient.name}
        patientId={patient.patientId}
        sessionDate={shortDate}
        vitals={vitals}
      />

      <FullMedicalRecordModal
        isOpen={isFullRecordOpen}
        onClose={() => setIsFullRecordOpen(false)}
        patientName={patient.name}
        patientId={patient.patientId}
        records={clinicalHistory}
        isLoading={isHistoryLoading}
      />

      <ConfirmDialog
        isOpen={isDiscardConfirmOpen}
        title="Discard Draft"
        message="Are you sure you want to discard this draft? All unsaved note content and attached labs will be cleared."
        confirmLabel="Discard"
        isDangerous
        onConfirm={handleConfirmDiscard}
        onCancel={() => setIsDiscardConfirmOpen(false)}
      />

      <ConfirmDialog
        isOpen={isCompleteConfirmOpen}
        title="Complete Encounter"
        message={`Save and finalize this encounter note for ${patient.name}? You will be returned to the patient directory.`}
        confirmLabel={isCompleting ? 'Saving…' : 'Complete Encounter'}
        onConfirm={handleConfirmComplete}
        onCancel={() => setIsCompleteConfirmOpen(false)}
      />
    </AppShell>
  );
}

function ClinicalWorkspaceForPatient() {
  const patientId = useSearchParams().get('patientId');
  return <ClinicalWorkspaceContent key={patientId ?? ''} patientId={patientId} />;
}

export default function ClinicalWorkspacePage() {
  return (
    <ProtectedRoute allowedRoles={['Doctor']}>
    <Suspense
      fallback={
        <AppShell>
          <div className="space-y-6 animate-pulse p-8">
            <div className="h-24 bg-slate-200 rounded-2xl w-full"></div>
          </div>
        </AppShell>
      }
    >
      <ClinicalWorkspaceForPatient />
    </Suspense>
    </ProtectedRoute>
  );
}