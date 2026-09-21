import { useMemo } from 'react';
import { Appointment } from '@/types/appointment';
import { Patient } from '@/types/patient';
import { StaffMember } from '@/types/staff';
import { Clock, User, Stethoscope } from 'lucide-react';

interface CalendarViewProps {
  appointments: Appointment[];
  currentDate: Date;
  onEditAppointment: (appointment: Appointment) => void;
  patients?: Patient[];
  staff?: StaffMember[];
}

export default function CalendarView({
  appointments,
  currentDate,
  onEditAppointment,
  patients = [],
  staff = [],
}: CalendarViewProps) {
  // Simple daily view showing slots from 8 AM to 6 PM
  const hours = Array.from({ length: 11 }, (_, i) => i + 8);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-teal-50/90 border-teal-200 text-teal-900';
      case 'Completed': return 'bg-emerald-50/90 border-emerald-200 text-emerald-900';
      case 'Cancelled': return 'bg-red-50/90 border-red-200 text-red-900';
      case 'No Show': return 'bg-orange-50/90 border-orange-200 text-orange-900';
      default: return 'bg-slate-50 border-slate-200 text-slate-800';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'bg-teal-500';
      case 'Completed': return 'bg-emerald-500';
      case 'Cancelled': return 'bg-red-500';
      case 'No Show': return 'bg-orange-500';
      default: return 'bg-slate-400';
    }
  };

  // Filter appointments for current date
  const todaysAppointments = useMemo(() => {
    return appointments.filter(app => {
      const appDate = new Date(app.start_time);
      return (
        appDate.getDate() === currentDate.getDate() &&
        appDate.getMonth() === currentDate.getMonth() &&
        appDate.getFullYear() === currentDate.getFullYear()
      );
    });
  }, [appointments, currentDate]);

  return (
    <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-[100px_1fr] divide-x divide-slate-100">
        <div className="bg-slate-50/50 py-4 text-center text-sm font-semibold text-slate-500">
          Time
        </div>
        <div className="bg-slate-50/50 py-4 px-6 text-sm font-semibold text-slate-700">
          Appointments
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {hours.map(hour => {
          // Find appointments starting in this hour block
          const hourApps = todaysAppointments.filter(app => {
            const start = new Date(app.start_time);
            return start.getHours() === hour;
          });

          return (
            <div key={hour} className="grid min-h-[100px] grid-cols-[100px_1fr] divide-x divide-slate-100 group">
              <div className="flex items-start justify-center pt-4 text-xs font-medium text-slate-400">
                {hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`}
              </div>
              <div className="relative p-2 flex gap-2 overflow-x-auto">
                <div className="absolute inset-0 bg-slate-50/0 group-hover:bg-slate-50/50 transition-colors pointer-events-none" />
                
                {hourApps.length === 0 ? (
                   <div className="flex items-center justify-center w-full h-full opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-xs text-slate-400 font-medium">Available</span>
                   </div>
                ) : (
                  hourApps.map(app => {
                    const start = new Date(app.start_time);
                    const end = new Date(app.end_time);
                    const durationMins = (end.getTime() - start.getTime()) / 60000;

                    // Resolve patient from app.patients or fallback to patients list
                    const matchedPatient = app.patients || patients.find(p => p.id === app.patient_id);
                    const patientName = matchedPatient?.name || 'Unknown Patient';

                    // Resolve doctor from app.staff or fallback to staff list
                    const matchedStaff = app.staff || staff.find(s => s.id === app.doctor_id);
                    const doctorRawName = matchedStaff?.name || app.staff?.name;
                    const doctorDisplayName = doctorRawName
                      ? (doctorRawName.startsWith('Dr.') ? doctorRawName : `Dr. ${doctorRawName}`)
                      : 'Dr. Unassigned';
                    
                    return (
                      <div
                        key={app.id}
                        onClick={() => onEditAppointment(app)}
                        className={`relative z-10 flex min-w-[260px] cursor-pointer flex-col rounded-xl border p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${getStatusColor(app.status)}`}
                        style={{
                          height: Math.max(85, (durationMins / 60) * 105) + 'px'
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold">
                            <Clock className="h-3 w-3 opacity-70" />
                            {start.toTimeString().slice(0, 5)} - {end.toTimeString().slice(0, 5)}
                          </div>
                          <div className="flex items-center gap-1.5 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm shadow-xs">
                            <div className={`h-1.5 w-1.5 rounded-full ${getStatusDot(app.status)}`} />
                            {app.status}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                          <User className="h-3.5 w-3.5 text-teal-700 opacity-80 shrink-0" />
                          <span className="truncate">{patientName}</span>
                          {matchedPatient?.patient_code && (
                            <span className="text-[10px] text-teal-800/70 font-normal shrink-0">
                              ({matchedPatient.patient_code})
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-auto pt-2 text-[11px] opacity-85 flex justify-between items-center border-t border-black/5">
                          <span className="truncate max-w-[140px] flex items-center gap-1 font-medium">
                            <Stethoscope className="h-3 w-3 opacity-70 shrink-0" />
                            {doctorDisplayName}
                          </span>
                          {app.reason && (
                            <span className="truncate max-w-[90px] bg-white/60 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-700">
                              {app.reason}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
