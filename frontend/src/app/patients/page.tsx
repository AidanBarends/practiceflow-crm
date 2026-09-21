'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  MoreHorizontal,
  Pencil,
  Phone,
  Search,
  ToggleLeft,
  Trash2,
  UserPlus,
  UserCircle,
  Download,
  Stethoscope,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { Patient, PatientStatus } from '@/types/patient';
import {
  fetchPatients,
  createPatient,
  updatePatient,
  deletePatient as removePatientApi,
} from '@/services/patientService';
import { PatientFormModal, PatientFormValues } from '@/components/patient/PatientFormModal';
import { useToast } from '@/components/ui/Toast';
import { exportPatientsToCsv } from '@/lib/exportCsv';

type StatusFilter = 'All' | PatientStatus;

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 90%)`;
}

function getAvatarTextColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 30%)`;
}

function StatusBadge({ status }: { status: PatientStatus }) {
  const isActive = status === 'Active';
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
        isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
      {status}
    </span>
  );
}

function initials(name: string) {
  const [last, first] = name.split(',').map((p) => p.trim());
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || 'PT';
}

export default function PatientDirectoryPage() {
  const [patientList, setPatientList] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [providerFilter, setProviderFilter] = useState('All Providers');

  const [modalMode, setModalMode] = useState<'register' | 'edit' | null>(null);
  const [activePatient, setActivePatient] = useState<Patient | undefined>();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  
  const { addToast } = useToast();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await fetchPatients();
        setPatientList(data);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!openMenuId) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const filtered = useMemo(() => {
    return patientList.filter((p) => {
      const matchesQuery =
        query.trim() === '' ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.patient_code.toLowerCase().includes(query.toLowerCase()) ||
        p.phone.includes(query);
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesProvider =
        providerFilter === 'All Providers' || p.assignedDoctor === providerFilter;
      return matchesQuery && matchesStatus && matchesProvider;
    });
  }, [patientList, query, statusFilter, providerFilter]);

  const activeCount = patientList.filter(p => p.status === 'Active').length;
  const inactiveCount = patientList.length - activeCount;

  function clearFilters() {
    setQuery('');
    setStatusFilter('All');
    setProviderFilter('All Providers');
  }

  function openRegisterModal() {
    setActivePatient(undefined);
    setModalMode('register');
  }

  function openEditModal(patient: Patient) {
    setActivePatient(patient);
    setModalMode('edit');
    setOpenMenuId(null);
  }

  function closeModal() {
    setModalMode(null);
    setActivePatient(undefined);
  }

  async function toggleStatus(patient: Patient) {
    const newStatus: PatientStatus = patient.status === 'Active' ? 'Inactive' : 'Active';
    setOpenMenuId(null);
    setPatientList((list) =>
      list.map((p) => (p.id === patient.id ? { ...p, status: newStatus } : p))
    );
    await updatePatient(patient.id, { status: newStatus });
    addToast({
      type: 'info',
      title: 'Status Updated',
      message: `${patient.name} marked as ${newStatus}`
    });
  }

  async function handleDelete(patient: Patient) {
    setOpenMenuId(null);
    const confirmed = window.confirm(
      `Remove ${patient.name} (${patient.patient_code}) from directory?`
    );
    if (!confirmed) return;

    setPatientList((list) => list.filter((p) => p.id !== patient.id));
    await removePatientApi(patient.id);
    addToast({
      type: 'info',
      title: 'Patient Removed',
      message: `Record removed from directory`
    });
  }

  async function handleSave(values: PatientFormValues) {
    const name = `${values.lastName.trim()}, ${values.firstName.trim()}`;

    if (modalMode === 'edit' && activePatient) {
      setPatientList((list) =>
        list.map((p) =>
          p.id === activePatient.id
            ? {
                ...p,
                name,
                dob: values.dob,
                phone: values.phone,
                email: values.email,
                assignedDoctor: values.assignedDoctor,
                status: values.status,
              }
            : p
        )
      );
      await updatePatient(activePatient.id, {
        name,
        dob: values.dob,
        phone: values.phone,
        email: values.email,
        assignedDoctor: values.assignedDoctor,
        status: values.status,
      });
      addToast({
        type: 'success',
        title: 'Record Updated',
        message: `${name} profile saved`
      });
    } else {
      const created = await createPatient({
        name,
        dob: values.dob,
        phone: values.phone,
        email: values.email,
        assignedDoctor: values.assignedDoctor,
        lastVisit: new Date().toISOString().slice(0, 10),
        status: values.status,
      });
      setPatientList((list) => [created, ...list]);
      addToast({
        type: 'success',
        title: 'Patient Registered',
        message: `${name} added to directory`
      });
    }
    closeModal();
  }

  return (
    <ProtectedRoute>
    <AppShell>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Patient Directory</h1>
            <p className="text-sm text-gray-500">
              Manage clinical patient records, contact profiles, and physician assignments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportPatientsToCsv(patientList)}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-all card-hover"
            >
              <Download size={16} />
              Export Data
            </button>
            <button
              onClick={openRegisterModal}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:from-teal-600 hover:to-emerald-700 transition-all card-hover"
            >
              <UserPlus size={16} />
              Register New Patient
            </button>
          </div>
        </div>

        {/* Count Summary Bar */}
        <div className="flex items-center gap-3 text-xs font-medium text-gray-600 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm">
          <span>Showing {filtered.length} of {patientList.length} patients</span>
          <span className="text-gray-300">&bull;</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 pulse-dot"></span>{activeCount} Active</span>
          <span className="text-gray-300">&bull;</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>{inactiveCount} Inactive</span>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Search patient by name, ID code, or phone..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 input-focus transition-all"
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
            {(['All', 'Active', 'Inactive'] as StatusFilter[]).map((option) => (
              <button
                key={option}
                onClick={() => setStatusFilter(option)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === option ? 'bg-teal-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-gray-700 input-focus transition-all shadow-sm"
          >
            <option>All Providers</option>
            <option>Dr. Sarah Smith</option>
            <option>Dr. Robert Wilson</option>
            <option>Dr. Emily Blunt</option>
          </select>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-visible animate-slide-up">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-1/5 bg-gray-100 rounded animate-pulse"></div>
                  </div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3.5">Patient Name & Code</th>
                  <th className="px-5 py-3.5">Date of Birth</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Assigned Physician</th>
                  <th className="px-5 py-3.5">Last Visit</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((patient) => (
                  <tr key={patient.id} className="table-row-hover bg-white">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div 
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm"
                          style={{ 
                            backgroundColor: getAvatarColor(patient.name),
                            color: getAvatarTextColor(patient.name)
                          }}
                        >
                          {initials(patient.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{patient.name}</div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">{patient.patient_code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      <span className="flex items-center gap-1.5 text-xs">
                        <Calendar size={14} className="text-gray-400" />
                        {patient.dob}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      <span className="flex items-center gap-1.5 text-xs">
                        <Phone size={14} className="text-gray-400" />
                        {patient.phone}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-gray-700">
                      <span className="inline-flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 text-xs">
                        {patient.assignedDoctor}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 text-xs">{patient.lastVisit}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={patient.status} />
                    </td>
                    <td className="relative px-5 py-3.5 text-right">
                      <button
                        onClick={() => setOpenMenuId((id) => (id === patient.id ? null : patient.id))}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors focus:outline-none"
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {openMenuId === patient.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-8 top-10 z-20 w-48 rounded-xl border border-gray-100 bg-white py-1.5 text-left shadow-xl animate-fade-in"
                        >
                          <button
                            onClick={() => router.push(`/clinical-workspace?patientId=${patient.id}`)}
                            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
                          >
                            <Stethoscope size={14} />
                            Start Clinical Note
                          </button>
                          <button
                            onClick={() => openEditModal(patient)}
                            className="flex w-full items-center gap-2.5 border-t border-gray-100 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors"
                          >
                            <Pencil size={14} />
                            Edit record
                          </button>
                          <button
                            onClick={() => toggleStatus(patient)}
                            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-teal-600 transition-colors"
                          >
                            <ToggleLeft size={14} />
                            Mark {patient.status === 'Active' ? 'Inactive' : 'Active'}
                          </button>
                          <button
                            onClick={() => handleDelete(patient)}
                            className="flex w-full items-center gap-2.5 border-t border-gray-100 px-3.5 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors mt-1"
                          >
                            <Trash2 size={14} />
                            Delete record
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                
                {filtered.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center">
                          <UserCircle size={24} className="text-gray-400" />
                        </div>
                        <div className="text-gray-900 font-medium">No patients found</div>
                        <p className="text-gray-500 text-sm max-w-sm">
                          We couldn't find any patient records matching your current filters and search query.
                        </p>
                        <button
                          onClick={clearFilters}
                          className="mt-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                        >
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalMode && (
        <PatientFormModal
          mode={modalMode}
          patient={activePatient}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </AppShell>
    </ProtectedRoute>
  );
}
