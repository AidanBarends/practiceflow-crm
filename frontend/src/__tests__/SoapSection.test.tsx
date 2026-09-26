import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SoapSection from '@/components/clinical/SoapSection';

// SoapSection must be a controlled component. It shows the value it is handed
// and reports every change back up, rather than holding its own copy.
describe('SoapSection', () => {
  const base = {
    label: 'Subjective',
    dotColorClass: 'bg-blue-500',
    placeholder: "Patient's reported symptoms and concerns...",
    value: '',
    onChange: vi.fn(),
  };

  it('renders the section label', () => {
    render(<SoapSection {...base} />);
    expect(screen.getByText('Subjective')).toBeInTheDocument();
  });

  it('displays the value it is given', () => {
    render(<SoapSection {...base} value="Patient reports a headache" />);
    expect(screen.getByRole('textbox')).toHaveValue('Patient reports a headache');
  });

  it('reports typing back to the parent instead of storing it', () => {
    const onChange = vi.fn();
    render(<SoapSection {...base} onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Sore throat' } });
    expect(onChange).toHaveBeenCalledWith('Sore throat');
  });

  it('hides the character count while the field is empty', () => {
    render(<SoapSection {...base} value="" />);
    expect(screen.queryByText(/chars/)).not.toBeInTheDocument();
  });

  it('shows an accurate character count once there is text', () => {
    render(<SoapSection {...base} value="Headache" />);
    expect(screen.getByText('8 chars')).toBeInTheDocument();
  });
});
