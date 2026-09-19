import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '../store';
import type { Invoice, InvoiceItem, Customer } from '../types';
import { format } from 'date-fns';
import { numberToIndianWords } from '../utils/indianWords';
import { calculateItemTaxes } from '../utils/gstCalc';
import InvoicePreview from '../components/InvoicePreview';
import {
  Save, Plus, Trash2, Download, Printer, Lock, AlertCircle, CheckCircle, FileText
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const GST_RATES = [0, 5, 12, 18, 28];

function blankCustomer(): Customer {
  return {
    id: crypto.randomUUID(),
    name: '',
    address: '',
    shippingAddress: '',
    gstin: '',
    state: 'Maharashtra',
    stateCode: '27',
    mobile: '',
    email: ''
  };
}

function blankItem(defaultGst: number): InvoiceItem {
  return {
    id: crypto.randomUUID(),
    description: '',
    hsn: '220110',
    cardNo: '',
    quantity: 1,
    unit: 'Nos',
    rate: 0,
    discount: 0,
    taxableValue: 0,
    gstPercent: defaultGst,
    cgst: 0,
    sgst: 0,
    igst: 0,
    total: 0
  };
}

function blankInvoice(invoiceNo: string): Partial<Invoice> {
  return {
    id: crypto.randomUUID(),
    invoiceNo,
    invoiceDate: format(new Date(), 'dd/MM/yyyy'),
    isInterState: false,
    status: 'Draft',
    items: [],
    customerDetails: blankCustomer(),
    totalTaxableValue: 0,
    totalDiscount: 0,
    totalCgst: 0,
    totalSgst: 0,
    totalIgst: 0,
    totalGst: 0,
    roundOff: 0,
    grandTotal: 0,
    amountInWords: '',
    customerId: ''
  };
}

export default function CreateInvoice() {
  const location = useLocation();
  const { settings, getNextInvoiceNumber, saveInvoice, invoices } = useAppStore();
  const previewRef = useRef<HTMLDivElement | null>(null);

  const searchParams = new URLSearchParams(location.search);
  const duplicateId = searchParams.get('duplicate');
  const editId = searchParams.get('edit');

  const [invoice, setInvoice] = useState<Partial<Invoice>>(() =>
    blankInvoice(getNextInvoiceNumber())
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');

  // Load for duplicate or edit
  useEffect(() => {
    if (duplicateId) {
      const source = invoices.find(i => i.id === duplicateId);
      if (source) {
        setInvoice({
          ...source,
          id: crypto.randomUUID(),
          invoiceNo: getNextInvoiceNumber(),
          invoiceDate: format(new Date(), 'dd/MM/yyyy'),
          status: 'Draft',
          items: source.items.map(item => ({ ...item, id: crypto.randomUUID() }))
        });
      }
    } else if (editId) {
      const source = invoices.find(i => i.id === editId);
      if (source) {
        setInvoice({ ...source });
      }
    }
  }, [duplicateId, editId]);

  // Recalculate totals whenever items or isInterState changes
  useEffect(() => {
    let totalTaxableValue = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const items = invoice.items || [];

    items.forEach(item => {
      totalTaxableValue += item.taxableValue;
      totalCgst += item.cgst;
      totalSgst += item.sgst;
      totalIgst += item.igst;
    });

    const totalGst = totalCgst + totalSgst + totalIgst;
    const rawTotal = totalTaxableValue + totalGst;
    const grandTotal = Math.round(rawTotal);
    const roundOff = Number((grandTotal - rawTotal).toFixed(2));
    const amountInWords = numberToIndianWords(grandTotal);

    setInvoice(prev => ({
      ...prev,
      totalTaxableValue,
      totalCgst,
      totalSgst,
      totalIgst,
      totalGst,
      grandTotal,
      roundOff,
      amountInWords
    }));
  }, [invoice.items, invoice.transactionType]);

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInvoice(prev => ({
      ...prev,
      customerDetails: {
        ...(prev.customerDetails as Customer),
        [name]: value
      }
    }));
    setErrors([]);
  };

  const handleItemChange = useCallback((index: number, field: keyof InvoiceItem, value: string | number) => {
    setInvoice(prev => {
      const newItems = [...(prev.items || [])];
      const item = { ...newItems[index], [field]: value };

      if (['rate', 'quantity', 'discount', 'gstPercent'].includes(field as string)) {
        const taxes = calculateItemTaxes(
          Number(item.rate || 0),
          Number(item.quantity || 0),
          Number(item.discount || 0),
          Number(item.gstPercent || settings.defaultGstRate),
          prev.transactionType || 'intra-state'
        );
        Object.assign(item, taxes);
      }

      newItems[index] = item;
      return { ...prev, items: newItems };
    });
  }, [settings.defaultGstRate, invoice.transactionType]);

  const handleTransactionTypeChange = (transactionType: 'intra-state' | 'inter-state' | 'non-gst') => {
    setInvoice(prev => {
      const newItems = (prev.items || []).map(item => ({
        ...item,
        ...calculateItemTaxes(item.rate, item.quantity, item.discount, item.gstPercent, transactionType)
      }));
      return { ...prev, transactionType, items: newItems };
    });
  };

  const addItem = () => {
    setInvoice(prev => ({
      ...prev,
      items: [...(prev.items || []), blankItem(settings.defaultGstRate)]
    }));
  };

  const removeItem = (index: number) => {
    setInvoice(prev => {
      const newItems = [...(prev.items || [])];
      newItems.splice(index, 1);
      return { ...prev, items: newItems };
    });
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!invoice.customerDetails?.name?.trim()) errs.push('Please enter customer name.');
    if (!invoice.customerDetails?.address?.trim()) errs.push('Please enter customer address.');
    if (!invoice.items || invoice.items.length === 0) errs.push('Please add at least one item.');
    invoice.items?.forEach((item, i) => {
      if (!item.description?.trim()) errs.push(`Item ${i + 1}: Please enter description.`);
      if (Number(item.quantity) <= 0) errs.push(`Item ${i + 1}: Quantity must be greater than 0.`);
      if (Number(item.rate) <= 0) errs.push(`Item ${i + 1}: Rate must be greater than 0.`);
    });
    return errs;
  };

  const doSave = (status: 'Draft' | 'Saved') => {
    const errs = validate();
    if (status === 'Saved' && errs.length > 0) {
      setErrors(errs);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    saveInvoice({ ...invoice, status, customerId: invoice.customerDetails?.id || '' } as Invoice);
    setErrors([]);
    return true;
  };

  const handleSaveDraft = () => {
    doSave('Draft');
    setSuccessMsg('Invoice saved as Draft!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSave = () => {
    if (doSave('Saved')) {
      setSuccessMsg('Invoice saved successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleSaveAndNew = () => {
    if (!doSave('Saved')) return;
    // Generate next number and reset
    const nextNo = getNextInvoiceNumber();
    setInvoice(blankInvoice(nextNo));
    setSuccessMsg('Invoice saved! New invoice ready.');
    setTimeout(() => setSuccessMsg(''), 3000);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrint = () => window.print();

  const handlePdfExport = async () => {
    if (!previewRef.current) return;
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${invoice.invoiceNo}.pdf`);
    } catch (e) {
      console.error(e);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleExcelExport = () => {
    if (!invoice.customerDetails || !invoice.items) return;

    const wsData: (string | number)[][] = [
      ['', 'TAX INVOICE'],
      ['', settings.businessName],
      ['', settings.businessAddress],
      ['', `Ph.No. ${settings.phone}`],
      ['', settings.email],
      ['Billing Address:', '', 'DATE', invoice.invoiceDate || ''],
      [invoice.customerDetails.name, '', 'INVOICE NO.', invoice.invoiceNo || ''],
      [invoice.customerDetails.address, '', 'GST NO.', settings.sellerGstin],
      [`GST: ${invoice.customerDetails.gstin}`, '', 'HSN NO.', invoice.items[0]?.hsn || ''],
      [],
      ['Sr.no', 'DESCRIPTION OF GOODS', 'CARD NO', 'QUANTITY', 'RATE', 'AMOUNT']
    ];

    invoice.items.forEach((item, index) => {
      wsData.push([
        index + 1,
        item.description,
        item.cardNo || '',
        item.quantity,
        item.rate,
        item.taxableValue
      ]);
    });

    wsData.push(['', '', '', '', 'Taxable Amount', invoice.totalTaxableValue || 0]);

    if (invoice.transactionType === 'non-gst') {
      // No GST rows
    } else if (invoice.transactionType === 'inter-state' || invoice.isInterState) {
      wsData.push(['', '', '', '', 'IGST', invoice.totalIgst || 0]);
    } else {
      wsData.push(['', '', '', '', 'CGST', invoice.totalCgst || 0]);
      wsData.push(['', '', '', '', 'SGST', invoice.totalSgst || 0]);
    }

    wsData.push(['', '', '', '', 'Round Off', invoice.roundOff || 0]);
    wsData.push(['TOTAL AMOUNT', '', '', '', '', invoice.grandTotal || 0]);
    wsData.push([`IN WORDS: ${invoice.amountInWords?.toUpperCase() || ''}`]);
    wsData.push(['BANK DETAILS', '', 'For ' + settings.businessName]);
    settings.bankDetails.split('\n').forEach(line => wsData.push([line]));

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
    XLSX.writeFile(wb, `${invoice.invoiceNo}.xlsx`);
  };

  const totalTaxable = invoice.totalTaxableValue || 0;
  const totalCgst = invoice.totalCgst || 0;
  const totalSgst = invoice.totalSgst || 0;
  const totalIgst = invoice.totalIgst || 0;
  const roundOff = invoice.roundOff || 0;
  const grandTotal = invoice.grandTotal || 0;

  return (
    <div className="flex flex-col xl:flex-row gap-6 pb-16">
      {/* ====== LEFT: FORM ====== */}
      <div className="flex-1 min-w-0 space-y-5 no-print">

        {/* Page Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Create GST Invoice</h2>
            <p className="text-sm text-gray-500 mt-0.5">Fill in details below. Live preview updates on the right.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              id="btn-save-draft"
              onClick={handleSaveDraft}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
            >
              <FileText size={16} /> Save Draft
            </button>
            <button
              id="btn-save"
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              <Save size={16} /> Save Invoice
            </button>
            <button
              id="btn-save-new"
              onClick={handleSaveAndNew}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
            >
              <Plus size={16} /> Save &amp; New Invoice
            </button>
          </div>
        </div>

        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
              <AlertCircle size={18} /> Please fix the following errors:
            </div>
            <ul className="list-disc list-inside text-sm text-red-600 space-y-1">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {/* Success Message */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2 text-green-700 font-medium">
            <CheckCircle size={18} /> {successMsg}
          </div>
        )}

        {/* ── INVOICE INFORMATION ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Invoice Information</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Invoice Number</label>
              <input
                id="invoice-no"
                type="text"
                value={invoice.invoiceNo || ''}
                readOnly
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg font-bold text-blue-800 text-sm cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">Auto-generated</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Invoice Date</label>
              <input
                id="invoice-date"
                type="text"
                value={invoice.invoiceDate || ''}
                onChange={e => setInvoice(p => ({ ...p, invoiceDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="DD/MM/YYYY"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Invoice Type</label>
              <input
                type="text"
                value="Tax Invoice"
                readOnly
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* ── SELLER INFORMATION ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Seller Information</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Business Name</label>
              <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800">{settings.businessName}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Phone</label>
              <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">{settings.phone}</p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Address</label>
              <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">{settings.businessAddress}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Email</label>
              <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">{settings.email}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">GSTIN</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <Lock size={14} className="text-red-500 flex-shrink-0" />
                <span className="font-mono font-bold text-sm text-red-800">{settings.sellerGstin}</span>
                <span className="ml-auto text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">LOCKED</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── CUSTOMER INFORMATION ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Customer Information</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Customer Name <span className="text-red-500">*</span></label>
              <input
                id="customer-name"
                type="text"
                name="name"
                value={invoice.customerDetails?.name || ''}
                onChange={handleCustomerChange}
                placeholder="Enter customer / company name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Billing Address <span className="text-red-500">*</span></label>
              <textarea
                id="customer-address"
                name="address"
                value={invoice.customerDetails?.address || ''}
                onChange={handleCustomerChange}
                placeholder="Full billing address"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Customer GSTIN</label>
              <input
                id="customer-gstin"
                type="text"
                name="gstin"
                value={invoice.customerDetails?.gstin || ''}
                onChange={handleCustomerChange}
                placeholder="27XXXXX0000X0XX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">State</label>
              <input
                id="customer-state"
                type="text"
                name="state"
                value={invoice.customerDetails?.state || ''}
                onChange={handleCustomerChange}
                placeholder="Maharashtra"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">State Code</label>
              <input
                id="customer-state-code"
                type="text"
                name="stateCode"
                value={invoice.customerDetails?.stateCode || ''}
                onChange={handleCustomerChange}
                placeholder="27"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Mobile</label>
              <input
                id="customer-mobile"
                type="text"
                name="mobile"
                value={invoice.customerDetails?.mobile || ''}
                onChange={handleCustomerChange}
                placeholder="Mobile number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Email</label>
              <input
                id="customer-email"
                type="email"
                name="email"
                value={invoice.customerDetails?.email || ''}
                onChange={handleCustomerChange}
                placeholder="customer@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>
        </div>

        {/* ── GST TYPE ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Transaction Type</h3>
          </div>
          <div className="p-5 flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                id="intra-state"
                type="radio"
                name="transactionType"
                checked={(invoice.transactionType || 'intra-state') === 'intra-state'}
                onChange={() => handleTransactionTypeChange('intra-state')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Intra-State (CGST + SGST)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                id="inter-state"
                type="radio"
                name="transactionType"
                checked={invoice.transactionType === 'inter-state'}
                onChange={() => handleTransactionTypeChange('inter-state')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Inter-State (IGST)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                id="non-gst"
                type="radio"
                name="transactionType"
                checked={invoice.transactionType === 'non-gst'}
                onChange={() => handleTransactionTypeChange('non-gst')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Non-GST</span>
            </label>
          </div>
        </div>

        {/* ── ITEMS TABLE ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Items / Goods</h3>
            <button
              id="btn-add-item"
              onClick={addItem}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={16} /> Add Item
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                  <th className="px-3 py-2 text-left w-10">Sr.</th>
                  <th className="px-3 py-2 text-left min-w-[160px]">Description *</th>
                  <th className="px-3 py-2 text-left w-28">Card No.</th>
                  <th className="px-3 py-2 text-left w-20">Qty *</th>
                  <th className="px-3 py-2 text-left w-24">Rate *</th>
                  {invoice.transactionType !== 'non-gst' && <th className="px-3 py-2 text-left w-20">GST %</th>}
                  <th className="px-3 py-2 text-right w-28">Amount</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {(invoice.items || []).map((item, index) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-500 font-medium">{index + 1}</td>
                    <td className="px-3 py-2">
                      <input
                        id={`item-desc-${index}`}
                        type="text"
                        value={item.description}
                        onChange={e => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Product / Goods description"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        id={`item-card-${index}`}
                        type="text"
                        value={item.cardNo}
                        onChange={e => handleItemChange(index, 'cardNo', e.target.value)}
                        placeholder="CARD001"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        id={`item-qty-${index}`}
                        type="number"
                        value={item.quantity}
                        onChange={e => handleItemChange(index, 'quantity', Number(e.target.value))}
                        min="1"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        id={`item-rate-${index}`}
                        type="number"
                        value={item.rate}
                        onChange={e => handleItemChange(index, 'rate', Number(e.target.value))}
                        min="0"
                        step="0.01"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </td>
                    {invoice.transactionType !== 'non-gst' && (
                      <td className="px-3 py-2">
                        <select
                          id={`item-gst-${index}`}
                          value={item.gstPercent}
                          onChange={e => handleItemChange(index, 'gstPercent', Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white"
                        >
                          {GST_RATES.map(r => (
                            <option key={r} value={r}>{r}%</option>
                          ))}
                        </select>
                      </td>
                    )}
                    <td className="px-3 py-2 text-right">
                      <span className="font-semibold text-gray-800">₹{item.taxableValue.toFixed(2)}</span>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        id={`btn-del-item-${index}`}
                        onClick={() => removeItem(index)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {(invoice.items || []).length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-gray-400 text-sm">
                      No items added yet.{' '}
                      <button onClick={addItem} className="text-blue-600 hover:underline font-medium">
                        Click here to add your first item.
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {(invoice.items || []).length > 0 && (
            <div className="p-4 flex justify-start">
              <button
                onClick={addItem}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
              >
                <Plus size={16} /> Add Another Item
              </button>
            </div>
          )}
        </div>

        {/* ── TOTALS ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Invoice Total</h3>
          </div>
          <div className="p-5">
            <div className="max-w-sm ml-auto space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Taxable Amount</span>
                <span className="font-medium text-gray-900">₹{totalTaxable.toFixed(2)}</span>
              </div>
              {invoice.transactionType === 'non-gst' ? (
                 null // No GST rows
              ) : invoice.transactionType === 'inter-state' ? (
                <div className="flex justify-between text-sm text-gray-600">
                  <span>IGST</span>
                  <span className="font-medium text-gray-900">₹{totalIgst.toFixed(2)}</span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>CGST</span>
                    <span className="font-medium text-gray-900">₹{totalCgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>SGST</span>
                    <span className="font-medium text-gray-900">₹{totalSgst.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm text-gray-600">
                <span>Round Off</span>
                <span className="font-medium text-gray-900">₹{roundOff.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-300 pt-2 mt-2">
                <span>TOTAL AMOUNT</span>
                <span className="text-blue-700 text-lg">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Amount in Words */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-700 uppercase mb-1">Amount in Words</p>
              <p className="text-sm font-bold text-amber-900 uppercase">
                {invoice.amountInWords ? invoice.amountInWords.toUpperCase() : 'ZERO ONLY'}
              </p>
            </div>
          </div>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Actions</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSaveDraft}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
            >
              <FileText size={16} /> Save as Draft
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              <Save size={16} /> Save Invoice
            </button>
            <button
              onClick={handleSaveAndNew}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
            >
              <Plus size={16} /> Save &amp; New Invoice
            </button>
            <div className="w-px bg-gray-200 mx-1 self-stretch"></div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              <Printer size={16} /> Print
            </button>
            <button
              onClick={handlePdfExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 text-sm font-medium transition-colors"
            >
              <Download size={16} /> Download PDF
            </button>
            <button
              onClick={handleExcelExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-green-700 border border-green-200 rounded-lg hover:bg-green-50 text-sm font-medium transition-colors"
            >
              <Download size={16} /> Download Excel
            </button>
          </div>
        </div>
      </div>

      {/* ====== RIGHT: LIVE PREVIEW ====== */}
      <div className="xl:w-[22cm] flex-shrink-0 print:w-full">
        <div className="sticky top-4 space-y-3">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 flex items-center justify-between no-print">
            <span className="font-bold text-gray-700 text-sm">Live Preview</span>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded border border-gray-200 transition-colors">
                <Printer size={14} /> Print
              </button>
              <button onClick={handlePdfExport} className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200 transition-colors">
                <Download size={14} /> PDF
              </button>
              <button onClick={handleExcelExport} className="flex items-center gap-1 px-3 py-1.5 text-xs text-green-700 hover:bg-green-50 rounded border border-green-200 bg-green-50 transition-colors">
                <Download size={14} /> Excel
              </button>
            </div>
          </div>
          <div className="shadow-xl overflow-x-auto bg-gray-200 p-4 rounded no-print">
            <InvoicePreview invoice={invoice} settings={settings} previewRef={previewRef} />
          </div>
          <div className="hidden print:block">
            <InvoicePreview invoice={invoice} settings={settings} previewRef={previewRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
