import React, { createContext, useContext, useReducer, useEffect, useRef, type ReactNode } from 'react';
import type { Project, OperationalCost, DashboardState } from '../types';
import { generateHOCOperationalCosts } from '../data/seedOperationalCosts';
import { generateExcelBlob } from '../services/excelTemplate';

// Power Automate webhook URL for auto-sync
const WEBHOOK_URL = 'https://default19c5fbd0b8174474a78b2d48ff2c5e.c5.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/8305f76f507445b4be118d0548f99db5/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ct9MLR8rUytSwO11awmQXQT_PHqEfh06NoxEPmALV_0';

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

// Initial state with pre-loaded HOC operational costs
const initialState: DashboardState = {
  projects: [],
  operationalCosts: generateHOCOperationalCosts(),
};

const STORAGE_KEY = 'hoc_dashboard_state';
const DATA_VERSION_KEY = 'hoc_dashboard_data_version';
const CURRENT_DATA_VERSION = '2'; // Increment this to force reload of seed data

const loadFromStorage = (): DashboardState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const storedVersion = localStorage.getItem(DATA_VERSION_KEY);
    
    // If data version mismatch or no data, return initial state with seed data
    if (!stored || storedVersion !== CURRENT_DATA_VERSION) {
      localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
      return initialState;
    }
    
    return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to load state from storage:', e);
  }
  return initialState;
};

const saveToStorage = (state: DashboardState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    
    // Also save a timestamped backup (keep last 10 backups)
    const backupKey = `hoc_backup_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(state));
    
    // Clean up old backups (keep only last 10)
    const allKeys = Object.keys(localStorage).filter(k => k.startsWith('hoc_backup_'));
    if (allKeys.length > 10) {
      allKeys.sort().slice(0, allKeys.length - 10).forEach(k => localStorage.removeItem(k));
    }
  } catch (e) {
    console.error('Failed to save state to storage:', e);
  }
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
  const isInitialLoad = useRef(true);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load state from localStorage on mount
  useEffect(() => {
    const loadedState = loadFromStorage();
    dispatch({ type: 'LOAD_STATE', payload: loadedState });
  }, []);

  // Save state to localStorage and auto-sync to SharePoint on every change
  useEffect(() => {
    // Skip the initial load
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    
    // Save to localStorage immediately
    saveToStorage(state);
    
    // Debounce SharePoint sync (wait 5 seconds after last change)
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      syncToSharePoint(state);
    }, 5000); // Auto-sync 5 seconds after last change
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
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
