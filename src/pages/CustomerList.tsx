import React, { useState, useRef, useMemo } from 'react';
import { useAppStore } from '../store';
import { Users, Upload, Download, Plus, Search, Edit, Trash2, FileSpreadsheet } from 'lucide-react';
import { downloadCustomerTemplate, exportCustomerRecords, parseCustomerExcel } from '../utils/excel';
import CustomerRecordModal from '../components/CustomerRecordModal';
import type { CustomerRecord } from '../types';

export default function CustomerList() {
  const { customerRecords, addCustomerRecord, updateCustomerRecord, deleteCustomerRecord, importCustomerRecords } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CustomerRecord | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return customerRecords;
    return customerRecords.filter(r => 
      r.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customerRecords, searchTerm]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const records = await parseCustomerExcel(file);
      importCustomerRecords(records);
      showNotification(`Successfully imported ${records.length} records.`, 'success');
    } catch (error: any) {
      showNotification(error.toString(), 'error');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer record?')) {
      deleteCustomerRecord(id);
      showNotification('Record deleted successfully.', 'success');
    }
  };

  const handleSave = (record: CustomerRecord) => {
    if (editingRecord) {
      updateCustomerRecord(record.id, record);
      showNotification('Record updated successfully.', 'success');
    } else {
      addCustomerRecord(record);
      showNotification('Record added successfully.', 'success');
    }
    setIsModalOpen(false);
    setEditingRecord(undefined);
  };

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 transition-opacity ${
          notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {notification.message}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Customer List</h2>
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <button
            onClick={() => downloadCustomerTemplate()}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors border border-gray-300"
          >
            <Download size={16} /> Template
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors border border-gray-300"
          >
            <Upload size={16} /> Upload Excel
          </button>
          <button
            onClick={() => exportCustomerRecords(filteredRecords)}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
          >
            <FileSpreadsheet size={16} /> Export
          </button>
          <button
            onClick={() => { setEditingRecord(undefined); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            <Plus size={16} /> Add Customer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-xl border border-white shadow-sm p-5 flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-500 text-white flex-shrink-0">
            <Users size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase truncate">Total Customers</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">{customerRecords.length}</p>
          </div>
        </div>
        {/* Additional stat cards can be added here if formulas are verified later */}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-280px)] min-h-[400px]">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>
        
        {filteredRecords.length === 0 ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-gray-500">
            <Users size={48} className="text-gray-300 mb-4" />
            <p className="mb-2 font-medium">No customer records found.</p>
            <p className="text-sm">Import from Excel or add manually to get started.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left relative">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Customer Name</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Rate</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase text-right">CGST</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase text-right">SGST</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Total In</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Total</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase text-right">GST Total</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(record => (
                  <tr key={record.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-6 text-sm text-gray-800 font-medium">{record.customerName}</td>
                    <td className="py-3 px-6 text-sm text-gray-600 text-right">{record.rate !== null ? record.rate : '-'}</td>
                    <td className="py-3 px-6 text-sm text-gray-600 text-right">{record.cgst !== null ? record.cgst : '-'}</td>
                    <td className="py-3 px-6 text-sm text-gray-600 text-right">{record.sgst !== null ? record.sgst : '-'}</td>
                    <td className="py-3 px-6 text-sm text-gray-600 text-right">{record.totalIn !== null ? record.totalIn : '-'}</td>
                    <td className="py-3 px-6 text-sm text-gray-600 text-right font-medium">{record.total !== null ? record.total : '-'}</td>
                    <td className="py-3 px-6 text-sm text-gray-600 text-right font-medium">{record.gstTotal !== null ? record.gstTotal : '-'}</td>
                    <td className="py-3 px-6 flex items-center justify-center gap-2">
                      <button 
                        onClick={() => { setEditingRecord(record); setIsModalOpen(true); }}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CustomerRecordModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingRecord}
      />
    </div>
  );
}
