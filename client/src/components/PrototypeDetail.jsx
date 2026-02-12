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
  const [showPreview, setShowPreview] = useState(false);

  // Annotations state
  const [annotations, setAnnotations] = useState([]);
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [annotationForm, setAnnotationForm] = useState({ title: '', description: '', xPercent: 50, yPercent: 50, stepOrder: 1 });
  const [editingAnnotation, setEditingAnnotation] = useState(null);

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

  const fetchAnnotations = async () => {
    try {
      const data = await apiClient.get(`/api/prototypes/${prototypeId}/annotations`);
      setAnnotations(data.annotations || []);
    } catch (err) { /* non-critical */ }
  };

  useEffect(() => { fetchDetails(); fetchAccessRequests(); fetchFeedback(); fetchAnnotations(); }, [prototypeId]);

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

  const handleCreateAnnotation = async (e) => {
    e.preventDefault();
    if (!annotationForm.title) return;
    try {
      await apiClient.post(`/api/prototypes/${prototypeId}/annotations`, {
        title: annotationForm.title,
        description: annotationForm.description,
        xPercent: parseInt(annotationForm.xPercent),
        yPercent: parseInt(annotationForm.yPercent),
        stepOrder: parseInt(annotationForm.stepOrder),
      });
      setAnnotationForm({ title: '', description: '', xPercent: 50, yPercent: 50, stepOrder: annotations.length + 2 });
      setShowAnnotationForm(false);
      setSuccessMsg('Annotation created');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchAnnotations();
    } catch (err) { setError('Failed to create annotation'); }
  };

  const handleUpdateAnnotation = async (e) => {
    e.preventDefault();
    if (!editingAnnotation) return;
    try {
      await apiClient.patch(`/api/prototypes/${prototypeId}/annotations/${editingAnnotation.id}`, {
        title: annotationForm.title,
        description: annotationForm.description,
        xPercent: parseInt(annotationForm.xPercent),
        yPercent: parseInt(annotationForm.yPercent),
        stepOrder: parseInt(annotationForm.stepOrder),
      });
      setEditingAnnotation(null);
      setShowAnnotationForm(false);
      setAnnotationForm({ title: '', description: '', xPercent: 50, yPercent: 50, stepOrder: annotations.length + 1 });
      setSuccessMsg('Annotation updated');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchAnnotations();
    } catch (err) { setError('Failed to update annotation'); }
  };

  const handleDeleteAnnotation = async (annotationId) => {
    if (!window.confirm('Delete this annotation?')) return;
    try {
      await apiClient.delete(`/api/prototypes/${prototypeId}/annotations/${annotationId}`);
      fetchAnnotations();
      setSuccessMsg('Annotation deleted');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { setError('Failed to delete annotation'); }
  };

  const startEditAnnotation = (ann) => {
    setEditingAnnotation(ann);
    setAnnotationForm({
      title: ann.title,
      description: ann.description || '',
      xPercent: ann.x_percent,
      yPercent: ann.y_percent,
      stepOrder: ann.step_order,
    });
    setShowAnnotationForm(true);
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
            {!!prototype.is_top_secret && (<span style={{ background: '#dc2626', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px' }}>TOP SECRET</span>)}
          </span>
        </div>
        <div className="card-body">
          <p>{prototype.description}</p>
          <div style={{ marginTop: '20px' }}>
            <p><strong>Status:</strong> <span className="badge badge-primary">{prototype.status}</span></p>
            <p><strong>Created:</strong> {new Date(prototype.created_at || prototype.createdAt).toLocaleDateString()}</p>
          </div>

          {/* Preview button */}
          <div style={{ marginTop: '15px' }}>
            <button className="btn-primary btn-small" onClick={() => setShowPreview(!showPreview)} style={{ marginRight: '10px' }}>
              {showPreview ? 'Hide Preview' : 'Preview Prototype'}
            </button>
          </div>

          {/* Preview iframe */}
          {showPreview && (
            <div style={{ marginTop: '15px', border: '2px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ background: '#f1f5f9', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#64748b' }}>Live Preview</span>
                <button className="btn-secondary btn-small" onClick={() => setShowPreview(false)} style={{ fontSize: '11px', padding: '3px 10px' }}>Close</button>
              </div>
              <iframe
                src={`/api/prototypes/${prototypeId}/serve/index.html`}
                style={{ width: '100%', height: '600px', border: 'none' }}
                title="Prototype Preview"
              />
            </div>
          )}

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

      {/* Annotations Section */}
      <div className="card">
        <div className="card-header">
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span>Guided Tour Annotations ({annotations.length})</span>
            <button className="btn-primary btn-small" onClick={() => { setEditingAnnotation(null); setAnnotationForm({ title: '', description: '', xPercent: 50, yPercent: 50, stepOrder: annotations.length + 1 }); setShowAnnotationForm(!showAnnotationForm); }}>
              {showAnnotationForm && !editingAnnotation ? 'Cancel' : '+ Add Annotation'}
            </button>
          </span>
        </div>

        {showAnnotationForm && (
          <div style={{ padding: '16px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <form onSubmit={editingAnnotation ? handleUpdateAnnotation : handleCreateAnnotation}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#475569' }}>Title *</label>
                  <input type="text" value={annotationForm.title} onChange={e => setAnnotationForm({...annotationForm, title: e.target.value})} placeholder="e.g., Dashboard Overview" required style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#475569' }}>Step Order</label>
                  <input type="number" value={annotationForm.stepOrder} onChange={e => setAnnotationForm({...annotationForm, stepOrder: e.target.value})} min="1" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#475569' }}>Description</label>
                <textarea value={annotationForm.description} onChange={e => setAnnotationForm({...annotationForm, description: e.target.value})} placeholder="Describe what this step shows..." rows={2} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#475569' }}>X Position (0-100%)</label>
                  <input type="number" value={annotationForm.xPercent} onChange={e => setAnnotationForm({...annotationForm, xPercent: e.target.value})} min="0" max="100" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#475569' }}>Y Position (0-100%)</label>
                  <input type="number" value={annotationForm.yPercent} onChange={e => setAnnotationForm({...annotationForm, yPercent: e.target.value})} min="0" max="100" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn-primary btn-small">{editingAnnotation ? 'Update' : 'Create'} Annotation</button>
                <button type="button" className="btn-secondary btn-small" onClick={() => { setShowAnnotationForm(false); setEditingAnnotation(null); }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {annotations.length > 0 ? (
          <table>
            <thead><tr><th>Step</th><th>Title</th><th>Description</th><th>Position</th><th>Actions</th></tr></thead>
            <tbody>
              {annotations.map(ann => (
                <tr key={ann.id}>
                  <td><span style={{ background: '#0070c0', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px' }}>{ann.step_order}</span></td>
                  <td style={{ fontWeight: '600' }}>{ann.title}</td>
                  <td style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#64748b' }}>{ann.description || '-'}</td>
                  <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>({ann.x_percent}%, {ann.y_percent}%)</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn-secondary btn-small" onClick={() => startEditAnnotation(ann)}>Edit</button>
                      <button className="btn-secondary btn-small" style={{ color: '#dc2626', borderColor: '#dc2626' }} onClick={() => handleDeleteAnnotation(ann.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (<div className="card-body" style={{ color: '#94a3b8' }}>No annotations yet. Add annotations to create a guided tour for prospects.</div>)}
      </div>

      {/* Access Requests */}
      {!!prototype.is_top_secret && (
        <div className="card">
          <div className="card-header">Pending Access Requests ({accessRequests.length})</div>
          {accessRequests.length > 0 ? (
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Reason</th><th>Requested</th><th>Actions</th></tr></thead>
              <tbody>
                {accessRequests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.requester_name}</td><td>{req.requester_email}</td><td>{req.requester_company || '-'}</td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.reason || '-'}</td>
                    <td>{new Date(req.created_at).toLocaleDateString()}</td>
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

      {/* Feedback Section */}
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
            <thead><tr><th>Reviewer</th><th>Rating</th><th>Category</th><th>Message</th><th>Email</th><th>Date</th></tr></thead>
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
            <thead><tr><th>Token</th><th>Views</th><th>Created</th><th>Actions</th></tr></thead>
            <tbody>
              {links.map((link, idx) => (
                <tr key={idx}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{link.token.substring(0, 20)}...</td>
                  <td>{link.viewCount}</td>
                  <td>{new Date(link.createdAt).toLocaleDateString()}</td>
                  <td><button className="btn-primary btn-small" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/viewer/${link.token}`)}>Copy Link</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (<div className="card-body">No magic links created for this prototype yet.</div>)}
      </div>
    </div>
  );
};

export default PrototypeDetail;
