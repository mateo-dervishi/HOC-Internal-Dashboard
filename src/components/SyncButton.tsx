import { useState } from 'react';
import { RefreshCw, Check, Download } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { generateExcelBlob } from '../services/excelTemplate';

export const SyncButton = () => {
  const { state } = useDashboard();
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSynced(false);
    
    try {
      // Generate the Excel blob
      const blob = generateExcelBlob({
        projects: state.projects,
        operationalCosts: state.operationalCosts,
      });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HOC_Dashboard_Sync_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Update sync status
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      setSynced(true);
      
      // Reset synced state after 3 seconds
      setTimeout(() => setSynced(false), 3000);
      
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Failed to generate Excel file. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '0.75rem',
      padding: '0.5rem 1rem',
      background: 'var(--color-bg-card)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--color-border)',
    }}>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="btn btn-primary"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
        }}
      >
        {syncing ? (
          <>
            <RefreshCw size={16} className="spinning" />
            Generating...
          </>
        ) : synced ? (
          <>
            <Check size={16} />
            Downloaded!
          </>
        ) : (
          <>
            <Download size={16} />
            Sync to Excel
          </>
        )}
      </button>
      
      {lastSyncTime && (
        <span style={{ 
          fontSize: '0.75rem', 
          color: 'var(--color-text-muted)',
        }}>
          Last sync: {lastSyncTime}
        </span>
      )}
    </div>
  );
};

