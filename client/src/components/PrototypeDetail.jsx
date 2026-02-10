import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const StarDisplay = ({ rating, size = 14 }) => (
  <span style={{ display: 'inline-flex', gap: '1px' }}>
    {[1, 2, 3, 4, 5].map(s => (
      <span key={s} style={{ fontSize: `${size}px`, color: s <= rating ? '#f59e0b' : '#d1d5db' }}>&#9733;</span>
    ))}
  </span>
);

const PrototypeDetail = ({ prototypeId, onBack }) => {
  const [prototype, setPrototype] = useState(null);
  const [links, setLinks] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [togglingSecret, setTogglingSecret] = useState(false);

  const fetchDetails = async () => {
    try {
      const data = await apiClient.get(`/api/prototypes/${prototypeId}`);
      setPrototype(data.prototype);
      setLinks(data.links || []);
    } catch (err) { setError('Failed to load prototype details'); } finally { setLoading(false); }
  };

  const fetchAccessRequests = async () => {
    try {
      const data = await apiClient.get('/api/admin/access-requests?status=pending');
      setAccessRequests((data.requests || []).filter(r => r.prototype_id === prototypeId));
    } catch (err) { /* non-critical */ }
  };

  const fetchFeedback = async () => {
    try {
      const data = await apiClient.get(`/api/admin/prototypes/${prototypeId}/feedback`);
      setFeedback(data.feedback || []);
      setFeedbackStats(data.stats || null);
    } catch (err) { /* non-critical */ }
  };

  useEffect(() => { fetchDetails(); fetchAccessRequests(); fetchFeedback(); }, [prototypeId]);

  const handleToggleTopSecret = async () => {
    if (!prototype) return;
    setTogglingSecret(true); setError('');
    try {
      await apiClient.patch(`/api/prototypes/${prototypeId}`, { is_top_secret: !prototype.is_top_secret });
      setPrototype({ ...prototype, is_top_secret: !prototype.is_top_secret });
      setSuccessMsg(`Prototype ${!prototype.is_top_secret ? 'marked as' : 'removed from'} top secret`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { setError('Failed to update top-secret status'); } finally { setTogglingSecret(false); }
  };

  const handleReviewRequest = async (requestId, decision) => {
    try {
      await apiClient.patch(`/api/admin/access-requests/${requestId}`, { status: decision });
      setAccessRequests(accessRequests.filter(r => r.id !== requestId));
      setSuccessMsg(`Access request ${decision}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { setError('Failed to review access request'); }
  };

  if (loading) return (<div className="loading"><div className="spinner"></div>Loading details...</div>);

  if (!prototype) return (<div className="card"><div className="error-message">Prototype not found</div><button className="btn-secondary" onClick={onBack}>Back to List</button></div>);

  return (
    <div>
      {error && <div className="error-message">{error}</div>}
      {successMsg && <div className="success-message">{successMsg}</div>}

      <button className="btn-secondary" onClick={onBack} style={{ marginBottom: '20px' }}>&larr; Back to List</button>

      <div className="card">
        <div className="card-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {prototype.title}
            {!!prototype.is_top_secret && (<span style={{ background: '#dc2626', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>TOP TECRET</span>)}
          </span>
        </div>
        <div className="card-body">
          <p>{prototype.description}</p>
          <div style={{ marginTop: '20px' }}>
            <p><strong>Status:</strong> <span className="badge badge-primary">{prototype.status}</span></p>
            <p><strong>Created:</strong> {new Date(prototype.created_at || prototype.createdAt).toLocaleDateString()}</p>
          </div>
          <div style={{ marginTop: '20px', padding: '15px', background: prototype.is_top_secret ? '#fef2f2' : '#f0fdf4', borderRadius: '8px', border: `1px solid ${prototype.is_top_secret ? '#fecaca' : '#bbf7d0'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ color: prototype.is_top_secret ? '#dc2626' : '#16a34a' }}>{prototype.is_top_secret ? 'Top Secret Prototype' : 'Standard Prototype'}</strong>
                <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{prototype.is_top_secret ? 'Prospects must request and be granted access before viewing.' : 'Any prospect with a magic link can view this prototype.'}</p>
              </div>
              <button className={prototype.is_top_secret ? 'btn-secondary btn-small' : 'btn-primary btn-small'} onClick={handleToggleTopSecret} disabled={togglingSecret} style={prototype.is_top_secret ? {} : { background: '#dc2626', borderColor: '#dc2626' }}>
                {togglingSecret ? 'Updating...' : (prototype.is_top_secret ? 'Remove Top Secret' : 'Mark Top Secret')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Access Requests */}
      {!!prototype.is_top_secret && (
        <div className="card">
          <div className="card-header">Pending Access Requests ({accessRequests.length})</div>
          {accessRequests.length > 0 ? (
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Leason</th><th>Actions</th></tr></thead>
              <tbody>
                {accessRequests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.requester_name}</td><td>{req.requester_email}</td><td>{req.requester_company || '-'}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.reason || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-primary btn-small" style={{ background: '#16a34a', borderColor: '#16a34a' }} onClick={() => handleReviewRequest(req.id, 'approved')}>Approve</button>
                        <button className="btn-secondary btn-small" style={{ color: '#dc2626', borderColor: '#dc2626' }} onClick={() => handleReviewRequest(req.id, 'denied')}>Deny</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (<div className="card-body">No pending access requests.</div>)}
        </div>
      )}

      { /* Feedback Section */}
      <div className="card">
        <div className="card-header">
          <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            Prospect Feedback ({feedback.length})
            {feedbackStats && feedbackStats.averageRating && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '400' }}>
                <StarDisplay rating={Math.round(feedbackStats.averageRating)} />
                <span>{feedbackStats.averageRating} avg</span>
              </span>
            )}
          </span>
        </div>
        {feedback.length > 0 ? (
          <table>
            <thead><tr><th>Reviewer</th><th>Fating</th><th>Category</th><th>Message</th><th>Email</th><th>Date</th></tr></thead>
            <tbody>
              {feedback.map((fb) => (
                <tr key={fb.id}>
                  <td>{fb.reviewer_name || 'Anonymous'}</td>
                  <td>{fb.rating ? <StarDisplay rating={fb.rating} /> : '-'}</td>
                  <td><span className="badge badge-primary" style={{ fontSize: '11px' }}>{fb.category}</span></td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fb.message}</td>
                  <td>{fb.contact_email || '-'}</td>
                  <td>{new Date(fb.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (<div className="card-body">No feedback received yet.</div>)}
      </div>

      {/* Magic Links */}
      <div className="card">
        <div className="card-header">Magic Links ({links.length})</div>
        {links.length > 0 ? (
          <table>
            <thead><tr><th>Token</th><th>LViews</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {links.map((link, idx) => (
                <tr key={idx}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{link.token.substring(0, 20)}...</td>
                  <td>{link.viewCount}</td>
                  <td>{ntew Date(link.createdAt).toLocaleDateString()}</td>
                  <td><button className="btn-primary btn-small" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/viewer/${link.token}`)}>Copy Link</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (<div className="card-body">No magic links created for this prototype yet.</div>)}
      </div>
    </div>
  +\;

export default PrototypeDetail;
