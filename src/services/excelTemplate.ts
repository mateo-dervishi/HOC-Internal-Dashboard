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
      omissions: number;
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
    ['Project', 'Client', 'Valuation', 'Date', 'Grand Total', 'Fees', 'Omissions', 'VAT Rate', 'Subtotal', 'VAT', 'Gross'],
  ];
  
  const valuationRows: (string | number)[][] = [];
  state.projects.forEach(p => {
    p.valuations.forEach(v => {
      const omissions = v.omissions || 0;
      const subtotal = v.grandTotal - v.fees - omissions;
      const vat = subtotal * v.vatRate;
      const gross = v.grandTotal - omissions + vat;
      valuationRows.push([
        p.code,
        p.clientName,
        v.name,
        new Date(v.date).toLocaleDateString('en-GB'),
        `£${v.grandTotal.toLocaleString()}`,
        `£${v.fees.toLocaleString()}`,
        `£${omissions.toLocaleString()}`,
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
    colWidth(12), colWidth(12), colWidth(10), colWidth(14), colWidth(12), colWidth(14)
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
  
  // ========================================
  // INDIVIDUAL PROJECT SHEETS
  // ========================================
  state.projects.forEach(p => {
    const fin = calculateProjectFinancials(p);
    
    // Sheet name (max 31 chars, no special chars)
    const sheetName = `P-${p.code}`.slice(0, 31).replace(/[\\/*?[\]]/g, '');
    
    const projectData: (string | number)[][] = [
      [`PROJECT: ${p.code}`],
      [''],
      ['CLIENT DETAILS'],
      ['Client Name', p.clientName],
      ['Address', p.address || 'N/A'],
      ['Status', p.status.charAt(0).toUpperCase() + p.status.slice(1)],
      ['Fees Enabled', p.hasCashPayment ? 'Yes' : 'No'],
      ['Created', new Date(p.createdAt).toLocaleDateString('en-GB')],
      [''],
      ['FINANCIAL SUMMARY'],
      ['Gross Value', `£${fin.totalGross.toLocaleString()}`],
      ['Total Inflows', `£${fin.totalInflows.toLocaleString()}`],
      ['Supplier Costs', `£${fin.totalSupplierCosts.toLocaleString()}`],
      ['Project Profit', `£${fin.grossProfit.toLocaleString()}`],
      ['Outstanding', `£${(fin.totalGross - fin.totalInflows).toLocaleString()}`],
      [''],
    ];
    
    // Contract Values (Valuations)
    projectData.push(['CONTRACT VALUES']);
    if (p.valuations.length > 0) {
      projectData.push(['Name', 'Date', 'Grand Total', 'Fees', 'Omissions', 'Subtotal', 'VAT', 'Gross']);
      p.valuations.forEach(v => {
        const omissions = v.omissions || 0;
        const subtotal = v.grandTotal - v.fees - omissions;
        const vat = subtotal * v.vatRate;
        const gross = v.grandTotal - omissions + vat;
        projectData.push([
          v.name,
          new Date(v.date).toLocaleDateString('en-GB'),
          `£${v.grandTotal.toLocaleString()}`,
          `£${v.fees.toLocaleString()}`,
          `£${omissions.toLocaleString()}`,
          `£${subtotal.toLocaleString()}`,
          `£${vat.toLocaleString()}`,
          `£${gross.toLocaleString()}`,
        ]);
      });
    } else {
      projectData.push(['No contract values recorded']);
    }
    projectData.push(['']);
    
    // Payments Received
    projectData.push(['PAYMENTS RECEIVED']);
    if (p.payments.length > 0) {
      projectData.push(['Date', 'Valuation', 'Type', 'Amount', 'VAT Rate', 'Total', 'Description']);
      p.payments.forEach(pay => {
        const vatRate = pay.type === 'cash' ? 0 : ((pay as { vatRate?: number }).vatRate || 0);
        const vatAmount = pay.amount * vatRate;
        const total = pay.amount + vatAmount;
        projectData.push([
          new Date(pay.date).toLocaleDateString('en-GB'),
          pay.valuationName || '-',
          pay.type === 'account' ? 'Account' : 'Fee',
          `£${pay.amount.toLocaleString()}`,
          `${(vatRate * 100).toFixed(0)}%`,
          `£${total.toLocaleString()}`,
          pay.description || '-',
        ]);
      });
      // Total
      const totalPayments = fin.totalInflows;
      projectData.push(['', '', '', '', 'TOTAL:', `£${totalPayments.toLocaleString()}`, '']);
    } else {
      projectData.push(['No payments recorded']);
    }
    projectData.push(['']);
    
    // Supplier Costs
    projectData.push(['SUPPLIER COSTS']);
    if (p.supplierCosts.length > 0) {
      projectData.push(['Date', 'Supplier', 'Amount', 'Description']);
      p.supplierCosts.forEach(c => {
        projectData.push([
          new Date(c.date).toLocaleDateString('en-GB'),
          c.supplier,
          `£${c.amount.toLocaleString()}`,
          c.description || '-',
        ]);
      });
      // Total
      projectData.push(['', 'TOTAL:', `£${fin.totalSupplierCosts.toLocaleString()}`, '']);
    } else {
      projectData.push(['No supplier costs recorded']);
    }
    
    const projectSheet = XLSX.utils.aoa_to_sheet(projectData);
    projectSheet['!cols'] = [
      colWidth(18), colWidth(14), colWidth(14), colWidth(14),
      colWidth(12), colWidth(14), colWidth(14), colWidth(30)
    ];
    XLSX.utils.book_append_sheet(wb, projectSheet, sheetName);
  });
  
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

// Generate Excel as Blob (for SharePoint upload)
export const generateExcelBlob = (state: {
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
      omissions: number;
      vatRate: number;
      notes?: string;
    }>;
    payments: Array<{
      id: string;
      date: string;
      amount: number;
      type: 'account' | 'cash';
      vatRate?: number;
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
}): Blob => {
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
  
  // SHEET 1: Overview/Summary
  const summaryData = [
    ['HOUSE OF CLARENCE - DASHBOARD SYNC'],
    [''],
    ['Last Updated:', today + ' ' + new Date().toLocaleTimeString('en-GB')],
    [''],
    [''],
    ['OVERVIEW'],
    ['Metric', 'Value'],
    ['Total Projects', state.projects.length],
    ['Active Projects', state.projects.filter(p => p.status === 'active').length],
    ['Completed Projects', state.projects.filter(p => p.status === 'completed').length],
    ['On Hold', state.projects.filter(p => p.status === 'on_hold').length],
    [''],
    ['FINANCIALS'],
    ['Total Gross (Contract Values)', `£${totalGross.toLocaleString()}`],
    ['Total Client Payments', `£${totalInflows.toLocaleString()}`],
    ['Total Outstanding', `£${(totalGross - totalInflows).toLocaleString()}`],
    ['Total Supplier Costs', `£${totalSupplierCosts.toLocaleString()}`],
    ['Project Profit', `£${totalProjectProfit.toLocaleString()}`],
    [''],
    ['OPERATIONAL COSTS'],
    ['Fixed Costs', `£${totalFixedCosts.toLocaleString()}`],
    ['Variable Costs', `£${totalVariableCosts.toLocaleString()}`],
    ['Total Operational', `£${totalOpCosts.toLocaleString()}`],
    [''],
    ['NET PROFIT', `£${netProfit.toLocaleString()}`],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [colWidth(30), colWidth(25)];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Overview');
  
  // SHEET 2: All Projects
  const projectsHeader = [
    ['ALL PROJECTS'],
    [''],
    ['Code', 'Client', 'Address', 'Status', 'Fees Enabled', 'Gross', 'Inflows', 'Outstanding', 'Costs', 'Profit'],
  ];
  
  const projectRows = state.projects.map(p => {
    const fin = calculateProjectFinancials(p);
    return [
      p.code,
      p.clientName,
      p.address || '',
      p.status.charAt(0).toUpperCase() + p.status.slice(1),
      p.hasCashPayment ? 'Yes' : 'No',
      `£${fin.totalGross.toLocaleString()}`,
      `£${fin.totalInflows.toLocaleString()}`,
      `£${(fin.totalGross - fin.totalInflows).toLocaleString()}`,
      `£${fin.totalSupplierCosts.toLocaleString()}`,
      `£${fin.grossProfit.toLocaleString()}`,
    ];
  });
  
  const projectsData = [...projectsHeader, ...projectRows];
  const projectsSheet = XLSX.utils.aoa_to_sheet(projectsData);
  projectsSheet['!cols'] = [
    colWidth(14), colWidth(20), colWidth(30), colWidth(12), colWidth(12),
    colWidth(14), colWidth(14), colWidth(14), colWidth(14), colWidth(14)
  ];
  XLSX.utils.book_append_sheet(wb, projectsSheet, 'Projects');
  
  // SHEET 3: All Costs (Fixed + Variable)
  const costsHeader = [
    ['OPERATIONAL COSTS'],
    [''],
    ['Date', 'Type', 'Category', 'Amount', 'Description', 'Recurring'],
  ];
  
  const costsRows = state.operationalCosts
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(c => [
      new Date(c.date).toLocaleDateString('en-GB'),
      c.costType === 'fixed' ? 'Fixed' : 'Variable',
      c.category,
      `£${c.amount.toLocaleString()}`,
      c.description || '',
      c.isRecurring ? 'Yes' : 'No',
    ]);
  
  const costsData = [...costsHeader, ...costsRows];
  const costsSheet = XLSX.utils.aoa_to_sheet(costsData);
  costsSheet['!cols'] = [
    colWidth(14), colWidth(12), colWidth(20), colWidth(14), colWidth(35), colWidth(10)
  ];
  XLSX.utils.book_append_sheet(wb, costsSheet, 'Costs');
  
  // Individual project sheets
  state.projects.forEach(p => {
    const fin = calculateProjectFinancials(p);
    const sheetName = `P-${p.code}`.slice(0, 31).replace(/[\\/*?[\]]/g, '');
    
    const projectData: (string | number)[][] = [
      [`PROJECT: ${p.code}`],
      [''],
      ['CLIENT DETAILS'],
      ['Client Name', p.clientName],
      ['Address', p.address || 'N/A'],
      ['Status', p.status.charAt(0).toUpperCase() + p.status.slice(1)],
      ['Fees Enabled', p.hasCashPayment ? 'Yes' : 'No'],
      [''],
      ['FINANCIAL SUMMARY'],
      ['Gross Value', `£${fin.totalGross.toLocaleString()}`],
      ['Total Received', `£${fin.totalInflows.toLocaleString()}`],
      ['Outstanding', `£${(fin.totalGross - fin.totalInflows).toLocaleString()}`],
      ['Supplier Costs', `£${fin.totalSupplierCosts.toLocaleString()}`],
      ['Project Profit', `£${fin.grossProfit.toLocaleString()}`],
      [''],
    ];
    
    // Contract Values
    projectData.push(['CONTRACT VALUES']);
    if (p.valuations.length > 0) {
      projectData.push(['Name', 'Date', 'Grand Total', 'Fees', 'Omissions', 'Subtotal', 'VAT', 'Gross']);
      p.valuations.forEach(v => {
        const omissions = v.omissions || 0;
        const subtotal = v.grandTotal - v.fees - omissions;
        const vat = subtotal * v.vatRate;
        const gross = v.grandTotal - omissions + vat;
        projectData.push([
          v.name,
          new Date(v.date).toLocaleDateString('en-GB'),
          `£${v.grandTotal.toLocaleString()}`,
          `£${v.fees.toLocaleString()}`,
          `£${omissions.toLocaleString()}`,
          `£${subtotal.toLocaleString()}`,
          `£${vat.toLocaleString()}`,
          `£${gross.toLocaleString()}`,
        ]);
      });
    } else {
      projectData.push(['No contract values recorded']);
    }
    projectData.push(['']);
    
    // Payments
    projectData.push(['PAYMENTS RECEIVED']);
    if (p.payments.length > 0) {
      projectData.push(['Date', 'Valuation', 'Type', 'Amount', 'VAT', 'Total', 'Description']);
      p.payments.forEach(pay => {
        const vatRate = pay.type === 'cash' ? 0 : (pay.vatRate || 0);
        const vatAmount = pay.amount * vatRate;
        const total = pay.amount + vatAmount;
        projectData.push([
          new Date(pay.date).toLocaleDateString('en-GB'),
          pay.valuationName || '-',
          pay.type === 'account' ? 'Account' : 'Fee',
          `£${pay.amount.toLocaleString()}`,
          `£${vatAmount.toLocaleString()} (${(vatRate * 100).toFixed(0)}%)`,
          `£${total.toLocaleString()}`,
          pay.description || '-',
        ]);
      });
    } else {
      projectData.push(['No payments recorded']);
    }
    projectData.push(['']);
    
    // Supplier Costs
    projectData.push(['SUPPLIER COSTS']);
    if (p.supplierCosts.length > 0) {
      projectData.push(['Date', 'Supplier', 'Amount', 'Description']);
      p.supplierCosts.forEach(c => {
        projectData.push([
          new Date(c.date).toLocaleDateString('en-GB'),
          c.supplier,
          `£${c.amount.toLocaleString()}`,
          c.description || '-',
        ]);
      });
    } else {
      projectData.push(['No supplier costs recorded']);
    }
    
    const projectSheet = XLSX.utils.aoa_to_sheet(projectData);
    projectSheet['!cols'] = [
      colWidth(18), colWidth(14), colWidth(14), colWidth(14),
      colWidth(16), colWidth(14), colWidth(14), colWidth(30)
    ];
    XLSX.utils.book_append_sheet(wb, projectSheet, sheetName);
  });
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};
