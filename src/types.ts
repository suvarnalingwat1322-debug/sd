export interface Customer {
  id: string;
  name: string;
  address: string;
  shippingAddress: string;
  gstin: string;
  state: string;
  stateCode: string;
  mobile: string;
  email: string;
}

export interface Product {
  id: string;
  description: string;
  hsn: string;
  unit: string;
  rate: number;
  gstPercent: number;
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  description: string;
  hsn: string;
  cardNo: string;
  quantity: number;
  unit: string;
  rate: number;
  discount: number;
  taxableValue: number;
  gstPercent: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  customerId: string;
  customerDetails: Customer;
  items: InvoiceItem[];
  isInterState: boolean;
  totalTaxableValue: number;
  totalDiscount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalGst: number;
  roundOff: number;
  grandTotal: number;
  amountInWords: string;
  status: 'Draft' | 'Saved' | 'Cancelled';
}

export interface Settings {
  businessName: string;
  businessAddress: string;
  phone: string;
  email: string;
  bankDetails: string;
  invoicePrefix: string;
  startingInvoiceNumber: number;
  defaultGstRate: number;
  termsAndConditions: string;
  sellerGstin: string;
}
