import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const PublicViewer = ({ token }) => {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const data = await apiClient.get(`/api/viewer/${token}`);
        setMetadata(data);
      } catch (err) {
        setError('Invalid or expired link');
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--taulia-bg)',
        }}
      >
        <div className="card" style={{ maxWidth: '400px' }}>
          <div className="error-message">{error}</div>
          <p>Please check the link and try again, or contact the administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div
        style={{
          background: 'var(--taulia-secondary)',
          color: 'white',
          padding: '15px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: '600' }}>
          {metadata?.prototypeTitle || 'Prototype Viewer'}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          Powered by Taulia
        </div>
      </div>

      {metadata?.previewUrl && (
        <iframe
          src={metadata.previewUrl}
          style={{
            flex: 1,
            border: 'none',
            width: '100%',
          }}
          title="Prototype"
        />
      )}
    </div>
  );
};

export default PublicViewer;
