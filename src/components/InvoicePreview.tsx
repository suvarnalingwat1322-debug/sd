import type { Invoice, Settings } from '../types';

interface Props {
  invoice: Partial<Invoice>;
  settings: Settings;
  previewRef: React.RefObject<HTMLDivElement | null>;
}

export default function InvoicePreview({ invoice, settings, previewRef }: Props) {
  const customer = invoice.customerDetails;
  const uniqueGstRates = Array.from(new Set(invoice.items?.map(i => i.gstPercent).filter(r => r !== undefined) || []));
  const isSingleRate = uniqueGstRates.length === 1;
  const singleRate = isSingleRate ? uniqueGstRates[0] : null;

  return (
    <div
      ref={previewRef}
      className="bg-white border border-gray-300 shadow-sm print:shadow-none print:border-none mx-auto w-full max-w-[21cm] min-h-[29.7cm] text-gray-900"
      style={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', padding: '24px' }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 'bold', borderBottom: '2px solid black', display: 'inline-block', paddingBottom: '2px', paddingLeft: '16px', paddingRight: '16px', letterSpacing: '3px', marginBottom: '6px' }}>
          {invoice.transactionType === 'non-gst' ? 'NON-GST' : 'TAX INVOICE'}
        </div>
        <h1 style={{ fontSize: '22px', fontWeight: '900', margin: '4px 0 2px' }}>{settings.businessName}</h1>
        <p style={{ margin: '2px 0', fontWeight: '600' }}>{settings.businessAddress}</p>
        <p style={{ margin: '2px 0' }}>Ph.No.{settings.phone}</p>
        <p style={{ margin: '2px 0' }}>{settings.email}</p>
      </div>

      {/* Info Grid */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', border: '1px solid black' }}>
        <tbody>
          <tr>
            {/* Left: Customer */}
            <td style={{ width: '55%', verticalAlign: 'top', padding: '6px', borderRight: '1px solid black' }}>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px' }}>Billing Address:</p>
              {customer ? (
                <>
                  <p style={{ fontWeight: 'bold' }}>{customer.name || <em style={{ color: '#aaa' }}>Customer name</em>}</p>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{customer.address}</p>
                  {customer.gstin && <p style={{ marginTop: '6px', fontWeight: 'bold' }}>GST NO: {customer.gstin}</p>}
                  {customer.state && <p>State: {customer.state} {customer.stateCode ? `(${customer.stateCode})` : ''}</p>}
                </>
              ) : (
                <p style={{ color: '#aaa', fontStyle: 'italic' }}>Customer details will appear here</p>
              )}
            </td>
            {/* Right: Invoice meta */}
            <td style={{ verticalAlign: 'top', padding: '0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', height: '100%' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid black' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid black', width: '50%' }}>DATE</td>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold' }}>{invoice.invoiceDate || '-'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid black' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid black' }}>INVOICE NO.</td>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold' }}>{invoice.invoiceNo || '-'}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid black' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid black' }}>GST NO.</td>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold' }}>{settings.sellerGstin}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold', borderRight: '1px solid black' }}>HSN NO.</td>
                    <td style={{ padding: '5px 8px', fontWeight: 'bold' }}>{invoice.items?.[0]?.hsn || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', fontSize: '11px', textAlign: 'center' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid black', fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
            <th style={{ border: '1px solid black', padding: '5px 4px', width: '36px' }}>Sr.no</th>
            <th style={{ border: '1px solid black', padding: '5px 4px', textAlign: 'left' }}>DESCRIPTION OF GOODS</th>
            <th style={{ border: '1px solid black', padding: '5px 4px', width: '80px' }}>CARD NO</th>
            <th style={{ border: '1px solid black', padding: '5px 4px', width: '64px' }}>QUANTITY</th>
            <th style={{ border: '1px solid black', padding: '5px 4px', width: '64px' }}>RATE</th>
            <th style={{ border: '1px solid black', padding: '5px 4px', width: '80px' }}>TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items && invoice.items.length > 0 ? invoice.items.map((item, index) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ border: '1px solid black', padding: '4px' }}>{index + 1}</td>
              <td style={{ border: '1px solid black', padding: '4px', textAlign: 'left', fontWeight: '600' }}>{item.description}</td>
              <td style={{ border: '1px solid black', padding: '4px' }}>{item.cardNo || '-'}</td>
              <td style={{ border: '1px solid black', padding: '4px' }}>{item.quantity}</td>
              <td style={{ border: '1px solid black', padding: '4px' }}>{item.rate.toFixed(2)}</td>
              <td style={{ border: '1px solid black', padding: '4px', fontWeight: '600' }}>{item.total.toFixed(2)}</td>
            </tr>
          )) : (
            <tr>
              <td style={{ border: '1px solid black', padding: '4px' }}></td>
              <td style={{ border: '1px solid black', padding: '4px' }}></td>
              <td style={{ border: '1px solid black', padding: '4px' }}></td>
              <td style={{ border: '1px solid black', padding: '4px' }}></td>
              <td style={{ border: '1px solid black', padding: '4px' }}></td>
              <td style={{ border: '1px solid black', padding: '4px' }}></td>
            </tr>
          )}
          {/* Empty padding rows */}
          {Array.from({ length: Math.max(0, 8 - (invoice.items?.length || 0)) }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td style={{ border: '1px solid black', padding: '4px', height: '20px' }}></td>
              <td style={{ border: '1px solid black', padding: '4px' }}></td>
              <td style={{ border: '1px solid black', padding: '4px' }}></td>
              <td style={{ border: '1px solid black', padding: '4px' }}></td>
              <td style={{ border: '1px solid black', padding: '4px' }}></td>
              <td style={{ border: '1px solid black', padding: '4px' }}></td>
            </tr>
          ))}

          {/* Tax rows */}
          <tr style={{ borderTop: '2px solid black' }}>
            <td colSpan={5} style={{ border: '1px solid black', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>Taxable Amount</td>
            <td style={{ border: '1px solid black', padding: '4px', fontWeight: 'bold' }}>{invoice.totalTaxableValue?.toFixed(2) || '0.00'}</td>
          </tr>

          {invoice.transactionType === 'non-gst' ? (
             null
          ) : invoice.transactionType === 'inter-state' || invoice.isInterState ? (
            <tr>
              <td colSpan={5} style={{ border: '1px solid black', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>IGST {isSingleRate && singleRate ? `@ ${singleRate}%` : ''}</td>
              <td style={{ border: '1px solid black', padding: '4px', fontWeight: 'bold' }}>{invoice.totalIgst?.toFixed(2) || '0.00'}</td>
            </tr>
          ) : (
            <>
              <tr>
                <td colSpan={5} style={{ border: '1px solid black', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>CGST {isSingleRate && singleRate ? `@ ${singleRate / 2}%` : ''}</td>
                <td style={{ border: '1px solid black', padding: '4px', fontWeight: 'bold' }}>{invoice.totalCgst?.toFixed(2) || '0.00'}</td>
              </tr>
              <tr>
                <td colSpan={5} style={{ border: '1px solid black', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>SGST {isSingleRate && singleRate ? `@ ${singleRate / 2}%` : ''}</td>
                <td style={{ border: '1px solid black', padding: '4px', fontWeight: 'bold' }}>{invoice.totalSgst?.toFixed(2) || '0.00'}</td>
              </tr>
            </>
          )}
          {(invoice.roundOff !== undefined && invoice.roundOff !== 0) && (
            <tr>
              <td colSpan={5} style={{ border: '1px solid black', padding: '4px', textAlign: 'right', fontWeight: 'bold' }}>Round Off</td>
              <td style={{ border: '1px solid black', padding: '4px', fontWeight: 'bold' }}>{invoice.roundOff?.toFixed(2)}</td>
            </tr>
          )}
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            <td colSpan={5} style={{ border: '1px solid black', padding: '6px 4px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>TOTAL AMOUNT</td>
            <td style={{ border: '1px solid black', padding: '6px 4px', fontWeight: 'bold', fontSize: '13px' }}>{invoice.grandTotal?.toFixed(2) || '0.00'}</td>
          </tr>
        </tbody>
      </table>

      {/* Amount in Words */}
      <div style={{ border: '1px solid black', borderTop: 'none', padding: '5px 8px', fontWeight: 'bold', fontSize: '11px', marginBottom: '8px' }}>
        IN WORDS : {invoice.amountInWords ? invoice.amountInWords.toUpperCase() : 'ZERO ONLY'}
      </div>

      {/* Footer */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black' }}>
        <tbody>
          <tr>
            <td style={{ width: '55%', padding: '8px', borderRight: '1px solid black', verticalAlign: 'top' }}>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px' }}>BANK DETAILS:</p>
              <p style={{ whiteSpace: 'pre-wrap', fontWeight: '600', fontSize: '11px' }}>{settings.bankDetails}</p>
              {settings.termsAndConditions && (
                <>
                  <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginTop: '8px', marginBottom: '4px' }}>Terms &amp; Conditions:</p>
                  <p style={{ whiteSpace: 'pre-wrap', fontSize: '10px', color: '#444' }}>{settings.termsAndConditions}</p>
                </>
              )}
            </td>
            <td style={{ padding: '8px', verticalAlign: 'top', textAlign: 'center' }}>
              <p style={{ fontWeight: 'bold' }}>For {settings.businessName}</p>
              <div style={{ marginTop: '48px', borderTop: '1px solid #999', paddingTop: '4px', fontWeight: 'bold', width: '75%', margin: '48px auto 0' }}>
                Authorised Signatory
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
