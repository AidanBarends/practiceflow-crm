'use client';

import { useState } from 'react';
import { Activity, Clock, Thermometer, AlertTriangle, Pencil } from 'lucide-react';
import { Patient, Vitals } from '@/types/clinical';

interface PatientContextBarProps {
  patient: Patient;
  vitals: Vitals;
  onVitalsChange: (field: keyof Vitals, value: string) => void;
}

interface EditableVitalProps {
  label: string;
  field: keyof Vitals;
  value: string;
  icon: React.ReactNode;
  onChange: (field: keyof Vitals, value: string) => void;
}

function EditableVital({ label, field, value, icon, onChange }: EditableVitalProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    onChange(field, draft.trim() || value);
    setEditing(false);
  }

  return (
    <div className="group flex items-center gap-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm text-gray-600">
      {icon}
      <span className="font-semibold text-gray-800">{label}</span>
      {editing ? (
        <input
          autoFocus
          className="ml-1 w-24 rounded border border-teal-300 bg-white px-1.5 py-0.5 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-teal-400"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setDraft(value); setEditing(false); }
          }}
        />
      ) : (
        <button
          onClick={() => { setDraft(value); setEditing(true); }}
          className="ml-1 flex items-center gap-1 rounded hover:text-teal-600 transition-colors"
          title={`Edit ${label}`}
        >
          <span>{value || <span className="italic text-gray-400">—</span>}</span>
          <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity" />
        </button>
      )}
    </div>
  );
}

export default function PatientContextBar({ patient, vitals, onVitalsChange }: PatientContextBarProps) {
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Patient Info */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-lg font-bold text-white shadow-sm">
            {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">{patient.name}</h1>
              <span className="text-sm text-gray-400">
                {patient.age}y · {patient.gender}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-3 text-xs">
              <span className="font-mono text-gray-400">ID: {patient.patientId}</span>
              {patient.allergies.length > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 font-semibold text-red-600 border border-red-200">
                  <AlertTriangle className="h-3 w-3" />
                  Allergies: {patient.allergies.join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Editable Vitals */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
            Vitals <span className="normal-case font-normal">(click to edit)</span>
          </div>
          <EditableVital
            label="BP"
            field="bloodPressure"
            value={vitals.bloodPressure}
            icon={<Activity className="h-4 w-4 text-rose-400" />}
            onChange={onVitalsChange}
          />
          <EditableVital
            label="HR"
            field="heartRate"
            value={vitals.heartRate}
            icon={<Clock className="h-4 w-4 text-blue-400" />}
            onChange={onVitalsChange}
          />
          <EditableVital
            label="Temp"
            field="temperature"
            value={vitals.temperature}
            icon={<Thermometer className="h-4 w-4 text-amber-400" />}
            onChange={onVitalsChange}
          />

          {patient.isActiveEncounter && (
            <span className="flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500 pulse-dot" />
              Active Encounter
            </span>
          )}
        </div>
      </div>
    </div>
  );
}