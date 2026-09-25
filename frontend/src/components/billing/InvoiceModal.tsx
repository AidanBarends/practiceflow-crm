import { useState, useEffect } from 'react';
import { X, User, Calendar, FileText } from 'lucide-react';
import { Invoice, CreateInvoiceData } from '@/types/invoice';
import { Patient } from '@/types/patient';
import { StaffMember } from '@/types/staff';
import { fetchPatients } from '@/services/patientService';
import { fetchStaffMembers } from '@/services/staffService';
import { createInvoice, updateInvoice } from '@/services/invoiceService';
import { useToast } from '@/components/ui/Toast';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  initialData: Invoice | null;
}

export default function InvoiceModal({ isOpen, onClose, onSave, initialData }: InvoiceModalProps) {
  // Parent mounts this modal only while open, so initial state is seeded from props once per open
  const [patientId, setPatientId] = useState(initialData?.patient_id ?? '');
  const [doctorId, setDoctorId] = useState(initialData?.doctor_id ?? '');
  const [amount, setAmount] = useState(initialData ? initialData.amount.toString() : '');
  const [status, setStatus] = useState<Invoice['status']>(initialData?.status ?? 'Pending');
  const [dueDate, setDueDate] = useState(() => initialData?.due_date ?? new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(initialData?.notes ?? '');
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchPatients().then(setPatients);
      fetchStaffMembers().then(setStaff);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const data: CreateInvoiceData = {
        patient_id: patientId,
        doctor_id: doctorId || undefined,
        amount: parseFloat(amount),
        status,
        due_date: dueDate,
        notes: notes || undefined,
      };

      if (initialData) {
        await updateInvoice(initialData.id, data);
        addToast({ type: 'success', title: 'Updated', message: 'Invoice updated successfully.' });
      } else {
        await createInvoice(data);
        addToast({ type: 'success', title: 'Created', message: 'Invoice created successfully.' });
      }

      await onSave();
    } catch (err) {
      console.error(err);
      setError('An error occurred while saving the invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const doctors = staff.filter(s => s.role.toLowerCase().includes('doctor') || s.role.toLowerCase().includes('physician'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {initialData ? 'Edit Invoice' : 'New Invoice'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
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
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.patient_code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                <User className="h-4 w-4 text-slate-400" /> Attending Doctor (Optional)
              </label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">None...</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name} - {d.department}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <span className="text-slate-400 font-bold">R</span> Amount (R)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <FileText className="h-4 w-4 text-slate-400" /> Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Invoice['status'])}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                <Calendar className="h-4 w-4 text-slate-400" /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700">
                <FileText className="h-4 w-4 text-slate-400" /> Description / Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 min-h-[80px]"
                placeholder="e.g. General consultation and blood work"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
            >
              {isSubmitting ? 'Saving...' : 'Save Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
