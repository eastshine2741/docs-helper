import React from 'react';
import ReactDOM from 'react-dom/client';

/**
 * Options page entry point
 * Placeholder for Phase 6 (User Story 4)
 */

const OptionsPage: React.FC = () => {
  return (
    <div style={{ padding: '32px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '16px' }}>
        DocsChat Options
      </h1>
      <p style={{ color: '#4A5568', marginBottom: '16px' }}>
        Options page will be implemented in Phase 6 (User Story 4).
      </p>
      <p style={{ fontSize: '14px', color: '#718096' }}>
        This is a placeholder to allow the extension to load.
      </p>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <OptionsPage />
  </React.StrictMode>
);
