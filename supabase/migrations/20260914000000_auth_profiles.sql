-- ============================================================
-- Authentication & User Profiles Migration
-- Links Supabase Auth users to staff records with role-based RLS
-- ============================================================

-- 1. Create user_profiles table (links auth.users → staff)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'Receptionist' CHECK (role IN ('Doctor', 'Nurse', 'Receptionist', 'Admin')),
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add auth_user_id column to staff table
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. User profiles policies
CREATE POLICY "Users can read own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins and doctors can read all profiles"
    ON public.user_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.role IN ('Admin', 'Doctor')
        )
    );

CREATE POLICY "Admins can manage profiles"
    ON public.user_profiles FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.role IN ('Admin', 'Doctor')
        )
    );

-- Allow service_role to insert profiles (used by Edge Function)
CREATE POLICY "Service role can manage profiles"
    ON public.user_profiles FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================
-- 5. Replace existing wide-open RLS policies with auth-based ones
-- ============================================================

-- --- PATIENTS ---
DROP POLICY IF EXISTS "Allow public read access on patients" ON public.patients;
DROP POLICY IF EXISTS "Allow public write access on patients" ON public.patients;

CREATE POLICY "Authenticated users can read patients"
    ON public.patients FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert patients"
    ON public.patients FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update patients"
    ON public.patients FOR UPDATE
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and doctors can delete patients"
    ON public.patients FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.role IN ('Admin', 'Doctor')
        )
    );

-- --- STAFF ---
DROP POLICY IF EXISTS "Allow public read access on staff" ON public.staff;
DROP POLICY IF EXISTS "Allow public write access on staff" ON public.staff;

CREATE POLICY "Authenticated users can read staff"
    ON public.staff FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and doctors can manage staff"
    ON public.staff FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.role IN ('Admin', 'Doctor')
        )
    );

-- --- CLINICAL NOTES ---
DROP POLICY IF EXISTS "Allow public read access on clinical_notes" ON public.clinical_notes;
DROP POLICY IF EXISTS "Allow public write access on clinical_notes" ON public.clinical_notes;

CREATE POLICY "Doctors can read clinical notes"
    ON public.clinical_notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.role IN ('Doctor', 'Admin')
        )
    );

CREATE POLICY "Doctors can manage clinical notes"
    ON public.clinical_notes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.role IN ('Doctor', 'Admin')
        )
    );

-- --- MEDICATIONS ---
DROP POLICY IF EXISTS "Allow public read access on medications" ON public.medications;
DROP POLICY IF EXISTS "Allow public write access on medications" ON public.medications;

CREATE POLICY "Doctors can read medications"
    ON public.medications FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.role IN ('Doctor', 'Admin')
        )
    );

CREATE POLICY "Doctors can manage medications"
    ON public.medications FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.role IN ('Doctor', 'Admin')
        )
    );

-- --- VISIT HISTORY ---
DROP POLICY IF EXISTS "Allow public read access on visit_history" ON public.visit_history;
DROP POLICY IF EXISTS "Allow public write access on visit_history" ON public.visit_history;

CREATE POLICY "Authenticated users can read visit history"
    ON public.visit_history FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Doctors can manage visit history"
    ON public.visit_history FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.role IN ('Doctor', 'Admin')
        )
    );

-- --- APPOINTMENTS ---
DROP POLICY IF EXISTS "Allow public read access on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public write access on appointments" ON public.appointments;

CREATE POLICY "Authenticated users can read appointments"
    ON public.appointments FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage appointments"
    ON public.appointments FOR ALL
    USING (auth.uid() IS NOT NULL);

-- --- INVOICES ---
DROP POLICY IF EXISTS "Allow public read access on invoices" ON public.invoices;
DROP POLICY IF EXISTS "Allow public write access on invoices" ON public.invoices;

CREATE POLICY "Admins and doctors can view invoices"
    ON public.invoices FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.role IN ('Admin', 'Doctor')
        )
    );

CREATE POLICY "Admins and doctors can manage invoices"
    ON public.invoices FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() AND up.role IN ('Admin', 'Doctor')
        )
    );

-- ============================================================
-- 6. Helper function to get current user's role
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

