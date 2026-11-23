import React from 'react';
import { AlertTriangle, ArrowRight, ShieldAlert } from 'lucide-react';

export default function SimulationBanner({ onExitSimulation }) {
  return (
    <aside className="simulation-banner" role="alert" aria-live="assertive">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span className="simulation-pill">
          <ShieldAlert size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
          SIMULATION MODE ACTIVE
        </span>
        <span>
          Simulating severe winter smog (AQI 360 · PM2.5: 210 μg/m³ · PM10: 340 μg/m³). Evaluator testing active.
        </span>
      </div>
      <button
        onClick={onExitSimulation}
        style={{
          background: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          color: '#FFFFFF',
          fontSize: '0.72rem',
          fontWeight: 700,
          padding: '0.25rem 0.6rem',
          borderRadius: '9999px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          marginLeft: '0.5rem',
          whiteSpace: 'nowrap'
        }}
      >
        <span>Return to Live</span>
        <ArrowRight size={12} />
      </button>
    </aside>
  );
}
