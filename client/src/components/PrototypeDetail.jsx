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
            {!!prototype.is_top_secret && (<span style={{ background: '#dc2626', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>TOP TIEU=!