'use client';

import { useEffect, useState } from 'react';
import { Plus, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Appointment, CreateAppointmentData } from '@/types/appointment';
import { Patient } from '@/types/patient';
import { StaffMember } from '@/types/staff';
import { fetchAppointments, createAppointment, updateAppointment } from '@/services/appointmentService';
import { fetchPatients } from '@/services/patientService';
import { fetchStaffMembers } from '@/services/staffService';
import CalendarView from '@/components/scheduling/CalendarView';
import AppointmentModal from '@/components/scheduling/AppointmentModal';
import { useToast } from '@/components/ui/Toast';

export default function SchedulingPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { addToast } = useToast();

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        console.log('Fetching scheduling data...');
        const [apptsData, patientsData, staffData] = await Promise.all([
          fetchAppointments(),
          fetchPatients(),
          fetchStaffMembers()
        ]);
        console.log('Fetched appts:', apptsData);
        console.log('Fetched patients:', patientsData);
        console.log('Fetched staff:', staffData);
        
        setAppointments(apptsData || []);
        setPatients(patientsData || []);
        setStaff(staffData || []);
      } catch (err) {
        console.error('Failed to load scheduling data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenNew = () => {
    setEditingAppointment(null);
    setIsModalOpen(true);
  };

  const handleEdit = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleSaveAppointment = async (data: CreateAppointmentData) => {
    try {
      const matchedPatient = patients.find(p => p.id === data.patient_id);
      const matchedStaff = staff.find(s => s.id === data.doctor_id);

      if (editingAppointment) {
        const updated = await updateAppointment(editingAppointment.id, data);
        if (updated) {
          const enrichedUpdated: Appointment = {
            ...updated,
            patients: matchedPatient ? { id: matchedPatient.id, name: matchedPatient.name, patient_code: matchedPatient.patient_code } : updated.patients,
            staff: matchedStaff ? { id: matchedStaff.id, name: matchedStaff.name, role: matchedStaff.role, department: matchedStaff.department } : updated.staff,
          };
          setAppointments(prev => prev.map(a => a.id === enrichedUpdated.id ? enrichedUpdated : a));
          addToast({
            type: 'success',
            title: 'Appointment Updated',
            message: 'The appointment has been successfully updated.',
          });
        }
      } else {
        const created = await createAppointment(data);
        if (created) {
          const enrichedCreated: Appointment = {
            ...created,
            patients: matchedPatient ? { id: matchedPatient.id, name: matchedPatient.name, patient_code: matchedPatient.patient_code } : created.patients,
            staff: matchedStaff ? { id: matchedStaff.id, name: matchedStaff.name, role: matchedStaff.role, department: matchedStaff.department } : created.staff,
          };
          setAppointments(prev => [...prev, enrichedCreated]);
          addToast({
            type: 'success',
            title: 'Appointment Scheduled',
            message: 'New appointment successfully created.',
          });
        }
      }
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Failed to save appointment.',
      });
      throw err;
    }
  };

  const nextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const prevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const getRelativeDateLabel = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return null;
  };

  const relativeLabel = getRelativeDateLabel(currentDate);
  const shortDate = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const longDate = currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <ProtectedRoute>
    <AppShell>
      <div className="flex h-[calc(100vh-8rem)] flex-col space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Scheduling</h1>
            <p className="text-sm text-slate-500">
              Manage patient appointments and doctor schedules.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
                Jump to Today
              </button>
              <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                <button onClick={prevDay} className="px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">&larr;</button>
                <div className="px-3 py-1 text-sm font-semibold text-slate-800 w-28 text-center truncate">
                  {relativeLabel || shortDate}
                </div>
                <button onClick={nextDay} className="px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">&rarr;</button>
              </div>
            </div>
            
            <button
              onClick={handleOpenNew}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-teal-600 hover:to-emerald-700 transition-all card-hover"
            >
              <Plus size={18} />
              New Appointment
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between shrink-0 text-slate-800 font-semibold text-lg">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-teal-600" />
            {relativeLabel ? `${relativeLabel}, ${shortDate}` : longDate}
          </div>
        </div>

        {/* Main Content */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
             <div className="flex flex-col items-center text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-teal-500 mb-4" />
                <p>Loading schedule...</p>
             </div>
          </div>
        ) : (
          <CalendarView 
            appointments={appointments} 
            currentDate={currentDate} 
            onEditAppointment={handleEdit} 
            patients={patients}
            staff={staff}
          />
        )}
      </div>

      {isModalOpen && (
        <AppointmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveAppointment}
          patients={patients}
          staff={staff}
          initialData={editingAppointment}
        />
      )}
    </AppShell>
    </ProtectedRoute>
  );
}
