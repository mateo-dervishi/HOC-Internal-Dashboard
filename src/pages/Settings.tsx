import { Download, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

const Settings = () => {
  const { state, dispatch } = useDashboard();
  
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
      } catch (error) {
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

  return (
    <div>
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your dashboard data and preferences</p>
      </header>
      
      {/* Data Management */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">Data Management</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Export */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1.5rem',
              background: 'var(--color-light-gray)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <h4 style={{ marginBottom: '0.25rem', fontFamily: 'inherit', fontWeight: 600 }}>
                  Export Data
                </h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                  Download a backup of all your projects and operational costs
                </p>
              </div>
              <button className="btn btn-secondary" onClick={handleExportData}>
                <Download size={18} />
                Export JSON
              </button>
            </div>
            
            {/* Import */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1.5rem',
              background: 'var(--color-light-gray)',
              borderRadius: 'var(--radius-md)'
            }}>
              <div>
                <h4 style={{ marginBottom: '0.25rem', fontFamily: 'inherit', fontWeight: 600 }}>
                  Import Data
                </h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                  Restore data from a previous backup file
                </p>
              </div>
              <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                <Upload size={18} />
                Import JSON
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleImportData}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            
            {/* Clear Data */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '1.5rem',
              background: 'var(--color-error-light)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(139, 58, 58, 0.2)'
            }}>
              <div>
                <h4 style={{ marginBottom: '0.25rem', fontFamily: 'inherit', fontWeight: 600, color: 'var(--color-error)' }}>
                  <AlertTriangle size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                  Clear All Data
                </h4>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                  Permanently delete all projects and operational costs
                </p>
              </div>
              <button className="btn btn-danger" onClick={handleClearAllData}>
                <Trash2 size={18} />
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Current Data Summary */}
      <div className="card mb-4">
        <div className="card-header">
          <h3 className="card-title">Current Data Summary</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--color-black)', fontFamily: 'Inter, sans-serif' }}>
                {state.projects.length}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Projects
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--color-black)', fontFamily: 'Inter, sans-serif' }}>
                {state.projects.reduce((sum, p) => sum + p.payments.length, 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Payments
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--color-black)', fontFamily: 'Inter, sans-serif' }}>
                {state.projects.reduce((sum, p) => sum + p.supplierCosts.length, 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Supplier Costs
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--color-black)', fontFamily: 'Inter, sans-serif' }}>
                {state.operationalCosts.length}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '2px' }}>
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
          <p style={{ marginBottom: '1rem', fontFamily: 'Inter, sans-serif', fontSize: '1.25rem' }}>
            <strong>House of Clarence</strong>
          </p>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Internal financial management for tracking project profitability, client payments, 
            supplier costs, and operational expenses. Refined finishing for discerning spaces.
          </p>
          <div style={{ 
            background: 'var(--color-light-gray)', 
            padding: '1.25rem', 
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            lineHeight: '1.8'
          }}>
            <strong>Payment Terms:</strong> 20/70/10 (Upfront / Before Production / On Delivery)
            <br />
            <strong>Cash Payment Split:</strong> 60% Account / 40% Cash
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
