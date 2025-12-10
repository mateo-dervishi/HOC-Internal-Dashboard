import * as XLSX from 'xlsx';

// Column width helper (in characters)
const colWidth = (width: number) => ({ wch: width });

// Create a clean Excel Template specifically for Power Automate
// Each sheet is pure tabular data: headers in row 1, data in rows 2+
export const generateExcelTemplate = () => {
  const wb = XLSX.utils.book_new();
  
  // ========================================
  // SHEET 1: Projects
  // Row 1 = Headers, Row 2+ = Data
  // ========================================
  const projectsData = [
    ['ProjectCode', 'ClientName', 'Address', 'Status', 'CPEnabled', 'CreatedDate', 'Notes'],
    ['EXAMPLE-001', 'John Smith', '123 Example Street, London', 'Active', 'Yes', '10/12/2025', 'Sample project - delete this row'],
  ];
  
  const projectsSheet = XLSX.utils.aoa_to_sheet(projectsData);
  projectsSheet['!cols'] = [
    colWidth(15), colWidth(20), colWidth(35), colWidth(12), 
    colWidth(12), colWidth(14), colWidth(30)
  ];
  XLSX.utils.book_append_sheet(wb, projectsSheet, 'Projects');
  
  // ========================================
  // SHEET 2: Valuations
  // ========================================
  const valuationsData = [
    ['ProjectCode', 'ValuationName', 'Date', 'GrandTotal', 'Fees', 'Omissions', 'VATRate', 'Notes'],
    ['EXAMPLE-001', 'V1 - Deposit', '10/12/2025', 10000, 4000, 0, 20, 'Sample valuation - delete this row'],
  ];
  
  const valuationsSheet = XLSX.utils.aoa_to_sheet(valuationsData);
  valuationsSheet['!cols'] = [
    colWidth(15), colWidth(20), colWidth(14), colWidth(14),
    colWidth(12), colWidth(12), colWidth(10), colWidth(30)
  ];
  XLSX.utils.book_append_sheet(wb, valuationsSheet, 'Valuations');
  
  // ========================================
  // SHEET 3: ClientPayments
  // ========================================
  const paymentsData = [
    ['ProjectCode', 'Date', 'Amount', 'PaymentType', 'Description'],
    ['EXAMPLE-001', '10/12/2025', 11200, 'Account', 'Sample payment - delete this row'],
  ];
  
  const paymentsSheet = XLSX.utils.aoa_to_sheet(paymentsData);
  paymentsSheet['!cols'] = [
    colWidth(15), colWidth(14), colWidth(14), colWidth(14), colWidth(35)
  ];
  XLSX.utils.book_append_sheet(wb, paymentsSheet, 'ClientPayments');
  
  // ========================================
  // SHEET 4: SupplierCosts
  // ========================================
  const supplierData = [
    ['ProjectCode', 'Date', 'Amount', 'Supplier', 'Description'],
    ['EXAMPLE-001', '10/12/2025', 5000, 'Example Supplier Ltd', 'Sample cost - delete this row'],
  ];
  
  const supplierSheet = XLSX.utils.aoa_to_sheet(supplierData);
  supplierSheet['!cols'] = [
    colWidth(15), colWidth(14), colWidth(14), colWidth(25), colWidth(35)
  ];
  XLSX.utils.book_append_sheet(wb, supplierSheet, 'SupplierCosts');
  
  // ========================================
  // SHEET 5: FixedCosts
  // ========================================
  const fixedData = [
    ['Date', 'Amount', 'Category', 'Description', 'IsRecurring'],
    ['10/12/2025', 14400, 'Showroom Rent', 'Sample fixed cost - delete this row', 'Yes'],
  ];
  
  const fixedSheet = XLSX.utils.aoa_to_sheet(fixedData);
  fixedSheet['!cols'] = [
    colWidth(14), colWidth(14), colWidth(20), colWidth(35), colWidth(12)
  ];
  XLSX.utils.book_append_sheet(wb, fixedSheet, 'FixedCosts');
  
  // ========================================
  // SHEET 6: VariableCosts
  // ========================================
  const variableData = [
    ['Date', 'Amount', 'Category', 'Description', 'IsRecurring'],
    ['10/12/2025', 12292, 'Salaries', 'Sample variable cost - delete this row', 'No'],
  ];
  
  const variableSheet = XLSX.utils.aoa_to_sheet(variableData);
  variableSheet['!cols'] = [
    colWidth(14), colWidth(14), colWidth(20), colWidth(35), colWidth(12)
  ];
  XLSX.utils.book_append_sheet(wb, variableSheet, 'VariableCosts');
  
  // Generate and download
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `HOC_Dashboard_Template.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export current dashboard data to Excel
export const exportDataToExcel = (state: {
  projects: Array<{
    code: string;
    clientName: string;
    address?: string;
    status: string;
    hasCashPayment: boolean;
    valuations: Array<{
      name: string;
      date: string;
      grandTotal: number;
      fees: number;
      omissions: number;
      vatRate: number;
      notes?: string;
    }>;
    payments: Array<{
      date: string;
      amount: number;
      type: string;
      valuationId?: string;
      description?: string;
    }>;
    supplierCosts: Array<{
      date: string;
      amount: number;
      supplier: string;
      description?: string;
    }>;
    createdAt: string;
    notes?: string;
  }>;
  operationalCosts: Array<{
    date: string;
    amount: number;
    category: string;
    costType: string;
    description?: string;
    isRecurring?: boolean;
  }>;
}) => {
  const wb = XLSX.utils.book_new();
  
  // Projects sheet
  const projectsData = [
    ['ProjectCode', 'ClientName', 'Address', 'Status', 'CPEnabled', 'CreatedDate', 'Notes'],
    ...state.projects.map(p => [
      p.code,
      p.clientName,
      p.address || '',
      p.status,
      p.hasCashPayment ? 'Yes' : 'No',
      new Date(p.createdAt).toLocaleDateString('en-GB'),
      p.notes || ''
    ])
  ];
  if (projectsData.length === 1) {
    projectsData.push(['', '', '', '', '', '', '']);
  }
  const projectsSheet = XLSX.utils.aoa_to_sheet(projectsData);
  projectsSheet['!cols'] = [
    colWidth(15), colWidth(20), colWidth(35), colWidth(12), 
    colWidth(12), colWidth(14), colWidth(30)
  ];
  XLSX.utils.book_append_sheet(wb, projectsSheet, 'Projects');
  
  // Valuations sheet
  const valuationsData = [
    ['ProjectCode', 'ValuationName', 'Date', 'GrandTotal', 'Fees', 'Omissions', 'VATRate', 'Notes'],
    ...state.projects.flatMap(p => 
      p.valuations.map(v => [
        p.code,
        v.name,
        new Date(v.date).toLocaleDateString('en-GB'),
        v.grandTotal,
        v.fees,
        v.omissions,
        v.vatRate * 100,
        v.notes || ''
      ])
    )
  ];
  if (valuationsData.length === 1) {
    valuationsData.push(['', '', '', '', '', '', '', '']);
  }
  const valuationsSheet = XLSX.utils.aoa_to_sheet(valuationsData);
  valuationsSheet['!cols'] = [
    colWidth(15), colWidth(20), colWidth(14), colWidth(14),
    colWidth(12), colWidth(12), colWidth(10), colWidth(30)
  ];
  XLSX.utils.book_append_sheet(wb, valuationsSheet, 'Valuations');
  
  // Payments sheet
  const paymentsData = [
    ['ProjectCode', 'Date', 'Amount', 'PaymentType', 'Description'],
    ...state.projects.flatMap(p => 
      p.payments.map(pay => [
        p.code,
        new Date(pay.date).toLocaleDateString('en-GB'),
        pay.amount,
        pay.type === 'account' ? 'Account' : 'Cash',
        pay.description || ''
      ])
    )
  ];
  if (paymentsData.length === 1) {
    paymentsData.push(['', '', '', '', '']);
  }
  const paymentsSheet = XLSX.utils.aoa_to_sheet(paymentsData);
  paymentsSheet['!cols'] = [
    colWidth(15), colWidth(14), colWidth(14), colWidth(14), colWidth(35)
  ];
  XLSX.utils.book_append_sheet(wb, paymentsSheet, 'ClientPayments');
  
  // Supplier Costs sheet
  const supplierData = [
    ['ProjectCode', 'Date', 'Amount', 'Supplier', 'Description'],
    ...state.projects.flatMap(p => 
      p.supplierCosts.map(c => [
        p.code,
        new Date(c.date).toLocaleDateString('en-GB'),
        c.amount,
        c.supplier,
        c.description || ''
      ])
    )
  ];
  if (supplierData.length === 1) {
    supplierData.push(['', '', '', '', '']);
  }
  const supplierSheet = XLSX.utils.aoa_to_sheet(supplierData);
  supplierSheet['!cols'] = [
    colWidth(15), colWidth(14), colWidth(14), colWidth(25), colWidth(35)
  ];
  XLSX.utils.book_append_sheet(wb, supplierSheet, 'SupplierCosts');
  
  // Fixed Costs sheet
  const fixedCosts = state.operationalCosts.filter(c => c.costType === 'fixed');
  const fixedData = [
    ['Date', 'Amount', 'Category', 'Description', 'IsRecurring'],
    ...fixedCosts.map(c => [
      new Date(c.date).toLocaleDateString('en-GB'),
      c.amount,
      c.category,
      c.description || '',
      c.isRecurring ? 'Yes' : 'No'
    ])
  ];
  if (fixedData.length === 1) {
    fixedData.push(['', '', '', '', '']);
  }
  const fixedSheet = XLSX.utils.aoa_to_sheet(fixedData);
  fixedSheet['!cols'] = [
    colWidth(14), colWidth(14), colWidth(20), colWidth(35), colWidth(12)
  ];
  XLSX.utils.book_append_sheet(wb, fixedSheet, 'FixedCosts');
  
  // Variable Costs sheet
  const variableCosts = state.operationalCosts.filter(c => c.costType === 'variable');
  const variableData = [
    ['Date', 'Amount', 'Category', 'Description', 'IsRecurring'],
    ...variableCosts.map(c => [
      new Date(c.date).toLocaleDateString('en-GB'),
      c.amount,
      c.category,
      c.description || '',
      c.isRecurring ? 'Yes' : 'No'
    ])
  ];
  if (variableData.length === 1) {
    variableData.push(['', '', '', '', '']);
  }
  const variableSheet = XLSX.utils.aoa_to_sheet(variableData);
  variableSheet['!cols'] = [
    colWidth(14), colWidth(14), colWidth(20), colWidth(35), colWidth(12)
  ];
  XLSX.utils.book_append_sheet(wb, variableSheet, 'VariableCosts');
  
  // Generate and download
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `HOC_Dashboard_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
