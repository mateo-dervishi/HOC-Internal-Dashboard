import { supabase } from '../config/supabaseConfig';
import type { Project, Valuation, Payment, SupplierCost, OperationalCost, DashboardState } from '../types';

// ============================================================
// PROJECTS
// ============================================================

export const fetchProjects = async (): Promise<Project[]> => {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  // Fetch related data for each project
  const projectsWithData: Project[] = await Promise.all(
    (projects || []).map(async (p) => {
      const [valuations, payments, supplierCosts] = await Promise.all([
        fetchValuations(p.id),
        fetchPayments(p.id),
        fetchSupplierCosts(p.id),
      ]);

      return {
        id: p.id,
        code: p.code,
        clientName: p.client_name,
        address: p.address || '',
        status: (p.status === 'on-hold' ? 'on_hold' : p.status) as 'active' | 'completed' | 'on_hold',
        hasCashPayment: p.has_cash_payment,
        valuations,
        payments,
        supplierCosts,
        createdAt: p.created_at,
      };
    })
  );

  return projectsWithData;
};

export const createProject = async (project: Omit<Project, 'id' | 'valuations' | 'payments' | 'supplierCosts' | 'createdAt'>): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      code: project.code,
      client_name: project.clientName,
      address: project.address,
      status: project.status,
      has_cash_payment: project.hasCashPayment,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    return null;
  }

  return {
    id: data.id,
    code: data.code,
    clientName: data.client_name,
    address: data.address || '',
    status: data.status,
    hasCashPayment: data.has_cash_payment,
    valuations: [],
    payments: [],
    supplierCosts: [],
    createdAt: data.created_at,
  };
};

export const updateProject = async (id: string, updates: Partial<Project>): Promise<boolean> => {
  const { error } = await supabase
    .from('projects')
    .update({
      code: updates.code,
      client_name: updates.clientName,
      address: updates.address,
      status: updates.status,
      has_cash_payment: updates.hasCashPayment,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating project:', error);
    return false;
  }
  return true;
};

export const deleteProject = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting project:', error);
    return false;
  }
  return true;
};

// ============================================================
// VALUATIONS
// ============================================================

const fetchValuations = async (projectId: string): Promise<Valuation[]> => {
  const { data, error } = await supabase
    .from('valuations')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching valuations:', error);
    return [];
  }

  return (data || []).map((v) => ({
    id: v.id,
    name: v.name,
    date: v.date,
    grandTotal: Number(v.grand_total),
    fees: Number(v.fees),
    omissions: Number(v.omissions),
    vatRate: Number(v.vat_rate),
    notes: v.notes || '',
  }));
};

export const createValuation = async (projectId: string, valuation: Omit<Valuation, 'id'>): Promise<Valuation | null> => {
  const { data, error } = await supabase
    .from('valuations')
    .insert({
      project_id: projectId,
      name: valuation.name,
      date: valuation.date,
      grand_total: valuation.grandTotal,
      fees: valuation.fees,
      omissions: valuation.omissions,
      vat_rate: valuation.vatRate,
      notes: valuation.notes,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating valuation:', error);
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    date: data.date,
    grandTotal: Number(data.grand_total),
    fees: Number(data.fees),
    omissions: Number(data.omissions),
    vatRate: Number(data.vat_rate),
    notes: data.notes || '',
  };
};

export const updateValuation = async (id: string, updates: Partial<Valuation>): Promise<boolean> => {
  const { error } = await supabase
    .from('valuations')
    .update({
      name: updates.name,
      date: updates.date,
      grand_total: updates.grandTotal,
      fees: updates.fees,
      omissions: updates.omissions,
      vat_rate: updates.vatRate,
      notes: updates.notes,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating valuation:', error);
    return false;
  }
  return true;
};

export const deleteValuation = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('valuations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting valuation:', error);
    return false;
  }
  return true;
};

// ============================================================
// PAYMENTS
// ============================================================

const fetchPayments = async (projectId: string): Promise<Payment[]> => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching payments:', error);
    return [];
  }

  return (data || []).map((p) => ({
    id: p.id,
    valuationName: p.valuation_name || '',
    date: p.date,
    amount: Number(p.amount),
    vatRate: Number(p.vat_rate),
    type: p.type as 'account' | 'cash',
    description: p.description || '',
  }));
};

