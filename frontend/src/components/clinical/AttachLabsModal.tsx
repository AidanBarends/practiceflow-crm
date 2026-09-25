'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { availableLabs } from '@/data/mockLabs';

interface AttachLabsModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachedLabIds: string[];
  onSave: (labIds: string[]) => void;
}

export default function AttachLabsModal({
  isOpen,
  onClose,
  attachedLabIds,
  onSave,
}: AttachLabsModalProps) {
  // Parent mounts this modal only while open, so selection starts from the current labs each time
  const [selected, setSelected] = useState<string[]>(attachedLabIds);

  function toggleLab(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((labId) => labId !== id) : [...prev, id]
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Attach Lab Results">
      <div className="flex flex-col gap-2">
        {availableLabs.map((lab) => (
          <label
            key={lab.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={selected.includes(lab.id)}
              onChange={() => toggleLab(lab.id)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">{lab.name}</p>
              <p className="text-xs text-gray-400">{lab.date}</p>
            </div>
          </label>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onSave(selected);
            onClose();
          }}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
        >
          Save
        </button>
      </div>
    </Modal>
  );
}