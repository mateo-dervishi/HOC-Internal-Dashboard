import * as XLSX from 'xlsx';
import { calculateProjectFinancials } from '../types';

// Column width helper (in characters)
const colWidth = (width: number) => ({ wch: width });

// Create a clean Excel Template specifically for Power Automate
// Each sheet is pure tabular data: headers in row 1, data in rows 2+
export const generateExcelTemplate = () => {
  const wb = XLSX.utils.book_new();
  
  // ========================================
  // SHEET 1: Projects
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

// Export current dashboard data to a nicely formatted Excel report
export const exportDataToExcel = (state: {
  projects: Array<{
    id: string;
    code: string;
    clientName: string;
    address?: string;
    status: 'active' | 'completed' | 'on_hold';
    hasCashPayment: boolean;
    valuations: Array<{
      id: string;
      name: string;
      date: string;
      grandTotal: number;
      fees: number;
      vatRate: number;
      notes?: string;
    }>;
    payments: Array<{
      id: string;
      date: string;
      amount: number;
      type: 'account' | 'cash';
      valuationName?: string;
      description?: string;
    }>;
    supplierCosts: Array<{
      id: string;
      date: string;
      amount: number;
      supplier: string;
      description?: string;
    }>;
    createdAt: string;
    notes?: string;
  }>;
  operationalCosts: Array<{
    id: string;
    date: string;
    amount: number;
    category: string;
    costType: string;
    description?: string;
    isRecurring?: boolean;
  }>;
}) => {
  const wb = XLSX.utils.book_new();
  const today = new Date().toLocaleDateString('en-GB');
  
  // Calculate totals for summary
  let totalGross = 0;
  let totalInflows = 0;
  let totalSupplierCosts = 0;
  let totalProjectProfit = 0;
  
  state.projects.forEach(p => {
    const financials = calculateProjectFinancials(p);
    totalGross += financials.totalGross;
    totalInflows += financials.totalInflows;
    totalSupplierCosts += financials.totalSupplierCosts;
    totalProjectProfit += financials.grossProfit;
  });
  
  const totalFixedCosts = state.operationalCosts
    .filter(c => c.costType === 'fixed')
    .reduce((sum, c) => sum + c.amount, 0);
  const totalVariableCosts = state.operationalCosts
    .filter(c => c.costType === 'variable')
    .reduce((sum, c) => sum + c.amount, 0);
  const totalOpCosts = totalFixedCosts + totalVariableCosts;
  const netProfit = totalProjectProfit - totalOpCosts;
  
  // ========================================
  // SHEET 1: Summary
  // ========================================
  const summaryData = [
    ['HOUSE OF CLARENCE'],
    ['Financial Dashboard Report'],
    [''],
    ['Generated:', today],
    [''],
    [''],
    ['QUICK STATS'],
    ['Metric', 'Value', 'Notes'],
    ['Total Projects', state.projects.length, ''],
    ['Active Projects', state.projects.filter(p => p.status === 'active').length, ''],
    ['Completed Projects', state.projects.filter(p => p.status === 'completed').length, ''],
    [''],
    ['FINANCIAL OVERVIEW'],
    ['Metric', 'Value', 'Notes'],
    ['Total Gross (Valuations)', `£${totalGross.toLocaleString()}`, 'Sum of all valuation gross amounts'],
    ['Total Client Payments', `£${totalInflows.toLocaleString()}`, 'Total received from clients'],
    ['Total Supplier Costs', `£${totalSupplierCosts.toLocaleString()}`, 'Sum of all supplier costs'],
    ['Project Profit', `£${totalProjectProfit.toLocaleString()}`, 'Inflows minus supplier costs'],
    [''],
    ['OPERATIONAL COSTS'],
    ['Fixed Costs', `£${totalFixedCosts.toLocaleString()}`, 'Rent, Insurance, etc.'],
    ['Variable Costs', `£${totalVariableCosts.toLocaleString()}`, 'Salaries, Marketing, etc.'],
    ['Total Operational', `£${totalOpCosts.toLocaleString()}`, ''],
    [''],
    ['NET PROFIT', `£${netProfit.toLocaleString()}`, 'Project Profit minus Operational Costs'],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [colWidth(25), colWidth(20), colWidth(35)];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
  
  // ========================================
  // SHEET 2: Projects Overview
  // ========================================
  const projectsHeader = [
    ['PROJECTS OVERVIEW'],
    [''],
    ['Code', 'Client', 'Address', 'Status', 'CP', 'Gross', 'Inflows', 'Costs', 'Profit', 'Margin', 'Created'],
  ];
  
  const projectRows = state.projects.map(p => {
    const fin = calculateProjectFinancials(p);
    const margin = fin.totalGross > 0 ? ((fin.grossProfit / fin.totalGross) * 100).toFixed(1) + '%' : '0%';
    return [
      p.code,
      p.clientName,
      p.address || '',
      p.status.charAt(0).toUpperCase() + p.status.slice(1),
      p.hasCashPayment ? 'Yes' : 'No',
      `£${fin.totalGross.toLocaleString()}`,
      `£${fin.totalInflows.toLocaleString()}`,
      `£${fin.totalSupplierCosts.toLocaleString()}`,
      `£${fin.grossProfit.toLocaleString()}`,
      margin,
      new Date(p.createdAt).toLocaleDateString('en-GB'),
    ];
  });
  
  const projectsData = [...projectsHeader, ...projectRows];
  const projectsSheet = XLSX.utils.aoa_to_sheet(projectsData);
  projectsSheet['!cols'] = [
    colWidth(14), colWidth(20), colWidth(30), colWidth(12), colWidth(6),
    colWidth(14), colWidth(14), colWidth(14), colWidth(14), colWidth(10), colWidth(12)
  ];
  XLSX.utils.book_append_sheet(wb, projectsSheet, 'Projects');
  
  // ========================================
  // SHEET 3: Valuations Detail
  // ========================================
  const valuationsHeader = [
    ['VALUATIONS DETAIL'],
    [''],
    ['Project', 'Client', 'Valuation', 'Date', 'Grand Total', 'Fees', 'VAT Rate', 'Subtotal', 'VAT', 'Gross'],
  ];
  
  const valuationRows: (string | number)[][] = [];
  state.projects.forEach(p => {
    p.valuations.forEach(v => {
      const subtotal = v.grandTotal - v.fees;
      const vat = subtotal * v.vatRate;
      const gross = v.grandTotal + vat;
      valuationRows.push([
        p.code,
        p.clientName,
        v.name,
        new Date(v.date).toLocaleDateString('en-GB'),
        `£${v.grandTotal.toLocaleString()}`,
        `£${v.fees.toLocaleString()}`,
        `${(v.vatRate * 100).toFixed(0)}%`,
        `£${subtotal.toLocaleString()}`,
        `£${vat.toLocaleString()}`,
        `£${gross.toLocaleString()}`,
      ]);
    });
  });
  
  const valuationsData = [...valuationsHeader, ...valuationRows];
  const valuationsSheet = XLSX.utils.aoa_to_sheet(valuationsData);
  valuationsSheet['!cols'] = [
    colWidth(14), colWidth(18), colWidth(18), colWidth(12), colWidth(14),
    colWidth(12), colWidth(10), colWidth(14), colWidth(12), colWidth(14)
  ];
  XLSX.utils.book_append_sheet(wb, valuationsSheet, 'Valuations');
  
  // ========================================
  // SHEET 4: Client Payments
  // ========================================
  const paymentsHeader = [
    ['CLIENT PAYMENTS (INFLOWS)'],
    [''],
    ['Project', 'Client', 'Date', 'Valuation', 'Amount', 'Type', 'Description'],
  ];
  
  const paymentRows: (string | number)[][] = [];
  state.projects.forEach(p => {
    p.payments.forEach(pay => {
      paymentRows.push([
        p.code,
        p.clientName,
        new Date(pay.date).toLocaleDateString('en-GB'),
        pay.valuationName || '',
        `£${pay.amount.toLocaleString()}`,
        pay.type === 'account' ? 'Account' : 'Fee',
        pay.description || '',
      ]);
    });
  });
  
  const paymentsData = [...paymentsHeader, ...paymentRows];
  const paymentsSheet = XLSX.utils.aoa_to_sheet(paymentsData);
  paymentsSheet['!cols'] = [
    colWidth(14), colWidth(20), colWidth(14), colWidth(10), colWidth(14), colWidth(12), colWidth(35)
  ];
  XLSX.utils.book_append_sheet(wb, paymentsSheet, 'Client Payments');
  
  // ========================================
  // SHEET 5: Supplier Costs
  // ========================================
  const supplierHeader = [
    ['SUPPLIER COSTS (OUTFLOWS)'],
    [''],
    ['Project', 'Client', 'Date', 'Amount', 'Supplier', 'Description'],
  ];
  
  const supplierRows: (string | number)[][] = [];
  state.projects.forEach(p => {
    p.supplierCosts.forEach(c => {
      supplierRows.push([
        p.code,
        p.clientName,
        new Date(c.date).toLocaleDateString('en-GB'),
        `£${c.amount.toLocaleString()}`,
        c.supplier,
        c.description || '',
      ]);
    });
  });
  
  const supplierData = [...supplierHeader, ...supplierRows];
  const supplierSheet = XLSX.utils.aoa_to_sheet(supplierData);
  supplierSheet['!cols'] = [
    colWidth(14), colWidth(20), colWidth(14), colWidth(14), colWidth(25), colWidth(35)
  ];
  XLSX.utils.book_append_sheet(wb, supplierSheet, 'Supplier Costs');
  
  // ========================================
  // SHEET 6: Fixed Costs
  // ========================================
  const fixedCosts = state.operationalCosts.filter(c => c.costType === 'fixed');
  const fixedHeader = [
    ['FIXED OPERATIONAL COSTS'],
    [''],
    ['Date', 'Amount', 'Category', 'Description', 'Recurring'],
  ];
  
  const fixedRows = fixedCosts.map(c => [
    new Date(c.date).toLocaleDateString('en-GB'),
    `£${c.amount.toLocaleString()}`,
    c.category,
    c.description || '',
    c.isRecurring ? 'Yes' : 'No',
  ]);
  
  const fixedData = [...fixedHeader, ...fixedRows];
  if (fixedRows.length === 0) {
    fixedData.push(['No fixed costs recorded', '', '', '', '']);
  }
  const fixedSheet = XLSX.utils.aoa_to_sheet(fixedData);
  fixedSheet['!cols'] = [
    colWidth(14), colWidth(14), colWidth(20), colWidth(35), colWidth(12)
  ];
  XLSX.utils.book_append_sheet(wb, fixedSheet, 'Fixed Costs');
  
  // ========================================
  // SHEET 7: Variable Costs
  // ========================================
  const variableCosts = state.operationalCosts.filter(c => c.costType === 'variable');
  const variableHeader = [
    ['VARIABLE OPERATIONAL COSTS'],
    [''],
    ['Date', 'Amount', 'Category', 'Description', 'Recurring'],
  ];
  
  const variableRows = variableCosts.map(c => [
    new Date(c.date).toLocaleDateString('en-GB'),
    `£${c.amount.toLocaleString()}`,
    c.category,
    c.description || '',
    c.isRecurring ? 'Yes' : 'No',
  ]);
  
  const variableData = [...variableHeader, ...variableRows];
  if (variableRows.length === 0) {
    variableData.push(['No variable costs recorded', '', '', '', '']);
  }
  const variableSheet = XLSX.utils.aoa_to_sheet(variableData);
  variableSheet['!cols'] = [
    colWidth(14), colWidth(14), colWidth(20), colWidth(35), colWidth(12)
  ];
  XLSX.utils.book_append_sheet(wb, variableSheet, 'Variable Costs');
  
  // Generate and download
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `HOC_Financial_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
