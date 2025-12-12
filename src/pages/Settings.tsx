import { Download, Upload, FileSpreadsheet, Table, LogOut, User } from 'lucide-react';
import { useMsal } from '@azure/msal-react';
import { useDashboard } from '../context/DashboardContext';
import { generateExcelTemplate, exportDataToExcel } from '../services/excelTemplate';

const Settings = () => {
  const { state, dispatch } = useDashboard();
  const { instance, accounts } = useMsal();
  const activeAccount = accounts[0];

  const handleLogout = () => {
    if (confirm('Are you sure you want to sign out?')) {
      instance.logoutPopup();
    }
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

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your dashboard data and preferences</p>
      </header>
      
      
      {/* Excel Templates */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">Excel Templates</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Download Template */}
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
                  Download Excel Template
                </h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>
                  Blank template with all sheets ready for SharePoint
                </p>
              </div>
              <button className="btn btn-primary" onClick={generateExcelTemplate}>
                <FileSpreadsheet size={16} />
                Download Template
              </button>
            </div>
            
            {/* Export Current Data */}
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
                  Export Data to Excel
                </h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>
                  Export all current dashboard data as Excel file
                </p>
              </div>
              <button className="btn btn-secondary" onClick={() => exportDataToExcel(state)}>
                <Table size={16} />
                Export Data
              </button>
            </div>
          </div>
          
          <div style={{ 
            marginTop: '1rem',
            padding: '0.875rem 1rem',
            background: 'var(--color-bg-hover)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            lineHeight: 1.6
          }}>
            <strong style={{ color: 'var(--color-text-secondary)' }}>Template includes 8 sheets:</strong>
            <br />
            Summary • Projects • Valuations • Client Payments • Supplier Costs • Fixed Costs • Variable Costs • Reference
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
      <div className="card mb-4">
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
      
      {/* Account */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Account</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Logged in user */}
            {activeAccount && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem 1.25rem',
                background: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--color-bg-hover)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <User size={20} style={{ color: 'var(--color-text-muted)' }} />
                </div>
                <div>
                  <h4 style={{ marginBottom: '0.25rem', fontWeight: 500, fontSize: '0.9rem', color: 'var(--color-text)' }}>
                    {activeAccount.name || 'User'}
                  </h4>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>
                    {activeAccount.username}
                  </p>
                </div>
              </div>
            )}
            
            {/* Sign out */}
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
                  Sign Out
                </h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', margin: 0 }}>
                  End your current session
                </p>
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
