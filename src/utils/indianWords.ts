export function numberToIndianWords(amount: number): string {
  if (amount === 0 || isNaN(amount)) return '';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertChunk(num: number): string {
    if (num === 0) return '';
    if (num < 20) return a[num];
    if (num < 100) return b[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + a[num % 10] : '');
    return a[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + convertChunk(num % 100) : '');
  }

  function getRupees(num: number): string {
    if (num === 0) return 'Zero';
    let str = '';
    
    // Crores
    const crore = Math.floor(num / 10000000);
    if (crore > 0) {
      str += convertChunk(crore) + ' Crore ';
      num %= 10000000;
    }
    
    // Lakhs
    const lakh = Math.floor(num / 100000);
    if (lakh > 0) {
      str += convertChunk(lakh) + ' Lakh ';
      num %= 100000;
    }
    
    // Thousands
    const thousand = Math.floor(num / 1000);
    if (thousand > 0) {
      str += convertChunk(thousand) + ' Thousand ';
      num %= 1000;
    }
    
    // Remaining
    if (num > 0) {
      str += convertChunk(num);
    }
    
    return str.trim();
  }

  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  let result = 'Rupees ' + getRupees(integerPart);
  
  if (decimalPart > 0) {
    result += ' and ' + convertChunk(decimalPart) + ' Paise';
  }
  
  return result + ' Only';
}
