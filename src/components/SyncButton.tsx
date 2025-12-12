import { useState, useEffect } from 'react';
import { RefreshCw, Check, Cloud, Download, AlertCircle } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { generateExcelBlob } from '../services/excelTemplate';
import { syncToPowerAutomate } from '../services/powerAutomateSync';

const WEBHOOK_URL_KEY = 'hoc_power_automate_webhook';

export const SyncButton = () => {
  const { state } = useDashboard();
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Load webhook URL from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(WEBHOOK_URL_KEY);
    if (saved) setWebhookUrl(saved);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncStatus('idle');
    setStatusMessage('');
    
    try {
      if (webhookUrl) {
        // Sync to Power Automate (SharePoint)
        const result = await syncToPowerAutomate(webhookUrl, {
          projects: state.projects,
          operationalCosts: state.operationalCosts,
        });
        
        if (result.success) {
          setSyncStatus('success');
          setStatusMessage('Synced to SharePoint!');
        } else {
          setSyncStatus('error');
          setStatusMessage(result.message);
        }
      } else {
        // Download Excel locally
        const blob = generateExcelBlob({
          projects: state.projects,
          operationalCosts: state.operationalCosts,
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `HOC_Dashboard_Sync_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setSyncStatus('success');
        setStatusMessage('Downloaded!');
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

  const isSharePointMode = !!webhookUrl;

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
        ) : isSharePointMode ? (
          <>
            <Cloud size={16} />
            Sync to SharePoint
          </>
        ) : (
          <>
            <Download size={16} />
            Download Excel
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
        <span>
          {isSharePointMode ? '☁️ SharePoint' : '💾 Local'}
        </span>
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

// Export for use in Settings page
export const useWebhookUrl = () => {
  const [webhookUrl, setWebhookUrlState] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem(WEBHOOK_URL_KEY);
    if (saved) setWebhookUrlState(saved);
  }, []);

  const setWebhookUrl = (url: string) => {
    setWebhookUrlState(url);
    if (url) {
      localStorage.setItem(WEBHOOK_URL_KEY, url);
    } else {
      localStorage.removeItem(WEBHOOK_URL_KEY);
    }
  };

  return { webhookUrl, setWebhookUrl };
};

