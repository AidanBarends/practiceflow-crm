import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NoteFooter from '@/components/clinical/NoteFooter';

// The validation rule: an encounter must not be finalisable until the note has
// an assessment and a plan. This is the regression guard for defect D2.
describe('NoteFooter validation', () => {
  const base = {
    lastSavedAt: null,
    canComplete: true,
    incompleteMessage: '',
    onDiscard: vi.fn(),
    onPreview: vi.fn(),
    onComplete: vi.fn(),
  };

  it('allows an encounter to be completed when the note is valid', () => {
    const onComplete = vi.fn();
    render(<NoteFooter {...base} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('button', { name: /complete encounter/i }));
    expect(onComplete).toHaveBeenCalled();
  });

  it('disables the complete button when required sections are missing', () => {
    render(
      <NoteFooter {...base} canComplete={false}
        incompleteMessage="Assessment and Plan must be completed before finalising." />
    );
    expect(screen.getByRole('button', { name: /complete encounter/i })).toBeDisabled();
  });

  it('does not fire onComplete while the note is incomplete', () => {
    const onComplete = vi.fn();
    render(
      <NoteFooter {...base} canComplete={false} onComplete={onComplete}
        incompleteMessage="Assessment and Plan must be completed before finalising." />
    );
    fireEvent.click(screen.getByRole('button', { name: /complete encounter/i }));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('tells the user which sections are missing', () => {
    render(
      <NoteFooter {...base} canComplete={false}
        incompleteMessage="Assessment and Plan must be completed before finalising." />
    );
    expect(screen.getByText(/Assessment and Plan must be completed/)).toBeInTheDocument();
  });

  it('still offers discard and preview on an incomplete note', () => {
    render(<NoteFooter {...base} canComplete={false} incompleteMessage="Plan must be completed before finalising." />);
    expect(screen.getByRole('button', { name: /discard draft/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /preview note/i })).toBeEnabled();
  });
});
