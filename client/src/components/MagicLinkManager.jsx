import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const MagicLinkManager = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const data = await apiClient.get('/api/links');
      setLinks(data.links || []);
    } catch (err) {
      setError('Failed to load magic links');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}/viewer/${token}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const revokeLink = async (linkId) => {
    if (!window.confirm('Are you sure you want to revoke this link?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/links/${linkId}`);
      fetchLinks();
    } catch (err) {
      setError('Failed to revoke link');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading magic links...
      </div>
    );
  }

  return (
    <div>
      {error && <div className="error-message">{error}</div>}

      {links.length > 0 ? (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>Prototype</th>
                <th>Views</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    {link.token.substring(0, 20)}...
                  </td>
                  <td>{link.prototypeTitle}</td>
                  <td>{link.viewCount}</td>
                  <td>
                    <span className={`badge ${link.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {link.isActive ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td>{new Date(link.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn-primary btn-small"
                      onClick={() => copyLink(link.token)}
                      style={{ marginRight: '8px' }}
                    >
                      Copy
                    </button>
                    <button
                      className="btn-danger btn-small"
                      onClick={() => revokeLink(link.id)}
                      disabled={!link.isActive}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">No magic links created yet.</div>
        </div>
      )}
    </div>
  );
};

export default MagicLinkManager;
