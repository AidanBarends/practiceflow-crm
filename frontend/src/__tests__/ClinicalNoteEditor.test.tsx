import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ClinicalNoteEditor from '@/components/clinical/ClinicalNoteEditor';
import { SoapNote } from '@/types/clinical';

// The editor builds its sections from a configuration array. These tests pin
// that down so a change to the array cannot silently drop a section from a
// clinical record.
describe('ClinicalNoteEditor', () => {
  const emptyNote: SoapNote = { subjective: '', objective: '', assessment: '', plan: '' };
  const base = {
    sessionDate: '9/26/2026',
    note: emptyNote,
    onChange: vi.fn(),
    attachedLabCount: 0,
    onAttachLabsClick: vi.fn(),
    onTemplatesClick: vi.fn(),
  };

  it('renders all four SOAP sections', () => {
    render(<ClinicalNoteEditor {...base} />);
    ['Subjective', 'Objective', 'Assessment', 'Plan'].forEach((s) =>
      expect(screen.getByText(s)).toBeInTheDocument()
    );
    expect(screen.getAllByRole('textbox')).toHaveLength(4);
  });

  it('shows the text held for each section', () => {
    const note: SoapNote = {
      subjective: 'Headache for four days',
      objective: 'BP 128/84',
      assessment: 'Tension headache',
      plan: 'Paracetamol, review in one week',
    };
    render(<ClinicalNoteEditor {...base} note={note} />);
    expect(screen.getByDisplayValue('Headache for four days')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tension headache')).toBeInTheDocument();
  });

  it('reports which section changed, not just the new text', () => {
    const onChange = vi.fn();
    render(<ClinicalNoteEditor {...base} onChange={onChange} />);
    fireEvent.change(screen.getAllByRole('textbox')[2], { target: { value: 'Migraine' } });
    expect(onChange).toHaveBeenCalledWith('assessment', 'Migraine');
  });

  it('shows the attached lab count when labs are attached', () => {
    render(<ClinicalNoteEditor {...base} attachedLabCount={2} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
