import * as XLSX from 'xlsx';

// Column width helper (in characters)
const colWidth = (width: number) => ({ wch: width });

// Create the HOC Dashboard Excel Template
export const generateExcelTemplate = () => {
  const wb = XLSX.utils.book_new();
  
  // ========================================
  // SHEET 1: Summary Dashboard
  // ========================================
  const summaryData = [
    ['HOUSE OF CLARENCE'],
    ['Financial Dashboard'],
    [''],
    ['Generated:', new Date().toLocaleDateString('en-GB')],
    [''],
    [''],
    ['QUICK STATS'],
    ['Metric', 'Value', 'Notes'],
    ['Total Projects', '', 'Auto-calculated from Projects sheet'],
    ['Active Projects', '', ''],
    ['Total Revenue (Gross)', '', ''],
    ['Total Costs', '', ''],
    ['Net Profit', '', ''],
    [''],
    [''],
    ['MONTHLY SUMMARY'],
    ['Month', 'Inflows', 'Project Costs', 'Op. Costs', 'Net'],
    ['January', '', '', '', ''],
    ['February', '', '', '', ''],
    ['March', '', '', '', ''],
    ['April', '', '', '', ''],
    ['May', '', '', '', ''],
    ['June', '', '', '', ''],
    ['July', '', '', '', ''],
    ['August', '', '', '', ''],
    ['September', '', '', '', ''],
    ['October', '', '', '', ''],
    ['November', '', '', '', ''],
    ['December', '', '', '', ''],
    [''],
    ['TOTAL', '', '', '', ''],
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [
    colWidth(20),  // Metric/Month
    colWidth(18),  // Value/Inflows
    colWidth(18),  // Notes/Project Costs
    colWidth(18),  // Op. Costs
    colWidth(18),  // Net
  ];
  // Merge cells for title
  summarySheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }, // Title
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } }, // Subtitle
  ];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
  
  // ========================================
  // SHEET 2: Projects
  // ========================================
  const projectsData = [
    ['PROJECTS'],
    [''],
    [
      'Project Code',
      'Client Name', 
      'Address',
      'Status',
      'CP Enabled',
      'Total Gross (£)',
      'Total Inflows (£)',
      'Total Costs (£)',
      'Profit (£)',
      'Margin (%)',
      'Created Date',
      'Notes'
    ],
    // Example row (can be deleted)
    ['P001', 'Example Client', '123 Example Street, London', 'Active', 'Yes', '50000', '20000', '15000', '5000', '25%', '01/01/2025', 'Sample project'],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', ''],
  ];
  
  const projectsSheet = XLSX.utils.aoa_to_sheet(projectsData);
  projectsSheet['!cols'] = [
    colWidth(14),  // Project Code
    colWidth(22),  // Client Name
    colWidth(35),  // Address
    colWidth(12),  // Status
    colWidth(12),  // CP Enabled
    colWidth(16),  // Total Gross
    colWidth(16),  // Total Inflows
    colWidth(16),  // Total Costs
    colWidth(14),  // Profit
    colWidth(12),  // Margin
    colWidth(14),  // Created Date
    colWidth(30),  // Notes
  ];
  projectsSheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }, // Title
  ];
  XLSX.utils.book_append_sheet(wb, projectsSheet, 'Projects');
  
  // ========================================
  // SHEET 3: Valuations
  // ========================================
  const valuationsData = [
    ['PROJECT VALUATIONS'],
    [''],
    [
      'Project Code',
      'Valuation',
      'Date',
      'Grand Total (£)',
      'Fees/CP (£)',
      'Omissions (£)',
      'VAT Rate (%)',
      'Subtotal (£)',
      'VAT (£)',
      'Gross (£)',
      'Notes'
    ],
    // Example rows
    ['P001', 'V1 - Deposit', '01/01/2025', '10000', '4000', '0', '20%', '6000', '1200', '11200', 'Initial deposit'],
    ['P001', 'V2 - Production', '15/02/2025', '35000', '14000', '500', '20%', '20500', '4100', '38600', 'Before production'],
    ['P001', 'V3 - Final', '01/04/2025', '5000', '2000', '0', '20%', '3000', '600', '5600', 'Final payment'],
    ['', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', ''],
  ];
  
  const valuationsSheet = XLSX.utils.aoa_to_sheet(valuationsData);
  valuationsSheet['!cols'] = [
    colWidth(14),  // Project Code
    colWidth(20),  // Valuation
    colWidth(14),  // Date
    colWidth(16),  // Grand Total
    colWidth(14),  // Fees/CP
    colWidth(14),  // Omissions
    colWidth(12),  // VAT Rate
    colWidth(14),  // Subtotal
    colWidth(12),  // VAT
    colWidth(14),  // Gross
    colWidth(30),  // Notes
  ];
  valuationsSheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 10 } },
  ];
  XLSX.utils.book_append_sheet(wb, valuationsSheet, 'Valuations');
  
  // ========================================
  // SHEET 4: Client Payments (Inflows)
  // ========================================
  const paymentsData = [
    ['CLIENT PAYMENTS (INFLOWS)'],
    [''],
    [
      'Project Code',
      'Client Name',
      'Date',
      'Amount (£)',
      'Type',
      'Valuation Ref',
      'Description',
      'Last Updated'
    ],
    // Example rows
    ['P001', 'Example Client', '05/01/2025', '11200', 'Account', 'V1', 'Deposit received', '05/01/2025'],
    ['P001', 'Example Client', '05/01/2025', '4000', 'Cash/Fee', 'V1', 'Fee portion', '05/01/2025'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    [''],
    ['PAYMENT TYPES:'],
    ['Account', 'VATable payments through company account'],
    ['Cash/Fee', 'Non-VAT fee payments (cash portion)'],
  ];
  
  const paymentsSheet = XLSX.utils.aoa_to_sheet(paymentsData);
  paymentsSheet['!cols'] = [
    colWidth(14),  // Project Code
    colWidth(22),  // Client Name
    colWidth(14),  // Date
    colWidth(14),  // Amount
    colWidth(12),  // Type
    colWidth(14),  // Valuation Ref
    colWidth(30),  // Description
    colWidth(14),  // Last Updated
  ];
  paymentsSheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } },
  ];
  XLSX.utils.book_append_sheet(wb, paymentsSheet, 'Client Payments');
  
  // ========================================
  // SHEET 5: Supplier Costs (Outflows)
  // ========================================
  const supplierCostsData = [
    ['SUPPLIER COSTS (OUTFLOWS)'],
    [''],
    [
      'Project Code',
      'Client Name',
      'Date',
      'Amount (£)',
      'Supplier',
      'Description',
      'Last Updated'
    ],
    // Example rows
    ['P001', 'Example Client', '10/01/2025', '8000', 'Fabric Supplier Ltd', 'Fabric and materials', '10/01/2025'],
    ['P001', 'Example Client', '20/01/2025', '3500', 'Joinery Works', 'Custom joinery', '20/01/2025'],
    ['P001', 'Example Client', '15/02/2025', '2500', 'Installation Team', 'Installation labour', '15/02/2025'],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
  ];
  
  const supplierCostsSheet = XLSX.utils.aoa_to_sheet(supplierCostsData);
  supplierCostsSheet['!cols'] = [
    colWidth(14),  // Project Code
    colWidth(22),  // Client Name
    colWidth(14),  // Date
    colWidth(14),  // Amount
    colWidth(25),  // Supplier
    colWidth(35),  // Description
    colWidth(14),  // Last Updated
  ];
  supplierCostsSheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
  ];
  XLSX.utils.book_append_sheet(wb, supplierCostsSheet, 'Supplier Costs');
  
  // ========================================
  // SHEET 6: Operational Costs (Fixed)
  // ========================================
  const fixedCostsData = [
    ['FIXED OPERATIONAL COSTS'],
    ['Recurring business expenses that remain relatively constant'],
    [''],
    [
      'Date',
      'Amount (£)',
      'Category',
      'Description',
      'Recurring?',
      'Last Updated'
    ],
    // Example rows
    ['01/01/2025', '14400', 'Showroom Rent', 'Monthly showroom rent', 'Yes', '01/01/2025'],
    ['01/01/2025', '4800', 'Insurance', 'Annual insurance premium', 'No', '01/01/2025'],
    ['01/01/2025', '5000', 'Business Rates', 'Monthly business rates', 'Yes', '01/01/2025'],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    [''],
    ['COMMON FIXED CATEGORIES:'],
    ['Warehouse Rent', 'Showroom Rent', 'Insurance', 'Business Rates'],
    ['Service Charge', 'Professional Fees', 'Rental Deposit', 'Software'],
  ];
  
  const fixedCostsSheet = XLSX.utils.aoa_to_sheet(fixedCostsData);
  fixedCostsSheet['!cols'] = [
    colWidth(14),  // Date
    colWidth(14),  // Amount
    colWidth(22),  // Category
    colWidth(35),  // Description
    colWidth(12),  // Recurring
    colWidth(14),  // Last Updated
  ];
  fixedCostsSheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
  ];
  XLSX.utils.book_append_sheet(wb, fixedCostsSheet, 'Fixed Costs');
  
  // ========================================
  // SHEET 7: Operational Costs (Variable)
  // ========================================
  const variableCostsData = [
    ['VARIABLE OPERATIONAL COSTS'],
    ['Business expenses that fluctuate based on activity'],
    [''],
    [
      'Date',
      'Amount (£)',
      'Category',
      'Description',
      'Recurring?',
      'Last Updated'
    ],
    // Example rows
    ['01/03/2025', '12292', 'Salaries', 'March salaries', 'No', '01/03/2025'],
    ['01/04/2025', '18875', 'Salaries', 'April salaries', 'No', '01/04/2025'],
    ['01/03/2025', '600', 'Miscellaneous', 'Various expenses', 'No', '01/03/2025'],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    ['', '', '', '', '', ''],
    [''],
    ['COMMON VARIABLE CATEGORIES:'],
    ['Salaries', 'Contractors', 'Commissions', 'Marketing'],
    ['Transport', 'Miscellaneous', 'Professional Services', 'Travel'],
  ];
  
  const variableCostsSheet = XLSX.utils.aoa_to_sheet(variableCostsData);
  variableCostsSheet['!cols'] = [
    colWidth(14),  // Date
    colWidth(14),  // Amount
    colWidth(22),  // Category
    colWidth(35),  // Description
    colWidth(12),  // Recurring
    colWidth(14),  // Last Updated
  ];
  variableCostsSheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
  ];
  XLSX.utils.book_append_sheet(wb, variableCostsSheet, 'Variable Costs');
  
  // ========================================
  // SHEET 8: Reference / Info
  // ========================================
  const referenceData = [
    ['HOUSE OF CLARENCE - DATA REFERENCE'],
    [''],
    [''],
    ['PAYMENT TERMS'],
    ['Stage', 'Percentage', 'Description'],
    ['Deposit (V1)', '20%', 'Upfront payment before work begins'],
    ['Production (V2)', '70%', 'Payment before production/manufacturing'],
    ['Final (V3)', '10%', 'Final payment on delivery/completion'],
    [''],
    [''],
    ['FEE/CASH SPLIT (When CP Enabled)'],
    ['Type', 'Percentage', 'Tax Treatment'],
    ['Account', '60%', 'VATable - goes through company account'],
    ['Cash/Fee', '40%', 'Non-VAT - separate fee arrangement'],
    [''],
    [''],
    ['PROJECT STATUSES'],
    ['Status', 'Description'],
    ['Active', 'Currently in progress'],
    ['Completed', 'Finished and delivered'],
    ['On Hold', 'Temporarily paused'],
    [''],
    [''],
    ['SHEET OVERVIEW'],
    ['Sheet Name', 'Purpose'],
    ['Summary', 'High-level financial overview and monthly totals'],
    ['Projects', 'All projects with key metrics'],
    ['Valuations', 'Detailed breakdown of each project valuation'],
    ['Client Payments', 'All incoming payments from clients'],
    ['Supplier Costs', 'All outgoing payments to suppliers'],
    ['Fixed Costs', 'Regular operational expenses (rent, insurance, etc.)'],
    ['Variable Costs', 'Fluctuating expenses (salaries, misc, etc.)'],
    [''],
    [''],
    ['NOTES'],
    ['• All amounts are in GBP (£)'],
    ['• Dates should be in DD/MM/YYYY format'],
    ['• VAT rate is typically 20% unless specified otherwise'],
    ['• This template syncs with the HOC Dashboard'],
  ];
  
  const referenceSheet = XLSX.utils.aoa_to_sheet(referenceData);
  referenceSheet['!cols'] = [
    colWidth(22),  // Column 1
    colWidth(18),  // Column 2
    colWidth(45),  // Column 3
  ];
  referenceSheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },
  ];
  XLSX.utils.book_append_sheet(wb, referenceSheet, 'Reference');
  
  // Generate and download
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `HOC_Dashboard_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
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
  const timestamp = new Date().toISOString();
  
  // Projects sheet
  const projectsData = [
    ['Project Code', 'Client Name', 'Address', 'Status', 'CP Enabled', 'Created Date', 'Notes', 'Last Export'],
    ...state.projects.map(p => [
      p.code,
      p.clientName,
      p.address || '',
      p.status,
      p.hasCashPayment ? 'Yes' : 'No',
      new Date(p.createdAt).toLocaleDateString('en-GB'),
      p.notes || '',
      timestamp
    ])
  ];
  const projectsSheet = XLSX.utils.aoa_to_sheet(projectsData);
  projectsSheet['!cols'] = [
    colWidth(14), colWidth(22), colWidth(35), colWidth(12), 
    colWidth(12), colWidth(14), colWidth(30), colWidth(20)
  ];
  XLSX.utils.book_append_sheet(wb, projectsSheet, 'Projects');
  
  // Valuations sheet
  const valuationsData = [
    ['Project Code', 'Valuation', 'Date', 'Grand Total', 'Fees', 'Omissions', 'VAT Rate', 'Notes', 'Last Export'],
    ...state.projects.flatMap(p => 
      p.valuations.map(v => [
        p.code,
        v.name,
        new Date(v.date).toLocaleDateString('en-GB'),
        v.grandTotal,
        v.fees,
        v.omissions,
        `${(v.vatRate * 100).toFixed(0)}%`,
        v.notes || '',
        timestamp
      ])
    )
  ];
  const valuationsSheet = XLSX.utils.aoa_to_sheet(valuationsData);
  valuationsSheet['!cols'] = [
    colWidth(14), colWidth(20), colWidth(14), colWidth(14),
    colWidth(14), colWidth(14), colWidth(12), colWidth(30), colWidth(20)
  ];
  XLSX.utils.book_append_sheet(wb, valuationsSheet, 'Valuations');
  
  // Payments sheet
  const paymentsData = [
    ['Project Code', 'Client', 'Date', 'Amount', 'Type', 'Description', 'Last Export'],
    ...state.projects.flatMap(p => 
      p.payments.map(pay => [
        p.code,
        p.clientName,
        new Date(pay.date).toLocaleDateString('en-GB'),
        pay.amount,
        pay.type === 'account' ? 'Account' : 'Cash/Fee',
        pay.description || '',
        timestamp
      ])
    )
  ];
  const paymentsSheet = XLSX.utils.aoa_to_sheet(paymentsData);
  paymentsSheet['!cols'] = [
    colWidth(14), colWidth(22), colWidth(14), colWidth(14),
    colWidth(12), colWidth(35), colWidth(20)
  ];
  XLSX.utils.book_append_sheet(wb, paymentsSheet, 'Client Payments');
  
  // Supplier Costs sheet
  const supplierData = [
    ['Project Code', 'Client', 'Date', 'Amount', 'Supplier', 'Description', 'Last Export'],
    ...state.projects.flatMap(p => 
      p.supplierCosts.map(c => [
        p.code,
        p.clientName,
        new Date(c.date).toLocaleDateString('en-GB'),
        c.amount,
        c.supplier,
        c.description || '',
        timestamp
      ])
    )
  ];
  const supplierSheet = XLSX.utils.aoa_to_sheet(supplierData);
  supplierSheet['!cols'] = [
    colWidth(14), colWidth(22), colWidth(14), colWidth(14),
    colWidth(25), colWidth(35), colWidth(20)
  ];
  XLSX.utils.book_append_sheet(wb, supplierSheet, 'Supplier Costs');
  
  // Fixed Costs sheet
  const fixedCosts = state.operationalCosts.filter(c => c.costType === 'fixed');
  const fixedData = [
    ['Date', 'Amount', 'Category', 'Description', 'Recurring', 'Last Export'],
    ...fixedCosts.map(c => [
      new Date(c.date).toLocaleDateString('en-GB'),
      c.amount,
      c.category,
      c.description || '',
      c.isRecurring ? 'Yes' : 'No',
      timestamp
    ])
  ];
  const fixedSheet = XLSX.utils.aoa_to_sheet(fixedData);
  fixedSheet['!cols'] = [
    colWidth(14), colWidth(14), colWidth(22), colWidth(35), colWidth(12), colWidth(20)
  ];
  XLSX.utils.book_append_sheet(wb, fixedSheet, 'Fixed Costs');
  
  // Variable Costs sheet
  const variableCosts = state.operationalCosts.filter(c => c.costType === 'variable');
  const variableData = [
    ['Date', 'Amount', 'Category', 'Description', 'Recurring', 'Last Export'],
    ...variableCosts.map(c => [
      new Date(c.date).toLocaleDateString('en-GB'),
      c.amount,
      c.category,
      c.description || '',
      c.isRecurring ? 'Yes' : 'No',
      timestamp
    ])
  ];
  const variableSheet = XLSX.utils.aoa_to_sheet(variableData);
  variableSheet['!cols'] = [
    colWidth(14), colWidth(14), colWidth(22), colWidth(35), colWidth(12), colWidth(20)
  ];
  XLSX.utils.book_append_sheet(wb, variableSheet, 'Variable Costs');
  
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

