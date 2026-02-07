import { useRegisterSW } from 'virtual:pwa-register/react';
import { useEffect, useState } from 'react';
import './PWAUpdateNotification.css';

interface ReleaseNotes {
  version: string;
  date: string;
  changes: string[];
}

export function PWAUpdateNotification() {
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNotes | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      r && setInterval(async () => {
        if (!(!r.installing && navigator)) return;

        if (('connection' in navigator) && !(navigator as any).onLine) return;

        const resp = await fetch(swUrl, {
          cache: 'no-store',
          headers: {
            'cache': 'no-store',
            'cache-control': 'no-cache',
          },
        });

        if (resp?.status === 200) await r.update();
      }, 60 * 60 * 1000); // Check every hour
    },
    onNeedRefresh() {
      // Fetch release notes when update is available
      fetchReleaseNotes();
    },
  });

  const fetchReleaseNotes = async () => {
    try {
      const response = await fetch('./release-notes.json', {
        cache: 'no-store',
      });
      if (response.ok) {
        const notes = await response.json();
        setReleaseNotes(notes);
      }
    } catch (error) {
      console.error('Failed to fetch release notes:', error);
    }
  };

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowDetails(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  if (!needRefresh) return null;

  return (
    <div className="pwa-update-notification" role="alert">
      <div className="pwa-update-content">
        <div className="pwa-update-header">
          <strong>🎉 New Update Available!</strong>
          {releaseNotes && (
            <span className="pwa-update-version">v{releaseNotes.version}</span>
          )}
        </div>
        
        <p className="pwa-update-message">
          A new version of the app is ready to install.
        </p>

        {releaseNotes && (
          <>
            <button
              className="pwa-update-toggle"
              onClick={() => setShowDetails(!showDetails)}
              aria-expanded={showDetails}
            >
              {showDetails ? '▼' : '▶'} What's new?
            </button>

            {showDetails && (
              <div className="pwa-update-details">
                <p className="pwa-update-date">Released: {releaseNotes.date}</p>
                <ul className="pwa-update-changes">
                  {releaseNotes.changes.map((change, index) => (
                    <li key={index}>{change}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        <div className="pwa-update-actions">
          <button
            className="pwa-update-btn pwa-update-btn-primary"
            onClick={handleUpdate}
          >
            Update Now
          </button>
          <button
            className="pwa-update-btn pwa-update-btn-secondary"
            onClick={close}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
