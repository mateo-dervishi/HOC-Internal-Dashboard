import { useState, useEffect } from 'react';
import { Download, Upload, Trash2, AlertTriangle, RotateCcw, Link, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { generateHOCOperationalCosts } from '../data/seedOperationalCosts';
import { 
  getWebhookUrl, 
  setWebhookUrl, 
  isSyncEnabled, 
  setSyncEnabled, 
  testWebhookConnection,
  syncToExcel 
} from '../services/excelSync';

const Settings = () => {
  const { state, dispatch, lastSyncStatus } = useDashboard();
  
  // Excel Sync State
  const [webhookUrl, setWebhookUrlState] = useState('');
  const [syncEnabled, setSyncEnabledState] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [manualSyncing, setManualSyncing] = useState(false);
  
  // Load sync settings on mount
  useEffect(() => {
    setWebhookUrlState(getWebhookUrl() || '');
    setSyncEnabledState(isSyncEnabled());
  }, []);
  
  const handleSaveWebhookUrl = () => {
    setWebhookUrl(webhookUrl);
    setTestResult(null);
    alert('Webhook URL saved!');
  };
  
  const handleToggleSync = () => {
    const newValue = !syncEnabled;
    setSyncEnabledState(newValue);
    setSyncEnabled(newValue);
  };
  
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    const result = await testWebhookConnection();
    setTestResult(result);
    setTestingConnection(false);
  };
  
  const handleManualSync = async () => {
    setManualSyncing(true);
    const result = await syncToExcel(state);
    if (result.success) {
      alert('Data synced to Excel successfully!');
    } else {
      alert(`Sync failed: ${result.error}`);
    }
    setManualSyncing(false);
  };
  
  const handleExportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hoc-dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.projects && data.operationalCosts) {
          if (confirm('This will replace all your current data. Are you sure you want to continue?')) {
            dispatch({ type: 'LOAD_STATE', payload: data });
            alert('Data imported successfully!');
          }
        } else {
          alert('Invalid data format. Please use a valid backup file.');
        }
      } catch {
        alert('Failed to parse the file. Please ensure it\'s a valid JSON file.');
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  };
  
  const handleClearAllData = () => {
    if (confirm('Are you absolutely sure you want to delete ALL data? This action cannot be undone.')) {
      if (confirm('Final confirmation: All projects, payments, and operational costs will be permanently deleted.')) {
        dispatch({ type: 'LOAD_STATE', payload: { projects: [], operationalCosts: [] } });
        alert('All data has been cleared.');
      }
    }
  };
  
  const handleResetToDefaultData = () => {
    if (confirm('This will reset operational costs to the default HOC data (warehouse, showroom, salaries, misc expenses). Your projects will be kept.\n\nContinue?')) {
      const newCosts = generateHOCOperationalCosts();
      dispatch({ type: 'LOAD_STATE', payload: { 
        projects: state.projects, 
        operationalCosts: newCosts 
      }});
      alert(`Operational costs reset to default (${newCosts.length} entries).`);
    }
  };

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your dashboard data and preferences</p>
      </header>
      
      {/* Excel Sync */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">Excel Live Sync</h3>
          {syncEnabled && lastSyncStatus && (
            <span style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.375rem',
              fontSize: '0.75rem',
              color: lastSyncStatus.success ? 'var(--color-success)' : 'var(--color-error)'
            }}>
              {lastSyncStatus.success ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {lastSyncStatus.success ? 'Synced' : 'Sync failed'}
              {lastSyncStatus.time && (
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {lastSyncStatus.time.toLocaleTimeString()}
                </span>
              )}
            </span>
          )}
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {/* Toggle */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem 1.25rem',
              background: 'var(--color-bg-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)'
            }}>
              <div>
                <h4 style={{ marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                  Auto-Sync to Excel
                </h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>
                  Automatically sync changes to your Excel file via Power Automate
                </p>
              </div>
              <button 
                onClick={handleToggleSync}
                style={{ 
                  padding: '0.5rem 1rem',
                  background: syncEnabled ? 'var(--color-success)' : 'var(--color-bg-hover)',
                  color: syncEnabled ? 'var(--color-bg)' : 'var(--color-text-muted)',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  transition: 'all 0.15s ease'
                }}
              >
                {syncEnabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>
            
            {/* Webhook URL */}
            <div style={{ 
              padding: '1.25rem',
              background: 'var(--color-bg-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)'
            }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.75rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                Power Automate Webhook URL
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="url"
                  className="form-input"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrlState(e.target.value)}
                  placeholder="https://prod-xx.westeurope.logic.azure.com/workflows/..."
                  style={{ flex: 1, fontSize: '0.85rem' }}
                />
                <button className="btn btn-primary" onClick={handleSaveWebhookUrl}>
                  Save
                </button>
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: '0.5rem', marginBottom: 0 }}>
                Get this URL from your Power Automate flow's HTTP trigger
              </p>
            </div>
            
            {/* Test & Sync Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={handleTestConnection}
                disabled={testingConnection || !webhookUrl}
                style={{ flex: 1 }}
              >
                <Link size={16} />
                {testingConnection ? 'Testing...' : 'Test Connection'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={handleManualSync}
                disabled={manualSyncing || !webhookUrl}
                style={{ flex: 1 }}
              >
                <RefreshCw size={16} className={manualSyncing ? 'spin' : ''} />
                {manualSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
            
            {/* Test Result */}
            {testResult && (
              <div style={{ 
                padding: '0.875rem 1rem',
                background: testResult.success ? 'var(--color-success-dim)' : 'var(--color-error-dim)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                color: testResult.success ? 'var(--color-success)' : 'var(--color-error)'
              }}>
                {testResult.success ? <CheckCircle size={16} /> : <XCircle size={16} />}
                {testResult.success ? 'Connection successful!' : `Connection failed: ${testResult.error}`}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Data Management */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">Data Management</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Export */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem 1.25rem',
              background: 'var(--color-bg-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)'
            }}>
              <div>
                <h4 style={{ marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                  Export Data
                </h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>
                  Download a backup of all your data as JSON
                </p>
              </div>
              <button className="btn btn-secondary" onClick={handleExportData}>
                <Download size={16} />
                Export
              </button>
            </div>
            
            {/* Import */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem 1.25rem',
              background: 'var(--color-bg-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)'
            }}>
              <div>
                <h4 style={{ marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                  Import Data
                </h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>
                  Restore from a previous backup file
                </p>
              </div>
              <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                <Upload size={16} />
                Import
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportData}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            
            {/* Reset */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem 1.25rem',
              background: 'var(--color-bg-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)'
            }}>
              <div>
                <h4 style={{ marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                  Reset Operational Costs
                </h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>
                  Reset to default HOC data (keeps projects)
                </p>
              </div>
              <button className="btn btn-secondary" onClick={handleResetToDefaultData}>
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
            
            {/* Clear Data */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1rem 1.25rem',
              background: 'var(--color-error-dim)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(248, 113, 113, 0.3)'
            }}>
              <div>
                <h4 style={{ marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={14} />
                  Clear All Data
                </h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>
                  Permanently delete everything
                </p>
              </div>
              <button className="btn btn-danger" onClick={handleClearAllData}>
                <Trash2 size={16} />
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Current Data Summary */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">Data Summary</h3>
        </div>
        <div className="card-body" style={{ padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 300, color: 'var(--color-text)' }}>
                {state.projects.length}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Projects
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 300, color: 'var(--color-text)' }}>
                {state.projects.reduce((sum, p) => sum + p.payments.length, 0)}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Payments
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 300, color: 'var(--color-text)' }}>
                {state.projects.reduce((sum, p) => sum + p.supplierCosts.length, 0)}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Costs
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '1.75rem', fontWeight: 300, color: 'var(--color-text)' }}>
                {state.operationalCosts.length}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Op. Costs
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* About */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">About</h3>
        </div>
        <div className="card-body">
          <p style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 500, color: 'var(--color-text)' }}>
            House of Clarence
          </p>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', fontSize: '0.8rem', lineHeight: 1.6 }}>
            Internal financial management for tracking project profitability, client payments, 
            supplier costs, and operational expenses.
          </p>
          <div style={{ 
            background: 'var(--color-bg-elevated)', 
            padding: '1rem', 
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            fontSize: '0.8rem',
            lineHeight: '1.8',
            color: 'var(--color-text-secondary)'
          }}>
            <strong style={{ color: 'var(--color-text)' }}>Payment Terms:</strong> 20/70/10 (Upfront / Before Production / On Delivery)
            <br />
            <strong style={{ color: 'var(--color-text)' }}>Fee Split:</strong> 60% Account / 40% Fees
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
