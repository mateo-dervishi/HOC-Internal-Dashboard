import { useState } from 'react';
import { RefreshCw, Check, Cloud, AlertCircle } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { syncToPowerAutomate } from '../services/powerAutomateSync';

// Power Automate webhook URL - syncs to SharePoint
const WEBHOOK_URL = 'https://default19c5fbd0b8174474a78b2d48ff2c5e.c5.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/8305f76f507445b4be118d0548f99db5/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=ct9MLR8rUytSwO11awmQXQT_PHqEfh06NoxEPmALV_0';

export const SyncButton = () => {
  const { state } = useDashboard();
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('idle');
    setStatusMessage('');
    
    try {
      // Sync to Power Automate (SharePoint)
      const result = await syncToPowerAutomate(WEBHOOK_URL, {
        projects: state.projects,
        operationalCosts: state.operationalCosts,
      });
      
      if (result.success) {
        setSyncStatus('success');
        setStatusMessage('Synced!');
      } else {
        setSyncStatus('error');
        setStatusMessage(result.message);
      }
      
      // Update sync time
      const now = new Date();
      setLastSyncTime(now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSyncStatus('idle');
        setStatusMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
      setStatusMessage('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: '0.5rem',
    }}>
      <button
        onClick={handleSync}
        disabled={syncing}
        className="btn btn-primary"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          fontSize: '0.875rem',
          width: '100%',
        }}
      >
        {syncing ? (
          <>
            <RefreshCw size={16} className="spinning" />
            Syncing...
          </>
        ) : syncStatus === 'success' ? (
          <>
            <Check size={16} />
            {statusMessage}
          </>
        ) : syncStatus === 'error' ? (
          <>
            <AlertCircle size={16} />
            Error
          </>
        ) : (
          <>
            <Cloud size={16} />
            Sync to SharePoint
          </>
        )}
      </button>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.7rem', 
        color: 'var(--color-text-muted)',
      }}>
        <span>☁️ SharePoint</span>
        {lastSyncTime && (
          <span>Last: {lastSyncTime}</span>
        )}
      </div>
      
      {syncStatus === 'error' && statusMessage && (
        <div style={{
          fontSize: '0.7rem',
          color: 'var(--color-error)',
          padding: '0.25rem',
        }}>
          {statusMessage}
        </div>
      )}
    </div>
  );
};

