import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const PrototypeDetail = ({ prototypeId, onBack }) => {
  const [prototype, setPrototype] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await apiClient.get(`/api/prototypes/${prototypeId}`);
        setPrototype(data.prototype);
        setLinks(data.links || []);
      } catch (err) {
        setError('Failed to load prototype details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [prototypeId]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading details...
      </div>
    );
  }

  if (!prototype) {
    return (
      <div className="card">
        <div className="error-message">Prototype not found</div>
        <button className="btn-secondary" onClick={onBack}>
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div>
      {error && <div className="error-message">{error}</div>}

      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '20px' }}>
        ← Back to List
      </button>

      <div className="card">
        <div className="card-header">{prototype.title}</div>
        <div className="card-body">
          <p>{prototype.description}</p>
          <div style={{ marginTop: '20px' }}>
            <p>
              <strong>Status:</strong> <span className="badge badge-primary">{prototype.status}</span>
            </p>
            <p>
              <strong>Created:</strong> {new Date(prototype.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {prototype.previewUrl && (
        <div className="card">
          <div className="card-header">Preview</div>
          <iframe
            src={prototype.previewUrl}
            style={{
              width: '100%',
              height: '600px',
              border: '1px solid var(--taulia-border)',
              borderRadius: '4px',
            }}
            title="Prototype Preview"
          />
        </div>
      )}

      <div className="card">
        <div className="card-header">Magic Links ({links.length})</div>
        {links.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>Views</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link, idx) => (
                <tr key={idx}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    {link.token.substring(0, 20)}...
                  </td>
                  <td>{link.viewCount}</td>
                  <td>{new Date(link.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-primary btn-small"
                      onClick={() => {
                        const url = `${window.location.origin}/viewer/${link.token}`;
                        navigator.clipboard.writeText(url);
                      }}
                    >
                      Copy Link
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="card-body">No magic links created for this prototype yet.</div>
        )}
      </div>
    </div>
  );
};

export default PrototypeDetail;
