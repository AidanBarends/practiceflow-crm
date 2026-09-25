'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Loader2 } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Invoice } from '@/types/invoice';
import { fetchInvoices, deleteInvoice } from '@/services/invoiceService';
import InvoiceModal from '@/components/billing/InvoiceModal';
import PrintableInvoiceSlip from '@/components/billing/PrintableInvoiceSlip';
import { useToast } from '@/components/ui/Toast';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  
  // Printing state
  const [invoiceToPrint, setInvoiceToPrint] = useState<Invoice | null>(null);

  const { addToast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchInvoices();
    setInvoices(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInvoices().then((data) => {
      setInvoices(data);
      setIsLoading(false);
    });
  }, []);

  const handleOpenNew = () => {
    setEditingInvoice(null);
    setIsModalOpen(true);
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    
    const success = await deleteInvoice(id);
    if (success) {
      setInvoices(prev => prev.filter(i => i.id !== id));
      addToast({ type: 'success', title: 'Deleted', message: 'Invoice deleted successfully.' });
    } else {
      addToast({ type: 'error', title: 'Error', message: 'Failed to delete invoice.' });
    }
  };

  const handlePrint = (invoice: Invoice) => {
    setInvoiceToPrint(invoice);
    // Wait for state to update and DOM to render the printable area
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const filteredInvoices = invoices.filter(inv => {
    const search = searchQuery.toLowerCase();
    const pName = inv.patients?.name?.toLowerCase() || '';
    const pCode = inv.patients?.patient_code?.toLowerCase() || '';
    
    const matchesSearch = pName.includes(search) || pCode.includes(search);
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-emerald-100 text-emerald-800';
      case 'Pending': return 'bg-amber-100 text-amber-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      case 'Cancelled': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <ProtectedRoute allowedRoles={['Doctor', 'Admin']}>
    <>
      <div className="print-only">
        {invoiceToPrint && <PrintableInvoiceSlip invoice={invoiceToPrint} />}
      </div>
      
      <div className="no-print h-full">
        <AppShell>
          <div className="flex h-[calc(100vh-8rem)] flex-col space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing & Invoices</h1>
                <p className="text-sm text-slate-500">
                  Manage patient payments and generate invoice slips.
                </p>
              </div>
              <button
                onClick={handleOpenNew}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-teal-600 hover:to-emerald-700 transition-all card-hover"
              >
                <Plus size={18} />
                Create Invoice
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
              <div className="relative w-full sm:max-w-md border border-slate-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 transition-all">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by patient name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full border-0 bg-transparent py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-0"
                />
              </div>
              
              <div className="flex gap-2">
                {['All', 'Pending', 'Paid', 'Overdue'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      statusFilter === status
                        ? 'bg-slate-900 border-slate-900 text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content */}
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col items-center text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-500 mb-4" />
                  <p>Loading invoices...</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col">
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/80 text-xs uppercase text-slate-500 sticky top-0 backdrop-blur-sm z-10">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Patient</th>
                        <th className="px-6 py-4 font-semibold">Amount</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Due Date</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredInvoices.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                            No invoices found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredInvoices.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-900">{invoice.patients?.name || 'Unknown Patient'}</div>
                              <div className="text-xs text-slate-500">{invoice.patients?.patient_code}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-semibold text-slate-900 flex items-center">
                                <span className="mr-1 text-slate-500 font-normal">R</span>
                                {invoice.amount.toFixed(2)}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                {invoice.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              {new Date(invoice.due_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handlePrint(invoice)}
                                  className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                  title="Print Slip"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleEdit(invoice)}
                                  className="text-teal-600 hover:text-teal-700 text-sm font-medium px-2 py-1 rounded hover:bg-teal-50 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(invoice.id)}
                                  className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {isModalOpen && <InvoiceModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={async () => {
              await loadData();
              setIsModalOpen(false);
            }}
            initialData={editingInvoice}
          />}
        </AppShell>
      </div>
    </>
    </ProtectedRoute>
  );
}
