import * as XLSX from 'xlsx';
import type { CustomerRecord } from '../types';

const EXCEL_HEADERS = [
  'Customer Name',
  'Rate',
  'CGST',
  'SGST',
  'Total In',
  'Total',
  'GST Total'
];

export const downloadCustomerTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([EXCEL_HEADERS]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers');
  XLSX.writeFile(wb, 'Customer_Template.xlsx');
};

export const exportCustomerRecords = (records: CustomerRecord[]) => {
  const data = records.map(r => [
    r.customerName,
    r.rate,
    r.cgst,
    r.sgst,
    r.totalIn,
    r.total,
    r.gstTotal
  ]);
  const ws = XLSX.utils.aoa_to_sheet([EXCEL_HEADERS, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Customers');
  XLSX.writeFile(wb, 'Customer_List.xlsx');
};

export const parseCustomerExcel = (file: File): Promise<CustomerRecord[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const wb = XLSX.read(data, { type: 'array' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        
        // Ensure header mapping is exact
        const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: null });
        
        if (json.length === 0) {
          throw new Error('Excel file is empty.');
        }

        const firstRowKeys = Object.keys(json[0]);
        const hasRequiredHeader = firstRowKeys.includes('Customer Name');
        
        if (!hasRequiredHeader) {
           throw new Error('Invalid columns. Expected at least "Customer Name".');
        }

        const records: CustomerRecord[] = json.map((row) => ({
          id: crypto.randomUUID(),
          customerName: row['Customer Name'] || '',
          rate: typeof row['Rate'] === 'number' ? row['Rate'] : null,
          cgst: typeof row['CGST'] === 'number' ? row['CGST'] : null,
          sgst: typeof row['SGST'] === 'number' ? row['SGST'] : null,
          totalIn: typeof row['Total In'] === 'number' ? row['Total In'] : null,
          total: typeof row['Total'] === 'number' ? row['Total'] : null,
          gstTotal: typeof row['GST Total'] === 'number' ? row['GST Total'] : null,
          createdAt: new Date().toISOString(),
        })).filter(r => typeof r.customerName === 'string' && r.customerName.trim() !== ''); // Require customerName

        resolve(records);
      } catch (err: any) {
        reject(err.message || 'Failed to parse Excel file.');
      }
    };
    reader.onerror = () => reject('Failed to read file.');
    reader.readAsArrayBuffer(file);
  });
};
