import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { Project, OperationalCost, DashboardState } from '../types';

type Action =
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ADD_PAYMENT'; payload: { projectId: string; payment: Project['payments'][0] } }
  | { type: 'DELETE_PAYMENT'; payload: { projectId: string; paymentId: string } }
  | { type: 'ADD_SUPPLIER_COST'; payload: { projectId: string; cost: Project['supplierCosts'][0] } }
  | { type: 'DELETE_SUPPLIER_COST'; payload: { projectId: string; costId: string } }
  | { type: 'ADD_OPERATIONAL_COST'; payload: OperationalCost }
  | { type: 'UPDATE_OPERATIONAL_COST'; payload: OperationalCost }
  | { type: 'DELETE_OPERATIONAL_COST'; payload: string }
  | { type: 'LOAD_STATE'; payload: DashboardState };

const initialState: DashboardState = {
  projects: [],
  operationalCosts: [],
};

const STORAGE_KEY = 'hoc_dashboard_state';

const loadFromStorage = (): DashboardState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load state from storage:', e);
  }
  return initialState;
};

const saveToStorage = (state: DashboardState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to storage:', e);
  }
};

const dashboardReducer = (state: DashboardState, action: Action): DashboardState => {
  switch (action.type) {
    case 'LOAD_STATE':
      return action.payload;

    case 'ADD_PROJECT':
      return {
        ...state,
        projects: [...state.projects, action.payload],
      };

    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.id ? action.payload : p
        ),
      };

    case 'DELETE_PROJECT':
      return {
        ...state,
        projects: state.projects.filter(p => p.id !== action.payload),
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

    case 'DELETE_SUPPLIER_COST':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.projectId
            ? { ...p, supplierCosts: p.supplierCosts.filter(c => c.id !== action.payload.costId) }
            : p
        ),
      };

    case 'ADD_OPERATIONAL_COST':
      return {
        ...state,
        operationalCosts: [...state.operationalCosts, action.payload],
      };

    case 'UPDATE_OPERATIONAL_COST':
      return {
        ...state,
        operationalCosts: state.operationalCosts.map(c =>
          c.id === action.payload.id ? action.payload : c
        ),
      };

    case 'DELETE_OPERATIONAL_COST':
      return {
        ...state,
        operationalCosts: state.operationalCosts.filter(c => c.id !== action.payload),
      };

    default:
      return state;
  }
};

interface DashboardContextType {
  state: DashboardState;
  dispatch: React.Dispatch<Action>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const loadedState = loadFromStorage();
    dispatch({ type: 'LOAD_STATE', payload: loadedState });
  }, []);

  // Save state to localStorage on every change
  useEffect(() => {
    saveToStorage(state);
  }, [state]);

  return (
    <DashboardContext.Provider value={{ state, dispatch }}>
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

