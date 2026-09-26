-- Clinical Notes subsystem: close the gaps between the interface and the schema.
-- Each change comes from something the clinical workspace already does.

-- Gap 1: record which clinician authored each note.
ALTER TABLE public.clinical_notes
  ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.user_profiles(id);

-- Gap 2: persist the vitals the PatientContextBar already captures.
ALTER TABLE public.clinical_notes
  ADD COLUMN IF NOT EXISTS blood_pressure TEXT,
  ADD COLUMN IF NOT EXISTS heart_rate     TEXT,
  ADD COLUMN IF NOT EXISTS temperature    TEXT;

-- Gap 3: tell a draft apart from a finalised note.
ALTER TABLE public.clinical_notes
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Draft'
  CHECK (status IN ('Draft', 'Finalized'));

-- Gap 4: a clinical note must belong to a patient.
ALTER TABLE public.clinical_notes
  ALTER COLUMN patient_id SET NOT NULL;

-- Gap 5: the history query filters by patient and sorts by date.
CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient_date
  ON public.clinical_notes (patient_id, session_date DESC);