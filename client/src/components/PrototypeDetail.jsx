import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const PrototypeDetail = ({ prototypeId, onBack }) => {
  const [prototype, setPrototype] = useState(null);
  const [links, setLinks] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [togglingSecret, setTogglingSecret] = useState(false);

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

  const fetchAccessRequests = async () => {
    try {
      const data = await apiClient.get('/api/admin/access-requests?status=pending');
      // Filter to only requests for this prototype
      const filtered = (data.requests || []).filter(r => r.prototype_id === prototypeId);
      setAccessRequests(filtered);
    } catch (err) {
      // Non-critical, don't show error
    }
  };

  useEffect(() => {
    fetchDetails();
    fetchAccessRequests();
  }, [prototypeId]);

  const handleToggleTopSecret = async () => {
    if (!prototype) return;
    setTogglingSecret(true);
    setError('');
    try {
      await apiClient.patch(`/api/prototypes/${prototypeId}`, {
        is_top_secret: !prototype.is_top_secret,
      });
      setPrototype({ ...prototype, is_top_secret: !prototype.is_top_secret });
      setSuccessMsg(`Prototype ${!prototype.is_top_secret ? 'marked as' : 'removed from'} top secret`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to update top-secret status');
    } finally {
      setTogglingSecret(false);
    }
  };

  const handleReviewRequest = async (requestId, decision) => {
    try {
      await apiClient.patch(`/api/admin/access-requests/${requestId}`, {
        status: decision,
      });
      setAccessRequests(accessRequests.filter(r => r.id !== requestId));
      setSuccessMsg(`Access request ${decision}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to review access request');
    }
  };

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
      {successMsg && <div className="success-message">{successMsg}</div>}

      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '20px' }}>
        &larr; Back to List
      </button>

      <div className="card">
        <div className="card-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {prototype.title}
            {!!prototype.is_top_secret && (
              <span style={{
                background: '#dc2626',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.5px',
              }}>
                TOP SECRET
              </span>
            )}
          </span>
        </div>
        <div className="card-body">
          <p>{prototype.description}</p>
          <div style={{ marginTop: '20px' }}>
            <p>
              <strong>Status:</strong> <span className="badge badge-primary">{prototype.status}</span>
            </p>
            <p>
              <strong>Created:</strong> {new Date(prototype.created_at || prototype.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: prototype.is_top_secret ? '#fef2f2' : '#f0fdf4',
            borderRadius: '8px',
            border: `1px solid ${prototype.is_top_secret ? '#fecaca' : '#bbf7d0'}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ color: prototype.is_top_secret ? '#dc2626' : '#16a34a' }}>
                  {prototype.is_top_secret ? 'Top Secret Prototype' : 'Standard Prototype'}
                </strong>
                <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                  {prototype.is_top_secret
                    ? 'Prospects must request and be granted access before viewing this prototype.'
                    : 'Any prospect with a magic link can view this prototype.'}
                </p>
              </div>
              <button
                className={prototype.is_top_secret ? 'btn-secondary btn-small' : 'btn-primary btn-small'}
                onClick={handleToggleTopSecret}
                disabled={togglingSecret}
                style={prototype.is_top_secret ? {} : {
                  background: '#dc2626',
                  borderColor: '#dc2626',
                }}
              >
                {togglingSecret ? 'Updating...' : (prototype.is_top_secret ? 'Remove Top Secret' : 'Mark Top Secret')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Access Requests section - only show for top-secret prototypes */}
      {!!prototype.is_top_secret && (
        <div className="card">
          <div className="card-header">
            Pending Access Requests ({accessRequests.length})
          </div>
          {accessRequests.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Company</th>
                  <th>Reason</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accessRequests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.requester_name}</td>
                    <td>{req.requester_email}</td>
                    <td>{req.requester_company || '-'}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {req.reason || '-'}
                    </td>
                    <td>{new Date(req.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn-primary btn-small"
                          style={{ background: '#16a34a', borderColor: '#16a34a' }}
                          onClick={() => handleReviewRequest(req.id, 'approved')}
                        >
                          Approve
                        </button>
                        <button
                          className="btn-secondary btn-small"
                          style={{ color: '#dc2626', borderColor: '#dc2626' }}
                          onClick={() => handleReviewRequest(req.id, 'denied')}
                        >
                          Deny
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="card-body">No pending access requests.</div>
          )}
        </div>
      )}

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
