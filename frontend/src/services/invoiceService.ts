import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Invoice, CreateInvoiceData } from '@/types/invoice';

let localInvoicesMemory: Invoice[] = [];

export async function fetchInvoices(): Promise<Invoice[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [...localInvoicesMemory];
  }

  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        patients (id, name, patient_code, email),
        staff (id, name, role, department)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error for invoices, using local fallback:', error.message);
      return [...localInvoicesMemory];
    }
    
    // Merge remote and local for robust dev experience
    const remoteData = (data as Invoice[]) || [];
    const localOnly = localInvoicesMemory.filter(local => !remoteData.find(r => r.id === local.id));
    
    return [...remoteData, ...localOnly];
  } catch (err) {
    console.error('Error fetching invoices:', err);
    return [...localInvoicesMemory];
  }
}

export async function createInvoice(data: CreateInvoiceData): Promise<Invoice | null> {
  if (!isSupabaseConfigured || !supabase) {
    const newLocal: Invoice = {
      id: crypto.randomUUID(),
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    localInvoicesMemory.push(newLocal);
    return newLocal;
  }

  try {
    const { data: created, error } = await supabase
      .from('invoices')
      .insert([data])
      .select(`
        *,
        patients (id, name, patient_code, email),
        staff (id, name, role, department)
      `)
      .single();

    if (error) {
      console.warn('Supabase create error for invoices, using local fallback:', error.message);
      const newLocal: Invoice = {
        id: crypto.randomUUID(),
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localInvoicesMemory.push(newLocal);
      return newLocal;
    }

    return created as Invoice;
  } catch (err) {
    console.error('Error creating invoice:', err);
    return null;
  }
}

export async function updateInvoice(id: string, data: Partial<CreateInvoiceData>): Promise<Invoice | null> {
  if (!isSupabaseConfigured || !supabase) {
    const idx = localInvoicesMemory.findIndex(i => i.id === id);
    if (idx !== -1) {
      localInvoicesMemory[idx] = { ...localInvoicesMemory[idx], ...data, updated_at: new Date().toISOString() };
      return localInvoicesMemory[idx];
    }
    return null;
  }

  try {
    const { data: updated, error } = await supabase
      .from('invoices')
      .update(data)
      .eq('id', id)
      .select(`
        *,
        patients (id, name, patient_code, email),
        staff (id, name, role, department)
      `)
      .single();

    if (error) {
      console.warn('Supabase update error for invoices, using local fallback:', error.message);
      const idx = localInvoicesMemory.findIndex(i => i.id === id);
      if (idx !== -1) {
        localInvoicesMemory[idx] = { ...localInvoicesMemory[idx], ...data, updated_at: new Date().toISOString() };
        return localInvoicesMemory[idx];
      }
      return null;
    }

    return updated as Invoice;
  } catch (err) {
    console.error('Error updating invoice:', err);
    return null;
  }
}

export async function deleteInvoice(id: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    localInvoicesMemory = localInvoicesMemory.filter(i => i.id !== id);
    return true;
  }

  try {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Supabase delete error for invoices, using local fallback:', error.message);
      localInvoicesMemory = localInvoicesMemory.filter(i => i.id !== id);
      return true;
    }

    return true;
  } catch (err) {
    console.error('Error deleting invoice:', err);
    return false;
  }
}
