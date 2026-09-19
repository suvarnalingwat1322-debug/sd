import { useAppStore } from '../store';
import { FileText, DollarSign, Activity, FileCheck, Hash } from 'lucide-react';
import { format, startOfMonth, isAfter } from 'date-fns';
import { Link } from 'react-router-dom';

const STATUS_COLORS: Record<string, string> = {
  Saved: 'bg-green-100 text-green-700',
  Draft: 'bg-amber-100 text-amber-700',
  Cancelled: 'bg-red-100 text-red-600',
};

export default function Dashboard() {
  const { invoices, lastInvoiceNumber, settings } = useAppStore();

  const savedInvoices = invoices.filter(i => i.status === 'Saved');
  const totalInvoices = savedInvoices.length;

  const today = format(new Date(), 'dd/MM/yyyy');
  const todaysInvoices = savedInvoices.filter(i => i.invoiceDate === today).length;

  const thisMonthStart = startOfMonth(new Date());
  const thisMonthInvoices = savedInvoices.filter(i => {
    const parts = i.invoiceDate.split('/');
    if (parts.length === 3) {
      const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      return isAfter(date, thisMonthStart) || date.getTime() === thisMonthStart.getTime();
    }
    return false;
  });

  const currentMonthSales = thisMonthInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const currentMonthGst = thisMonthInvoices.reduce((sum, inv) => sum + inv.totalGst, 0);
  const lastInvNo = `${settings.invoicePrefix}${lastInvoiceNumber.toString().padStart(3, '0')}`;

  const stats = [
    { label: 'Total Invoices', value: totalInvoices, icon: FileText, color: 'bg-blue-500', bg: 'bg-blue-50' },
    { label: "Today's Invoices", value: todaysInvoices, icon: FileCheck, color: 'bg-green-500', bg: 'bg-green-50' },
    { label: 'Current Month Sales', value: `₹${currentMonthSales.toFixed(2)}`, icon: DollarSign, color: 'bg-purple-500', bg: 'bg-purple-50' },
    { label: 'Current Month GST', value: `₹${currentMonthGst.toFixed(2)}`, icon: Activity, color: 'bg-orange-500', bg: 'bg-orange-50' },
    { label: 'Last Invoice No.', value: lastInvNo, icon: Hash, color: 'bg-indigo-500', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <Link
          to="/create"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          + New Invoice
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`${stat.bg} rounded-xl border border-white shadow-sm p-5 flex items-center gap-4`}>
              <div className={`p-3 rounded-lg ${stat.color} text-white flex-shrink-0`}>
                <Icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase truncate">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800">Recent Invoices</h3>
          <Link to="/history" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="mb-2">No invoices created yet.</p>
            <Link to="/create" className="text-blue-600 hover:underline font-medium">Create your first invoice →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Invoice No.</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Amount</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...invoices].reverse().slice(0, 8).map(inv => (
                  <tr key={inv.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-6 font-semibold text-blue-700">{inv.invoiceNo}</td>
                    <td className="py-3 px-6 text-gray-600 text-sm">{inv.invoiceDate}</td>
                    <td className="py-3 px-6 text-gray-700 text-sm max-w-[200px] truncate">{inv.customerDetails.name}</td>
                    <td className="py-3 px-6 font-semibold text-gray-900 text-right">₹{inv.grandTotal.toFixed(2)}</td>
                    <td className="py-3 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                        {inv.status}
                      </span>
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
