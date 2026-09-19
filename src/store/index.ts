import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer, Invoice, Product, Settings } from '../types';

interface AppState {
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  settings: Settings;
  lastInvoiceNumber: number;
  
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Product) => void;
  deleteProduct: (id: string) => void;
  
  saveInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  
  updateSettings: (settings: Partial<Settings>) => void;
  
  getNextInvoiceNumber: () => string;
}

const defaultSettings: Settings = {
  businessName: 'S.D.ENTERPRISES',
  businessAddress: 'Shop No.1A, Siddharth Complex Vidya Nagar Pune 411015',
  phone: '9665046321 / 8888930735',
  email: 'sdentp.sai@gmail.com',
  bankDetails: 'SARASWAT CO-OPERATIVE BANK LTD.\nACCOUNT NO.342500100100258\nIFSC CODE; SRCB0000342',
  invoicePrefix: 'INV-',
  startingInvoiceNumber: 1,
  defaultGstRate: 5,
  termsAndConditions: '1. Subject to Pune Jurisdiction.\n2. E.& O.E.',
  sellerGstin: '27EDQPS8667Q1ZX'
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      customers: [],
      products: [],
      invoices: [{
        id: 'sample-1',
        invoiceNo: 'INV-001',
        invoiceDate: '31/03/2026',
        customerId: 'cust-1',
        status: 'Saved',
        customerDetails: {
          id: 'cust-1',
          name: 'COMPUCOM CSI SYSTEMS INDIA PVT.LTD.',
          address: 'Tower No.7 4th Floor Cybercity\nMagarpatta Pune',
          shippingAddress: '',
          gstin: '27AADCC9446J1ZA',
          state: 'Maharashtra',
          stateCode: '27',
          mobile: '',
          email: ''
        },
        items: [{
          id: 'item-1',
          description: 'BAILLEY 20 ltr Water',
          hsn: '220110',
          cardNo: '',
          quantity: 88,
          unit: 'Nos',
          rate: 42,
          discount: 0,
          taxableValue: 3696,
          gstPercent: 5,
          cgst: 0,
          sgst: 0,
          igst: 184.8,
          total: 3880.8
        }],
        isInterState: true,
        totalTaxableValue: 3696,
        totalDiscount: 0,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 184.8,
        totalGst: 184.8,
        roundOff: 0.2,
        grandTotal: 3881,
        amountInWords: 'Rupees Three Thousand Eight Hundred Eighty One Only'
      }],
      settings: defaultSettings,
      lastInvoiceNumber: 1,
      
      addCustomer: (customer) => set((state) => ({ customers: [...state.customers, customer] })),
      updateCustomer: (id, updated) => set((state) => ({
        customers: state.customers.map(c => c.id === id ? updated : c)
      })),
      deleteCustomer: (id) => set((state) => ({
        customers: state.customers.filter(c => c.id !== id)
      })),
      
      addProduct: (product) => set((state) => ({ products: [...state.products, product] })),
      updateProduct: (id, updated) => set((state) => ({
        products: state.products.map(p => p.id === id ? updated : p)
      })),
      deleteProduct: (id) => set((state) => ({
        products: state.products.filter(p => p.id !== id)
      })),
      
      saveInvoice: (invoice) => {
        set((state) => {
          const exists = state.invoices.find(i => i.id === invoice.id);
          let newLastInvoiceNumber = state.lastInvoiceNumber;
          
          if (!exists) {
            const numPart = parseInt(invoice.invoiceNo.replace(state.settings.invoicePrefix, ''), 10);
            if (!isNaN(numPart) && numPart > state.lastInvoiceNumber) {
              newLastInvoiceNumber = numPart;
            }
          }
          
          return {
            invoices: exists 
              ? state.invoices.map(i => i.id === invoice.id ? invoice : i)
              : [...state.invoices, invoice],
            lastInvoiceNumber: newLastInvoiceNumber
          };
        });
      },
      deleteInvoice: (id) => set((state) => ({
        invoices: state.invoices.filter(i => i.id !== id)
      })),
      
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      
      getNextInvoiceNumber: () => {
        const state = get();
        const nextNum = Math.max(state.lastInvoiceNumber + 1, state.settings.startingInvoiceNumber);
        return `${state.settings.invoicePrefix}${nextNum.toString().padStart(3, '0')}`;
      }
    }),
    {
      name: 'gst-invoice-storage',
    }
  )
);
