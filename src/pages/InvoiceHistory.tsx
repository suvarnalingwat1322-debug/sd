import { useState } from 'react';
import { useAppStore } from '../store';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Trash2, Search, Edit2, Eye } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  Saved: 'bg-green-100 text-green-700',
  Draft: 'bg-amber-100 text-amber-700',
  Cancelled: 'bg-red-100 text-red-600',
};

export default function InvoiceHistory() {
  const { invoices, deleteInvoice } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const navigate = useNavigate();

  const filtered = [...invoices]
    .reverse()
    .filter(inv => {
      const matchSearch =
        inv.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerDetails.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });

  const handleDelete = (id: string, invoiceNo: string) => {
    if (window.confirm(`Delete invoice ${invoiceNo}? The invoice number will NOT be reused.`)) {
      deleteInvoice(id);
    }
  };

  const handleDuplicate = (id: string) => {
    navigate(`/create?duplicate=${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/create?edit=${id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Invoice History</h2>
          <p className="text-sm text-gray-500 mt-0.5">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} total</p>
        </div>
        <Link
          to="/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          + New Invoice
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            id="invoice-search"
            type="text"
            placeholder="Search by invoice no. or customer..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-full text-sm"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Saved', 'Draft', 'Cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-lg font-medium mb-2">No invoices found</p>
            {invoices.length === 0 ? (
              <Link to="/create" className="text-blue-600 hover:underline font-medium">
                Create your first invoice →
              </Link>
            ) : (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('All'); }}
                className="text-blue-600 hover:underline font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Invoice No.</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">GSTIN</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-right">Taxable</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-right">GST</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-right">Total</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-blue-700">{inv.invoiceNo}</td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{inv.invoiceDate}</td>
                    <td className="py-3 px-4 text-gray-800 font-medium max-w-[180px] truncate" title={inv.customerDetails.name}>
                      {inv.customerDetails.name}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs font-mono">{inv.customerDetails.gstin || '-'}</td>
                    <td className="py-3 px-4 text-gray-700 text-right text-sm">₹{inv.totalTaxableValue.toFixed(2)}</td>
                    <td className="py-3 px-4 text-gray-700 text-right text-sm">₹{inv.totalGst.toFixed(2)}</td>
                    <td className="py-3 px-4 font-bold text-gray-900 text-right">₹{inv.grandTotal.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1">
                        <button
                          title="Edit"
                          onClick={() => handleEdit(inv.id)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          title="View / Print"
                          onClick={() => handleEdit(inv.id)}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          title="Duplicate"
                          onClick={() => handleDuplicate(inv.id)}
                          className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded transition-colors"
                        >
                          <Copy size={15} />
                        </button>
                        <button
                          title="Delete"
                          onClick={() => handleDelete(inv.id, inv.invoiceNo)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
