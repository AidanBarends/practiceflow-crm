'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthContext';
import { fetchPatients } from '@/services/patientService';
import { fetchStaffMembers } from '@/services/staffService';
import { Patient } from '@/types/patient';
import { StaffMember } from '@/types/staff';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Users, UserPlus, Activity, Calendar, FileText, Download, Clock, ChevronRight, Stethoscope } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function DashboardPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  const { profile } = useAuth();

  const userName = profile?.fullName || 'Doctor';

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        if (!isSupabaseConfigured) {
          console.warn('Supabase is not configured.');
        }
        
        const [patientsData, staffData] = await Promise.all([
          fetchPatients(),
          fetchStaffMembers()
        ]);
        setPatients(patientsData || []);
        setStaff(staffData || []);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const activePatients = patients.filter(p => p.status === 'Active').length;
  const activeStaff = staff.filter(s => s.status === 'Active').length;
  
  const [currentDateString] = useState(() =>
    new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  );

  // Helper for deterministic colors
  const getInitialsColor = (name: string) => {
    const colors = ['bg-teal-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-blue-500', 'bg-purple-500'];
    const index = name.length % colors.length;
    return colors[index];
  };

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Mock appointments removed for production
  const appointments: { time: string; patient: string; type: string; doctor: string; color: string }[] = [];

  // Determine greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ProtectedRoute>
    <AppShell>
      <div className="space-y-6 animate-fade-in pb-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="relative z-10">
            <p className="text-teal-400 font-medium text-sm mb-2">{currentDateString}</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{getGreeting()}, {userName}</h1>
            <p className="text-slate-300 max-w-xl">Here is what is happening at your practice today. You have {appointments.length} upcoming appointments.</p>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/patients" className="flex items-center justify-center gap-2 bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-teal-500/30 hover:bg-teal-50/50 transition-all text-slate-700 font-medium card-hover">
            <UserPlus className="w-5 h-5 text-teal-600" />
            <span className="text-sm">Register Patient</span>
          </Link>
          <Link href="/clinical-workspace" className="flex items-center justify-center gap-2 bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-indigo-500/30 hover:bg-indigo-50/50 transition-all text-slate-700 font-medium card-hover">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span className="text-sm">Clinical Note</span>
          </Link>
          <Link href="/staff-management" className="flex items-center justify-center gap-2 bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-emerald-500/30 hover:bg-emerald-50/50 transition-all text-slate-700 font-medium card-hover">
            <Stethoscope className="w-5 h-5 text-emerald-600" />
            <span className="text-sm">Manage Staff</span>
          </Link>
          <button onClick={() => addToast({ type: 'info', title: 'Coming Soon', message: 'Export Data feature is coming soon!' })} className="flex items-center justify-center gap-2 bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:border-blue-500/30 hover:bg-blue-50/50 transition-all text-slate-700 font-medium card-hover">
            <Download className="w-5 h-5 text-blue-600" />
            <span className="text-sm">Export Data</span>
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <Link href="/patients" className="block h-full">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-l-4 border-l-teal-500 card-hover h-full flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-slate-500 text-sm font-medium mb-1">Total Patients</p>
                  <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{isLoading ? '-' : patients.length}</h3>
                </div>
                <div className="p-3 bg-teal-50 rounded-xl">
                  <Users className="w-6 h-6 text-teal-600" />
                </div>
              </div>
              <p className="text-xs text-slate-500 flex items-center">
                <span className="text-teal-600 font-medium mr-1">{isLoading ? '-' : activePatients}</span> active patients
              </p>
            </div>
          </Link>

          {/* Card 2 */}
          <Link href="/staff-management" className="block h-full">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-l-4 border-l-indigo-500 card-hover h-full flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-slate-500 text-sm font-medium mb-1">Staff Members</p>
                  <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{isLoading ? '-' : staff.length}</h3>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl">
                  <Stethoscope className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
              <p className="text-xs text-slate-500 flex items-center">
                <span className="text-indigo-600 font-medium mr-1">{isLoading ? '-' : activeStaff}</span> active staff members
              </p>
            </div>
          </Link>

          {/* Card 3 */}
          <Link href="/clinical-workspace" className="block h-full">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-l-4 border-l-emerald-500 card-hover h-full flex flex-col justify-between">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-slate-500 text-sm font-medium mb-1">Active Encounters</p>
                  <h3 className="text-3xl font-bold text-slate-900 tracking-tight">0</h3>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl">
                  <Activity className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <p className="text-xs text-slate-500 flex items-center">
                <span className="text-emerald-600 font-medium mr-1">0</span> requiring attention
              </p>
            </div>
          </Link>
        </div>

        {/* Two-column grid below stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Column (2/3 width) - Recent Patients & Staff */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Patients */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600" />
                  Recent Patients
                </h2>
                <Link href="/patients" className="text-xs text-teal-600 font-medium hover:text-teal-700 flex items-center">
                  View all <ChevronRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
              <div className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Loading patients...</div>
                ) : patients.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No patients found.</div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {patients.slice(0, 5).map((patient) => (
                      <li key={patient.id} className="p-4 sm:px-6 hover:bg-slate-50 transition-colors table-row-hover flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shadow-inner ${getInitialsColor(patient.name)}`}>
                            {getInitials(patient.name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{patient.name}</p>
                            <p className="text-xs text-slate-500">{patient.patient_code}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            patient.status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20'
                          }`}>
                            {patient.status}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Medical Team */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-indigo-600" />
                  Medical Team
                </h2>
                <Link href="/staff-management" className="text-xs text-indigo-600 font-medium hover:text-indigo-700 flex items-center">
                  View all <ChevronRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
              <div className="p-0">
                {isLoading ? (
                  <div className="p-8 text-center text-slate-400 text-sm">Loading staff...</div>
                ) : staff.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">No staff members found.</div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {staff.slice(0, 5).map((member) => (
                      <li key={member.id} className="p-4 sm:px-6 hover:bg-slate-50 transition-colors table-row-hover flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shadow-inner ${getInitialsColor(member.name)}`}>
                            {getInitials(member.name)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                            <p className="text-xs text-slate-500">{member.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                            member.status === 'Active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' : 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-500/20'
                          }`}>
                            {member.status}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Column (1/3 width) - Upcoming Appointments */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" />
                  Upcoming Appointments
                </h2>
              </div>
              <div className="p-6">
                <div className="relative border-l border-slate-200 ml-3 space-y-6">
                  {appointments.length === 0 && (
                    <div className="text-center py-6 text-slate-500 text-sm">
                      No upcoming appointments today.
                    </div>
                  )}
                  {appointments.map((apt, idx) => (
                    <div key={idx} className="relative pl-6 animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                      <span className={`absolute -left-1.5 top-1.5 w-3 h-3 rounded-full ${apt.color} ring-4 ring-white`}></span>
                      <div className="mb-1 flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-700">{apt.time}</span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-teal-500/30 hover:bg-teal-50/50 transition-colors">
                        <p className="text-sm font-medium text-slate-900">{apt.patient}</p>
                        <p className="text-xs text-slate-500 mt-1">{apt.type} • {apt.doctor}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Link href="/scheduling" className="w-full mt-6 py-2 px-4 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors flex justify-center items-center gap-2 card-hover">
                  View Full Schedule
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
    </ProtectedRoute>
  );
}
