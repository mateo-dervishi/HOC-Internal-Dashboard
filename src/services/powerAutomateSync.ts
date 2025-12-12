// Power Automate Sync Service
// Sends dashboard data to a Power Automate HTTP webhook which then updates SharePoint

import { calculateProjectFinancials } from '../types';

interface SyncPayload {
  timestamp: string;
  summary: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    onHoldProjects: number;
    totalGross: number;
    totalInflows: number;
    totalOutstanding: number;
    totalSupplierCosts: number;
    projectProfit: number;
    fixedCosts: number;
    variableCosts: number;
    totalOperationalCosts: number;
    netProfit: number;
  };
  projects: Array<{
    code: string;
    clientName: string;
    address: string;
    status: string;
    feesEnabled: boolean;
    gross: number;
    inflows: number;
    outstanding: number;
    supplierCosts: number;
    profit: number;
    valuations: Array<{
      name: string;
      date: string;
      grandTotal: number;
      fees: number;
      omissions: number;
      vatRate: number;
      subtotal: number;
      vat: number;
      gross: number;
    }>;
    payments: Array<{
      date: string;
      valuationName: string;
      type: string;
      amount: number;
      vatRate: number;
      vatAmount: number;
      total: number;
      description: string;
    }>;
    supplierCostsList: Array<{
      date: string;
      supplier: string;
      amount: number;
      description: string;
    }>;
  }>;
  operationalCosts: Array<{
    date: string;
    type: string;
    category: string;
    amount: number;
    description: string;
    isRecurring: boolean;
  }>;
}

export const prepareSyncPayload = (state: {
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
}): SyncPayload => {
  // Calculate summary totals
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

  const fixedCosts = state.operationalCosts
    .filter(c => c.costType === 'fixed')
    .reduce((sum, c) => sum + c.amount, 0);
  const variableCosts = state.operationalCosts
    .filter(c => c.costType === 'variable')
    .reduce((sum, c) => sum + c.amount, 0);

  return {
    timestamp: new Date().toISOString(),
    summary: {
      totalProjects: state.projects.length,
      activeProjects: state.projects.filter(p => p.status === 'active').length,
      completedProjects: state.projects.filter(p => p.status === 'completed').length,
      onHoldProjects: state.projects.filter(p => p.status === 'on_hold').length,
      totalGross,
      totalInflows,
      totalOutstanding: totalGross - totalInflows,
      totalSupplierCosts,
      projectProfit: totalProjectProfit,
      fixedCosts,
      variableCosts,
      totalOperationalCosts: fixedCosts + variableCosts,
      netProfit: totalProjectProfit - fixedCosts - variableCosts,
    },
    projects: state.projects.map(p => {
      const fin = calculateProjectFinancials(p);
      return {
        code: p.code,
        clientName: p.clientName,
        address: p.address || '',
        status: p.status,
        feesEnabled: p.hasCashPayment,
        gross: fin.totalGross,
        inflows: fin.totalInflows,
        outstanding: fin.totalGross - fin.totalInflows,
        supplierCosts: fin.totalSupplierCosts,
        profit: fin.grossProfit,
        valuations: p.valuations.map(v => {
          const omissions = v.omissions || 0;
          const subtotal = v.grandTotal - v.fees - omissions;
          const vat = subtotal * v.vatRate;
          const gross = v.grandTotal - omissions + vat;
          return {
            name: v.name,
            date: v.date,
            grandTotal: v.grandTotal,
            fees: v.fees,
            omissions,
            vatRate: v.vatRate,
            subtotal,
            vat,
            gross,
          };
        }),
        payments: p.payments.map(pay => {
          const vatRate = pay.type === 'cash' ? 0 : (pay.vatRate || 0);
          const vatAmount = pay.amount * vatRate;
          return {
            date: pay.date,
            valuationName: pay.valuationName || '',
            type: pay.type === 'account' ? 'Account' : 'Fee',
            amount: pay.amount,
            vatRate,
            vatAmount,
            total: pay.amount + vatAmount,
            description: pay.description || '',
          };
        }),
        supplierCostsList: p.supplierCosts.map(c => ({
          date: c.date,
          supplier: c.supplier,
          amount: c.amount,
          description: c.description || '',
        })),
      };
    }),
    operationalCosts: state.operationalCosts.map(c => ({
      date: c.date,
      type: c.costType === 'fixed' ? 'Fixed' : 'Variable',
      category: c.category,
      amount: c.amount,
      description: c.description || '',
      isRecurring: c.isRecurring || false,
    })),
  };
};

export const syncToPowerAutomate = async (
  webhookUrl: string,
  state: Parameters<typeof prepareSyncPayload>[0]
): Promise<{ success: boolean; message: string }> => {
  if (!webhookUrl) {
    return { success: false, message: 'No webhook URL configured' };
  }

  try {
    const payload = prepareSyncPayload(state);
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return { success: true, message: 'Synced successfully to SharePoint' };
    } else {
      const errorText = await response.text();
      return { success: false, message: `Sync failed: ${response.status} - ${errorText}` };
    }
  } catch (error) {
    console.error('Power Automate sync error:', error);
    return { success: false, message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
};

