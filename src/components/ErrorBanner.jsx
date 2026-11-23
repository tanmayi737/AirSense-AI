import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorBanner({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="error-banner" role="alert">
      <AlertCircle size={22} style={{ color: '#EF4444', flexShrink: 0, marginTop: '2px' }} />
      <div style={{ flex: 1 }}>
        <strong>Live Telemetry Connection Failure</strong>
        <p>{message}</p>
        <p style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: '#CBD5E1' }}>
          <em>AeroSense AI strictly displays verified live telemetry or evaluator simulation modes. Fallback approximations are never falsified as live data.</em>
        </p>
        {onRetry && (
          <button className="btn-retry" onClick={onRetry}>
            <RefreshCw size={13} />
            <span>Retry Connection</span>
          </button>
        )}
      </div>
    </div>
  );
}
