import { useState } from 'react';
import { useAppStore } from '../store';
import type { Settings as SettingsType } from '../types';
import { Lock, Save } from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings } = useAppStore();
  const [formData, setFormData] = useState<SettingsType>(settings);
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'startingInvoiceNumber' || name === 'defaultGstRate' 
        ? Number(value) 
        : value 
    }));
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <h2 className="text-2xl font-bold text-gray-800">Application Settings</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Locked GSTIN Section */}
        <div className="bg-red-50 border border-red-100 rounded-xl p-6">
          <div className="flex items-center gap-2 text-red-800 font-bold mb-2">
            <Lock size={18} />
            <h3>Seller GSTIN (Locked)</h3>
          </div>
          <p className="text-sm text-red-600 mb-4">
            This is the fixed GSTIN for S.D. ENTERPRISES. It cannot be modified here to prevent accidental overwrites.
          </p>
          <div className="bg-white border border-red-200 px-4 py-2 rounded-md font-mono text-lg text-gray-800 shadow-sm max-w-sm flex items-center justify-between">
            <span>{settings.sellerGstin}</span>
            <Lock size={16} className="text-gray-400" />
          </div>
        </div>

        {/* Business Details */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Business Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
              <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
              <textarea name="businessAddress" value={formData.businessAddress} onChange={handleChange} rows={2} className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" required />
            </div>
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Invoice Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Prefix</label>
              <input type="text" name="invoicePrefix" value={formData.invoicePrefix} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Starting Number</label>
              <input type="number" name="startingInvoiceNumber" value={formData.startingInvoiceNumber} onChange={handleChange} min="1" className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" required />
              <p className="text-xs text-gray-500 mt-1">Note: This only applies if no invoices have been created yet.</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Details</label>
              <textarea name="bankDetails" value={formData.bankDetails} onChange={handleChange} rows={4} className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Terms and Conditions</label>
              <textarea name="termsAndConditions" value={formData.termsAndConditions} onChange={handleChange} rows={3} className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500" required />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
            <Save size={18} />
            Save Settings
          </button>
          {saved && <span className="text-green-600 font-medium">Settings saved successfully!</span>}
        </div>
      </form>
    </div>
  );
}
