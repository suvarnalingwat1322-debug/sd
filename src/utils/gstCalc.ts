import type { InvoiceItem } from '../types';

export function calculateItemTaxes(
  rate: number,
  quantity: number,
  discount: number,
  gstPercent: number,
  transactionType: 'intra-state' | 'inter-state' | 'non-gst'
): Omit<InvoiceItem, 'id' | 'productId' | 'description' | 'hsn' | 'cardNo' | 'quantity' | 'unit' | 'rate' | 'discount' | 'gstPercent'> {
  const taxableValue = (rate * quantity) - discount;
  
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (transactionType === 'inter-state') {
    igst = taxableValue * (gstPercent / 100);
  } else if (transactionType === 'intra-state') {
    cgst = taxableValue * ((gstPercent / 2) / 100);
    sgst = taxableValue * ((gstPercent / 2) / 100);
  }

  const total = taxableValue + cgst + sgst + igst;

  return {
    taxableValue,
    cgst,
    sgst,
    igst,
    total
  };
}
