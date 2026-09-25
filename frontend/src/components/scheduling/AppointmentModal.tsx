import { useState } from 'react';
import { X, Calendar, Clock, User, Stethoscope } from 'lucide-react';
import { Patient } from '@/types/patient';
import { StaffMember } from '@/types/staff';
import { Appointment, CreateAppointmentData } from '@/types/appointment';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateAppointmentData) => Promise<void>;
  patients: Patient[];
  staff: StaffMember[];
  initialData?: Appointment | null;
}

export default function AppointmentModal({
  isOpen,
  onClose,
  onSave,
  patients,
  staff,
  initialData,
}: AppointmentModalProps) {
  console.log("AppointmentModal render. patients:", patients?.length, "staff:", staff?.length);
  // Parent mounts this modal only while open, so initial state is seeded from props once per open
  const initialStart = initialData ? new Date(initialData.start_time) : null;
  const initialEnd = initialData ? new Date(initialData.end_time) : null;

  const [patientId, setPatientId] = useState(initialData?.patient_id ?? '');
  const [doctorId, setDoctorId] = useState(initialData?.doctor_id ?? '');
  const [date, setDate] = useState(initialStart ? initialStart.toISOString().split('T')[0] : '');
  const [startTime, setStartTime] = useState(initialStart ? initialStart.toTimeString().slice(0, 5) : '');
  const [duration, setDuration] = useState(
    initialStart && initialEnd ? String((initialEnd.getTime() - initialStart.getTime()) / 60000) : '30'
  );
  const [reason, setReason] = useState(initialData?.reason ?? '');
  const [status, setStatus] = useState<'Scheduled' | 'Completed' | 'Cancelled' | 'No Show'>(initialData?.status ?? 'Scheduled');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!patientId || !doctorId || !date || !startTime) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const startDateTime = new Date(`${date}T${startTime}`);
      const endDateTime = new Date(startDateTime.getTime() + parseInt(duration) * 60000);

      await onSave({
        patient_id: patientId,
        doctor_id: doctorId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        status,
        reason,
      });
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to save appointment');
      } else {
        setError('Failed to save appointment');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-800">
            {initialData ? 'Edit Appointment' : 'New Appointment'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                <User className="h-4 w-4 text-slate-400" /> Patient
              </label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                required
              >
                <option value="">Select a patient...</option>
                {patients && patients.length > 0 ? patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.patient_code})</option>
                )) : null}
              </select>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Stethoscope className="h-4 w-4 text-slate-400" /> Doctor
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                required
              >
                <option value="">Select a doctor...</option>
                {staff && staff.length > 0 ? staff.filter(s => s.role.toLowerCase().includes('doctor') || s.role.toLowerCase().includes('physician')).map(s => (
                  <option key={s.id} value={s.id}>{s.name} - {s.department}</option>
                )) : null}
              </select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Calendar className="h-4 w-4 text-slate-400" /> Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Clock className="h-4 w-4 text-slate-400" /> Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Duration (mins)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show')}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No Show">No Show</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Reason / Notes</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Brief description for the visit..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : 'Save Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
