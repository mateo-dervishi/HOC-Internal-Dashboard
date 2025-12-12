import React, { createContext, useContext, useReducer, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Project, OperationalCost, DashboardState, Valuation, Payment, SupplierCost } from '../types';
import { generateHOCOperationalCosts } from '../data/seedOperationalCosts';
import { generateExcelBlob } from '../services/excelTemplate';
import * as db from '../services/database';

// Power Automate webhook URL for auto-sync
const WEBHOOK_URL = 'https://default19c5fbd0b8174474a78b2d48ff2c5e.c5.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/8305f76f507445b4be118d0548f99db5/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ct9MLR8rUytSwO11awmQXQT_PHqEfh06NoxEPmALV_0';

type Action =
  | { type: 'SET_STATE'; payload: DashboardState }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_VALUATION'; payload: { projectId: string; valuation: Valuation } }
  | { type: 'UPDATE_VALUATION'; payload: { projectId: string; valuation: Valuation } }
  | { type: 'DELETE_VALUATION'; payload: { projectId: string; valuationId: string } }
  | { type: 'ADD_PAYMENT'; payload: { projectId: string; payment: Payment } }
  | { type: 'UPDATE_PAYMENT'; payload: { projectId: string; payment: Payment } }
  | { type: 'DELETE_PAYMENT'; payload: { projectId: string; paymentId: string } }
  | { type: 'ADD_SUPPLIER_COST'; payload: { projectId: string; cost: SupplierCost } }
  | { type: 'UPDATE_SUPPLIER_COST'; payload: { projectId: string; cost: SupplierCost } }
  | { type: 'DELETE_SUPPLIER_COST'; payload: { projectId: string; costId: string } }
  | { type: 'SET_OPERATIONAL_COSTS'; payload: OperationalCost[] }
  | { type: 'ADD_OPERATIONAL_COST'; payload: OperationalCost }
  | { type: 'UPDATE_OPERATIONAL_COST'; payload: OperationalCost }
  | { type: 'DELETE_OPERATIONAL_COST'; payload: string }
  | { type: 'LOAD_STATE'; payload: DashboardState };

const initialState: DashboardState = {
  projects: [],
  operationalCosts: [],
};

// Convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Auto-sync to SharePoint
const syncToSharePoint = async (state: DashboardState) => {
  try {
    const excelBlob = generateExcelBlob({
      projects: state.projects,
      operationalCosts: state.operationalCosts,
    });
    
    const base64Excel = await blobToBase64(excelBlob);
    
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'HOC_Dashboard_Sync.xlsx',
        fileContent: base64Excel,
        timestamp: new Date().toISOString(),
      }),
    });
    
    console.log('✅ Auto-synced to SharePoint');
  } catch (error) {
    console.error('❌ Auto-sync failed:', error);
  }
};

const dashboardReducer = (state: DashboardState, action: Action): DashboardState => {
  switch (action.type) {
    case 'SET_STATE':
    case 'LOAD_STATE':
      return action.payload;

    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };

    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };

    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p),
      };

    case 'DELETE_PROJECT':
      return { ...state, projects: state.projects.filter(p => p.id !== action.payload) };

    case 'ADD_VALUATION':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? { ...p, valuations: [...p.valuations, action.payload.valuation] }
            : p
        ),
      };

    case 'UPDATE_VALUATION':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? { ...p, valuations: p.valuations.map(v => v.id === action.payload.valuation.id ? action.payload.valuation : v) }
            : p
        ),
      };

    case 'DELETE_VALUATION':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? { ...p, valuations: p.valuations.filter(v => v.id !== action.payload.valuationId) }
            : p
        ),
      };

    case 'ADD_PAYMENT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? { ...p, payments: [...p.payments, action.payload.payment] }
            : p
        ),
      };

    case 'UPDATE_PAYMENT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? { ...p, payments: p.payments.map(pay => pay.id === action.payload.payment.id ? action.payload.payment : pay) }
            : p
        ),
      };

    case 'DELETE_PAYMENT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? { ...p, payments: p.payments.filter(pay => pay.id !== action.payload.paymentId) }
            : p
        ),
      };

    case 'ADD_SUPPLIER_COST':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? { ...p, supplierCosts: [...p.supplierCosts, action.payload.cost] }
            : p
        ),
      };

    case 'UPDATE_SUPPLIER_COST':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? { ...p, supplierCosts: p.supplierCosts.map(c => c.id === action.payload.cost.id ? action.payload.cost : c) }
            : p
        ),
      };

    case 'DELETE_SUPPLIER_COST':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? { ...p, supplierCosts: p.supplierCosts.filter(c => c.id !== action.payload.costId) }
            : p
        ),
      };

    case 'SET_OPERATIONAL_COSTS':
      return { ...state, operationalCosts: action.payload };

    case 'ADD_OPERATIONAL_COST':
      return { ...state, operationalCosts: [...state.operationalCosts, action.payload] };

    case 'UPDATE_OPERATIONAL_COST':
      return {
        ...state,
        operationalCosts: state.operationalCosts.map(c => c.id === action.payload.id ? action.payload : c),
      };

    case 'DELETE_OPERATIONAL_COST':
      return { ...state, operationalCosts: state.operationalCosts.filter(c => c.id !== action.payload) };

    default:
      return state;
  }
};

