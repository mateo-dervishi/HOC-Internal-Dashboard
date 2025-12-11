import type { DashboardState, Project, OperationalCost } from '../types';
import { calculateProjectFinancials } from '../types';

const WEBHOOK_URL_KEY = 'hoc_excel_webhook_url';
const SYNC_ENABLED_KEY = 'hoc_excel_sync_enabled';

// Get stored webhook URL
export const getWebhookUrl = (): string | null => {
  return localStorage.getItem(WEBHOOK_URL_KEY);
};

// Set webhook URL
export const setWebhookUrl = (url: string): void => {
  localStorage.setItem(WEBHOOK_URL_KEY, url);
};

// Check if sync is enabled
export const isSyncEnabled = (): boolean => {
  return localStorage.getItem(SYNC_ENABLED_KEY) === 'true';
};

// Enable/disable sync
export const setSyncEnabled = (enabled: boolean): void => {
  localStorage.setItem(SYNC_ENABLED_KEY, enabled ? 'true' : 'false');
};

// Format date for Excel
const formatDate = (date: string): string => {
  return new Date(date).toISOString();
};

// Format currency for Excel (plain number)
const formatAmount = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};

// Transform project data for Excel
const transformProjectForExcel = (project: Project) => {
  const financials = calculateProjectFinancials(project);
  
  return {
    ProjectCode: project.code,
    Client: project.clientName,
    Address: project.address || '',
    Status: project.status,
    HasCashPayment: project.hasCashPayment ? 'Yes' : 'No',
    TotalGross: formatAmount(financials.totalGross),
    TotalInflows: formatAmount(financials.totalInflows),
    TotalCosts: formatAmount(financials.totalSupplierCosts),
    Profit: formatAmount(financials.grossProfit),
    ProfitMargin: formatAmount(financials.profitMargin),
    LastUpdated: new Date().toISOString(),
  };
};

// Transform payment for Excel
const transformPaymentForExcel = (project: Project, payment: Project['payments'][0]) => {
  return {
    ProjectCode: project.code,
    Client: project.clientName,
    Date: formatDate(payment.date),
    Amount: formatAmount(payment.amount),
    Type: payment.type === 'account' ? 'Account' : 'Cash/Fee',
    Description: payment.description || '',
    ValuationName: payment.valuationName || '',
    LastUpdated: new Date().toISOString(),
  };
};

// Transform supplier cost for Excel
const transformSupplierCostForExcel = (project: Project, cost: Project['supplierCosts'][0]) => {
  return {
    ProjectCode: project.code,
    Client: project.clientName,
    Date: formatDate(cost.date),
    Amount: formatAmount(cost.amount),
    Supplier: cost.supplier,
    Description: cost.description || '',
    LastUpdated: new Date().toISOString(),
  };
};

// Transform operational cost for Excel
const transformOperationalCostForExcel = (cost: OperationalCost) => {
  return {
    Date: formatDate(cost.date),
    Amount: formatAmount(cost.amount),
    Category: cost.category,
    CostType: cost.costType === 'fixed' ? 'Fixed' : 'Variable',
    Description: cost.description || '',
    IsRecurring: cost.isRecurring ? 'Yes' : 'No',
    LastUpdated: new Date().toISOString(),
  };
};

// Main sync function - sends all data to Power Automate
export const syncToExcel = async (state: DashboardState): Promise<{ success: boolean; error?: string }> => {
  const webhookUrl = getWebhookUrl();
  
  if (!webhookUrl) {
    return { success: false, error: 'No webhook URL configured' };
  }
  
  if (!isSyncEnabled()) {
    return { success: false, error: 'Sync is disabled' };
  }
  
  try {
    // Transform all data
    const projects = state.projects.map(transformProjectForExcel);
    
    const payments: ReturnType<typeof transformPaymentForExcel>[] = [];
    const supplierCosts: ReturnType<typeof transformSupplierCostForExcel>[] = [];
    
    state.projects.forEach(project => {
      project.payments.forEach(payment => {
        payments.push(transformPaymentForExcel(project, payment));
      });
      project.supplierCosts.forEach(cost => {
        supplierCosts.push(transformSupplierCostForExcel(project, cost));
      });
    });
    
    const operationalCosts = state.operationalCosts.map(transformOperationalCostForExcel);
    
    // Prepare payload
    const payload = {
      action: 'sync_all',
      timestamp: new Date().toISOString(),
      summary: {
        totalProjects: projects.length,
        totalPayments: payments.length,
        totalSupplierCosts: supplierCosts.length,
        totalOperationalCosts: operationalCosts.length,
      },
      projects,
      payments,
      supplierCosts,
      operationalCosts,
    };
    
    // Send to Power Automate
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log('✅ Excel sync successful');
    return { success: true };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Excel sync failed:', errorMessage);
    return { success: false, error: errorMessage };
  }
};

// Test the webhook connection
export const testWebhookConnection = async (): Promise<{ success: boolean; error?: string }> => {
  const webhookUrl = getWebhookUrl();
  
  if (!webhookUrl) {
    return { success: false, error: 'No webhook URL configured' };
  }
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'test',
        timestamp: new Date().toISOString(),
        message: 'Connection test from HOC Dashboard',
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return { success: true };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