export const createPayment = async (projectId: string, payment: Omit<Payment, 'id'>): Promise<Payment | null> => {
  const { data, error } = await supabase
    .from('payments')
    .insert({
      project_id: projectId,
      valuation_name: payment.valuationName,
      date: payment.date,
      amount: payment.amount,
      vat_rate: payment.vatRate,
      type: payment.type,
      description: payment.description,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating payment:', error);
    return null;
  }

  return {
    id: data.id,
    valuationName: data.valuation_name || '',
    date: data.date,
    amount: Number(data.amount),
    vatRate: Number(data.vat_rate),
    type: data.type,
    description: data.description || '',
  };
};

export const updatePayment = async (id: string, updates: Partial<Payment>): Promise<boolean> => {
  const { error } = await supabase
    .from('payments')
    .update({
      valuation_name: updates.valuationName,
      date: updates.date,
      amount: updates.amount,
      vat_rate: updates.vatRate,
      type: updates.type,
      description: updates.description,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating payment:', error);
    return false;
  }
  return true;
};

export const deletePayment = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting payment:', error);
    return false;
  }
  return true;
};

// ============================================================
// SUPPLIER COSTS
// ============================================================

const fetchSupplierCosts = async (projectId: string): Promise<SupplierCost[]> => {
  const { data, error } = await supabase
    .from('supplier_costs')
    .select('*')
    .eq('project_id', projectId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching supplier costs:', error);
    return [];
  }

  return (data || []).map((c) => ({
    id: c.id,
    date: c.date,
    supplier: c.supplier,
    amount: Number(c.amount),
    description: c.description || '',
  }));
};

export const createSupplierCost = async (projectId: string, cost: Omit<SupplierCost, 'id'>): Promise<SupplierCost | null> => {
  const { data, error } = await supabase
    .from('supplier_costs')
    .insert({
      project_id: projectId,
      date: cost.date,
      supplier: cost.supplier,
      amount: cost.amount,
      description: cost.description,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating supplier cost:', error);
    return null;
  }

  return {
    id: data.id,
    date: data.date,
    supplier: data.supplier,
    amount: Number(data.amount),
    description: data.description || '',
  };
};

export const updateSupplierCost = async (id: string, updates: Partial<SupplierCost>): Promise<boolean> => {
  const { error } = await supabase
    .from('supplier_costs')
    .update({
      date: updates.date,
      supplier: updates.supplier,
      amount: updates.amount,
      description: updates.description,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating supplier cost:', error);
    return false;
  }
  return true;
};

export const deleteSupplierCost = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('supplier_costs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting supplier cost:', error);
    return false;
  }
  return true;
};

// ============================================================
// OPERATIONAL COSTS
// ============================================================

export const fetchOperationalCosts = async (): Promise<OperationalCost[]> => {
  const { data, error } = await supabase
    .from('operational_costs')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching operational costs:', error);
    return [];
  }

  return (data || []).map((c) => ({
    id: c.id,
    category: c.category,
    description: c.description || '',
    amount: Number(c.amount),
    date: c.date,
    costType: c.type as 'fixed' | 'variable',
    isRecurring: c.is_recurring,
  }));
};

export const createOperationalCost = async (cost: Omit<OperationalCost, 'id'>): Promise<OperationalCost | null> => {
  const { data, error } = await supabase
    .from('operational_costs')
    .insert({
      category: cost.category,
      description: cost.description,
      amount: cost.amount,
      date: cost.date,
      type: cost.costType,
      is_recurring: cost.isRecurring,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating operational cost:', error);
    return null;
  }

  return {
    id: data.id,
    category: data.category,
    description: data.description || '',
    amount: Number(data.amount),
    date: data.date,
    costType: data.type as 'fixed' | 'variable',
    isRecurring: data.is_recurring,
  };
};

export const updateOperationalCost = async (id: string, updates: Partial<OperationalCost>): Promise<boolean> => {
  const { error } = await supabase
    .from('operational_costs')
    .update({
      category: updates.category,
      description: updates.description,
      amount: updates.amount,
      date: updates.date,
      type: updates.costType,
      is_recurring: updates.isRecurring,
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating operational cost:', error);
    return false;
  }
  return true;
};

export const deleteOperationalCost = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('operational_costs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting operational cost:', error);
    return false;
  }
  return true;
};

// ============================================================
// BULK OPERATIONS
// ============================================================

export const fetchAllData = async (): Promise<DashboardState> => {
  const [projects, operationalCosts] = await Promise.all([
    fetchProjects(),
    fetchOperationalCosts(),
  ]);

  return {
    projects,
    operationalCosts,
  };
};

// Seed operational costs (only if empty)
export const seedOperationalCosts = async (costs: OperationalCost[]): Promise<boolean> => {
  // Check if any operational costs exist
  const existing = await fetchOperationalCosts();
  if (existing.length > 0) {
    return true; // Already seeded
  }

  // Insert all costs
  const { error } = await supabase
    .from('operational_costs')
    .insert(
      costs.map((c) => ({
        category: c.category,
        description: c.description,
        amount: c.amount,
        date: c.date,
        type: c.costType,
        is_recurring: c.isRecurring,
      }))
    );

  if (error) {
    console.error('Error seeding operational costs:', error);
    return false;
  }
  return true;
};

