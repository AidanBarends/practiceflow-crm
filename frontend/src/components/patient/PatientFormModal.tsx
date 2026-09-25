'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Patient, PatientStatus } from '@/types/patient';

export interface PatientFormValues {
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  email: string;
  assignedDoctor: string;
  status: PatientStatus;
}

interface Props {
  mode: 'register' | 'edit';
  patient?: Patient;
  onClose: () => void;
  onSave: (values: PatientFormValues) => void;
}

function splitName(name: string) {
  const parts = name.split(',');
  if (parts.length === 2) return { first: parts[1].trim(), last: parts[0].trim() };
  return { first: name, last: '' };
}

export function PatientFormModal({ mode, patient, onClose, onSave }: Props) {
  // Parent mounts this modal only while open, so initial state is seeded from props once per open
  const [firstName, setFirstName] = useState(() => (patient ? splitName(patient.name).first : ''));
  const [lastName, setLastName] = useState(() => (patient ? splitName(patient.name).last : ''));
  const [dob, setDob] = useState(patient?.dob ?? '');
  const [phone, setPhone] = useState(patient?.phone ?? '');
  const [email, setEmail] = useState(patient?.email ?? '');
  const [assignedDoctor, setAssignedDoctor] = useState(patient?.assignedDoctor ?? 'Dr. Sarah Smith');
  const [status, setStatus] = useState<PatientStatus>(patient?.status ?? 'Active');

  const [doctors, setDoctors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function loadDoctors() {
      const { fetchStaffMembers } = await import('@/services/staffService');
      const allStaff = await fetchStaffMembers();
      const activeDoctors = allStaff.filter(s => s.role === 'Doctor' && s.status === 'Active');
      const docList = activeDoctors.map(d => ({ id: d.id, name: d.name }));
      setDoctors(docList);
      
      // If registering a new patient and we have doctors, default to the first one
      if (!patient && docList.length > 0) {
        setAssignedDoctor(docList[0].name);
      }
    }
    loadDoctors();
  }, [patient]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName || !lastName || !dob || !phone) return;

    onSave({
      firstName,
      lastName,
      dob,
      phone,
      email,
      assignedDoctor,
      status,
    });
  }

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={mode === 'register' ? 'Register New Patient' : 'Edit Patient Record'}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700 uppercase tracking-wider">First Name *</label>
            <input
              type="text"
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Jane"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm input-focus"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700 uppercase tracking-wider">Last Name *</label>
            <input
              type="text"
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Doe"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm input-focus"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700 uppercase tracking-wider">Date of Birth *</label>
            <input
              type="date"
              required
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm input-focus"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone Number *</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 000-0000"
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm input-focus"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700 uppercase tracking-wider">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane.doe@example.com"
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm input-focus"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700 uppercase tracking-wider">Assigned Physician</label>
            <select
              value={assignedDoctor}
              onChange={(e) => setAssignedDoctor(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm input-focus"
            >
              {doctors.length === 0 && <option value="">No active doctors found</option>}
              {doctors.map(doc => (
                <option key={doc.id} value={doc.name}>{doc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-700 uppercase tracking-wider">Account Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PatientStatus)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-sm input-focus"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-teal-700 hover:to-emerald-700 transition-all"
          >
            {mode === 'register' ? 'Register Patient' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
