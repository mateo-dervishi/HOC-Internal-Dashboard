export type PaymentType = 'full_account' | 'cash_payment';

export interface PaymentTerms {
  upfront: number;      // 20%
  production: number;   // 70%
  delivery: number;     // 10%
}

export interface PaymentBreakdown {
  account: number;      // 60% if CP, 100% if full account
  cash: number;         // 40% if CP, 0% if full account
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  stage: 'upfront' | 'production' | 'delivery';
  type: 'account' | 'cash';
  description?: string;
}

export interface SupplierCost {
  id: string;
  date: string;
  amount: number;
  supplier: string;
  description?: string;
}

export interface Project {
  id: string;
  code: string;           // e.g., "P39"
  clientName: string;     // e.g., "Lydia"
  totalValue: number;     // Total project value
  paymentType: PaymentType;
  payments: Payment[];
  supplierCosts: SupplierCost[];
  createdAt: string;
  status: 'active' | 'completed' | 'on_hold';
  notes?: string;
}

export interface OperationalCost {
  id: string;
  date: string;
  amount: number;
  category: string;
  description?: string;
}

export interface DashboardState {
  projects: Project[];
  operationalCosts: OperationalCost[];
}

// Helper to calculate payment breakdown based on type
export const calculatePaymentBreakdown = (
  totalValue: number,
  paymentType: PaymentType
): { accountTotal: number; cashTotal: number } => {
  if (paymentType === 'cash_payment') {
    return {
      accountTotal: totalValue * 0.6,
      cashTotal: totalValue * 0.4,
    };
  }
  return {
    accountTotal: totalValue,
    cashTotal: 0,
  };
};

// Helper to calculate expected payments at each stage
export const calculateExpectedPayments = (
  totalValue: number,
  paymentType: PaymentType
): {
  upfront: { account: number; cash: number };
  production: { account: number; cash: number };
  delivery: { account: number; cash: number };
} => {
  const { accountTotal, cashTotal } = calculatePaymentBreakdown(totalValue, paymentType);
  
  return {
    upfront: {
      account: accountTotal * 0.2,
      cash: cashTotal * 0.2,
    },
    production: {
      account: accountTotal * 0.7,
      cash: cashTotal * 0.7,
    },
    delivery: {
      account: accountTotal * 0.1,
      cash: cashTotal * 0.1,
    },
  };
};

// Helper to calculate project financials
export const calculateProjectFinancials = (project: Project) => {
  const totalInflows = project.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalSupplierCosts = project.supplierCosts.reduce((sum, c) => sum + c.amount, 0);
  const grossProfit = totalInflows - totalSupplierCosts;
  const profitMargin = totalInflows > 0 ? (grossProfit / totalInflows) * 100 : 0;
  
  const accountPayments = project.payments.filter(p => p.type === 'account').reduce((sum, p) => sum + p.amount, 0);
  const cashPayments = project.payments.filter(p => p.type === 'cash').reduce((sum, p) => sum + p.amount, 0);
  
  return {
    totalInflows,
    totalSupplierCosts,
    grossProfit,
    profitMargin,
    accountPayments,
    cashPayments,
  };
};