interface DashboardContextType {
  state: DashboardState;
  dispatch: React.Dispatch<Action>;
  loading: boolean;
  // Database actions
  addProject: (project: Omit<Project, 'id' | 'valuations' | 'payments' | 'supplierCosts' | 'createdAt'>) => Promise<Project | null>;
  updateProject: (project: Project) => Promise<boolean>;
  deleteProject: (id: string) => Promise<boolean>;
  addValuation: (projectId: string, valuation: Omit<Valuation, 'id'>) => Promise<Valuation | null>;
  updateValuation: (projectId: string, valuation: Valuation) => Promise<boolean>;
  deleteValuation: (projectId: string, valuationId: string) => Promise<boolean>;
  addPayment: (projectId: string, payment: Omit<Payment, 'id'>) => Promise<Payment | null>;
  updatePayment: (projectId: string, payment: Payment) => Promise<boolean>;
  deletePayment: (projectId: string, paymentId: string) => Promise<boolean>;
  addSupplierCost: (projectId: string, cost: Omit<SupplierCost, 'id'>) => Promise<SupplierCost | null>;
  updateSupplierCost: (projectId: string, cost: SupplierCost) => Promise<boolean>;
  deleteSupplierCost: (projectId: string, costId: string) => Promise<boolean>;
  addOperationalCost: (cost: Omit<OperationalCost, 'id'>) => Promise<OperationalCost | null>;
  updateOperationalCost: (cost: OperationalCost) => Promise<boolean>;
  deleteOperationalCost: (id: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const [loading, setLoading] = useState(true);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStateRef = useRef<string>('');

  // Load data from Supabase on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await db.fetchAllData();
        
        // Seed operational costs if empty
        if (data.operationalCosts.length === 0) {
          const seedCosts = generateHOCOperationalCosts();
          await db.seedOperationalCosts(seedCosts);
          data.operationalCosts = await db.fetchOperationalCosts();
        }
        
        dispatch({ type: 'SET_STATE', payload: data });
      } catch (error) {
        console.error('Failed to load data from Supabase:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Auto-sync to SharePoint when state changes
  useEffect(() => {
    const stateStr = JSON.stringify(state);
    if (stateStr === lastStateRef.current || loading) return;
    lastStateRef.current = stateStr;
    
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      syncToSharePoint(state);
    }, 5000);
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [state, loading]);

  // Database actions
  const addProject = async (project: Omit<Project, 'id' | 'valuations' | 'payments' | 'supplierCosts' | 'createdAt'>) => {
    const newProject = await db.createProject(project);
    if (newProject) {
      dispatch({ type: 'ADD_PROJECT', payload: newProject });
    }
    return newProject;
  };

  const updateProject = async (project: Project) => {
    const success = await db.updateProject(project.id, project);
    if (success) {
      dispatch({ type: 'UPDATE_PROJECT', payload: project });
    }
    return success;
  };

  const deleteProject = async (id: string) => {
    const success = await db.deleteProject(id);
    if (success) {
      dispatch({ type: 'DELETE_PROJECT', payload: id });
    }
    return success;
  };

  const addValuation = async (projectId: string, valuation: Omit<Valuation, 'id'>) => {
    const newValuation = await db.createValuation(projectId, valuation);
    if (newValuation) {
      dispatch({ type: 'ADD_VALUATION', payload: { projectId, valuation: newValuation } });
    }
    return newValuation;
  };

  const updateValuation = async (projectId: string, valuation: Valuation) => {
    const success = await db.updateValuation(valuation.id, valuation);
    if (success) {
      dispatch({ type: 'UPDATE_VALUATION', payload: { projectId, valuation } });
    }
    return success;
  };

  const deleteValuation = async (projectId: string, valuationId: string) => {
    const success = await db.deleteValuation(valuationId);
    if (success) {
      dispatch({ type: 'DELETE_VALUATION', payload: { projectId, valuationId } });
    }
    return success;
  };

  const addPayment = async (projectId: string, payment: Omit<Payment, 'id'>) => {
    const newPayment = await db.createPayment(projectId, payment);
    if (newPayment) {
      dispatch({ type: 'ADD_PAYMENT', payload: { projectId, payment: newPayment } });
    }
    return newPayment;
  };

  const updatePayment = async (projectId: string, payment: Payment) => {
    const success = await db.updatePayment(payment.id, payment);
    if (success) {
      dispatch({ type: 'UPDATE_PAYMENT', payload: { projectId, payment } });
    }
    return success;
  };

  const deletePayment = async (projectId: string, paymentId: string) => {
    const success = await db.deletePayment(paymentId);
    if (success) {
      dispatch({ type: 'DELETE_PAYMENT', payload: { projectId, paymentId } });
    }
    return success;
  };

  const addSupplierCost = async (projectId: string, cost: Omit<SupplierCost, 'id'>) => {
    const newCost = await db.createSupplierCost(projectId, cost);
    if (newCost) {
      dispatch({ type: 'ADD_SUPPLIER_COST', payload: { projectId, cost: newCost } });
    }
    return newCost;
  };

  const updateSupplierCost = async (projectId: string, cost: SupplierCost) => {
    const success = await db.updateSupplierCost(cost.id, cost);
    if (success) {
      dispatch({ type: 'UPDATE_SUPPLIER_COST', payload: { projectId, cost } });
    }
    return success;
  };

  const deleteSupplierCost = async (projectId: string, costId: string) => {
    const success = await db.deleteSupplierCost(costId);
    if (success) {
      dispatch({ type: 'DELETE_SUPPLIER_COST', payload: { projectId, costId } });
    }
    return success;
  };

  const addOperationalCost = async (cost: Omit<OperationalCost, 'id'>) => {
    const newCost = await db.createOperationalCost(cost);
    if (newCost) {
      dispatch({ type: 'ADD_OPERATIONAL_COST', payload: newCost });
    }
    return newCost;
  };

  const updateOperationalCost = async (cost: OperationalCost) => {
    const success = await db.updateOperationalCost(cost.id, cost);
    if (success) {
      dispatch({ type: 'UPDATE_OPERATIONAL_COST', payload: cost });
    }
    return success;
  };

  const deleteOperationalCost = async (id: string) => {
    const success = await db.deleteOperationalCost(id);
    if (success) {
      dispatch({ type: 'DELETE_OPERATIONAL_COST', payload: id });
    }
    return success;
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const data = await db.fetchAllData();
      dispatch({ type: 'SET_STATE', payload: data });
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardContext.Provider value={{
      state,
      dispatch,
      loading,
      addProject,
      updateProject,
      deleteProject,
      addValuation,
      updateValuation,
      deleteValuation,
      addPayment,
      updatePayment,
      deletePayment,
      addSupplierCost,
      updateSupplierCost,
      deleteSupplierCost,
      addOperationalCost,
      updateOperationalCost,
      deleteOperationalCost,
      refreshData,
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
