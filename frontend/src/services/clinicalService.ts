import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { SoapNote } from '@/types/clinical';

export interface SaveClinicalNoteParams {
  patientId: string;
  sessionDate: string;
  note: SoapNote;
  attachedLabIds: string[];
}

export interface ClinicalNoteRecord {
  id: string;
  session_date: string;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

// An encounter can't be finalised without a diagnosis and a treatment plan.
// Whitespace-only text counts as empty.
const requiredSections: { key: keyof SoapNote; label: string }[] = [
  { key: 'assessment', label: 'Assessment' },
  { key: 'plan', label: 'Plan' },
];

export function getMissingRequiredSections(note: SoapNote): string[] {
  return requiredSections
    .filter(({ key }) => note[key].trim() === '')
    .map(({ label }) => label);
}

export function getIncompleteNoteMessage(missing: string[]): string {
  if (missing.length === 0) return '';
  return `${missing.join(' and ')} must be completed before finalising.`;
}

export async function saveClinicalNote(params: SaveClinicalNoteParams): Promise<boolean> {
  // Guard here too, so an incomplete note can't be saved even if the UI check is bypassed.
  if (getMissingRequiredSections(params.note).length > 0) {
    console.warn('Refusing to save clinical note: required sections are empty.');
    return false;
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('clinical_notes').insert({
        patient_id: params.patientId,
        session_date: params.sessionDate,
        subjective: params.note.subjective,
        objective: params.note.objective,
        assessment: params.note.assessment,
        plan: params.note.plan,
        attached_lab_ids: params.attachedLabIds,
      });

      if (error) {
        console.warn('Error saving clinical note to Supabase:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('Failed to insert clinical note:', e);
      return false;
    }
  }
  // No database connection. Nothing was saved, so do not report success.
  console.warn('Cannot save clinical note: database is not configured.');
  return false;
}

export async function getPatientClinicalHistory(patientId: string): Promise<ClinicalNoteRecord[]> {
  if (!patientId || !isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('clinical_notes')
      .select('id, session_date, subjective, objective, assessment, plan')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: false });

    if (error) {
      console.warn('Error fetching clinical history:', error.message);
      return [];
    }
    return (data || []) as ClinicalNoteRecord[];
  } catch (e) {
    console.warn('Failed to fetch clinical history:', e);
    return [];
  }
}

export async function getClinicalPatient(id: string): Promise<import('@/types/clinical').Patient | null> {
  if (!id || !isSupabaseConfigured || !supabase) {
    return null;
  }

  try {
    // 1. Fetch basic patient data
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (patientError || !patientData) {
      console.warn('Patient not found in Supabase:', patientError?.message);
      return null;
    }

    // 2. Fetch medications
    const { data: medsData } = await supabase
      .from('medications')
      .select('*')
      .eq('patient_id', id)
      .eq('status', 'Active');

    // 3. Fetch visit history
    const { data: visitsData } = await supabase
      .from('visit_history')
      .select('*')
      .eq('patient_id', id)
      .order('visit_date', { ascending: false });

    // Calculate age
    const birthDate = new Date(patientData.dob);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);

    return {
      id: patientData.id,
      name: patientData.name,
      age: age || 40,
      gender: 'Not specified',
      patientId: patientData.patient_code,
      allergies: ['None known'],
      vitals: {
        bloodPressure: '—',
        heartRate: '—',
        temperature: '—',
      },
      isActiveEncounter: true,
      medications: (medsData || []).map(m => ({
        id: m.id,
        name: m.name,
        instructions: `${m.dosage} - ${m.frequency}`
      })),
      visitHistory: (visitsData || []).map(v => ({
        id: v.id,
        date: v.visit_date,
        type: 'Follow-up' as import('@/types/clinical').VisitType,
        diagnosis: v.reason,
        note: '',
        providerName: v.provider
      }))
    };
  } catch (e) {
    console.warn('Failed to fetch clinical patient:', e);
    return (await import('@/data/mockPatient')).mockPatient;
  }
}
