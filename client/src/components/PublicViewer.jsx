import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const StarRating = ({ rating, onRate, interactive = false, size = 20 }) => {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'inline-flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onClick={() => interactive && onRate && onRate(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          style={{
            cursor: interactive ? 'pointer' : 'default',
            fontSize: `${size}px`,
            color: star <= (hover || rating) ? '#f59e0b' : '#d1d5db',
            transition: 'color 0.15s',
          }}
        >
          &#9733;
        </span>
      ))}
    </div>
  );
};

const PublicViewer = ({ token }) => {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessForm, setAccessForm] = useState({ name: '', email: '', company: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    reviewerName: '', rating: 0, category: 'general-feedback', message: '', contactEmail: '',
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState('');
  const [showFeedbackPanel, setShowFeedbackPanel] = useState(false);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const data = await apiClient.get(`/api/viewer/${token}`);
        setMetadata(data);
        if (data.access) {
          if (data.access.granted) setRequestStatus('approved');
          else if (data.access.status) setRequestStatus(data.access.status);
        }
      } catch (err) {
        setError('Invalid or expired link');
      } finally {
        setLoading(false);
      }
    };
    fetchMetadata();
  }, [token]);

  useEffect(() => {
    if (metadata?.access?.granted) fetchFeedback();
  }, [metadata]);

  const fetchFeedback = async () => {
    try {
      const data = await apiClient.get(`/api/prospect/${token}/feedback`);
      setFeedback(data.feedback || []);
      setFeedbackStats(data.stats || null);
    } catch (err) { /* non-critical */ }
  };

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post(`/api/prospect/${token}/request-access`, {
        name: accessForm.name, email: accessForm.email,
        company: accessForm.company, reason: accessForm.reason,
      });
      setRequestStatus('pending');
    } catch (err) {
      if (err.message.includes('409')) setRequestStatus('pending');
      else setError('Failed to submit access request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackForm.message || feedbackForm.message.length < 10) return;
    setSubmittingFeedback(true);
    setFeedbackSuccess('');
    try {
      await apiClient.post(`/api/prospect/${token}/feedback`, {
        category: feedbackForm.category, message: feedbackForm.message,
        contactEmail: feedbackForm.contactEmail || undefined,
        rating: feedbackForm.rating > 0 ? feedbackForm.rating : undefined,
        reviewerName: feedbackForm.reviewerName || undefined,
      });
      setFeedbackSuccess('Thank you for your feedback!');
      setFeedbackForm({ reviewerName: '', rating: 0, category: 'general-feedback', message: '', contactEmail: '' });
      fetchFeedback();
      setTimeout(() => setFeedbackSuccess(''), 4000);
    } catch (err) {
      setError('Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner"></div></div>);
  }

  if (error && !metadata) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--taulia-bg)' }}>
        <div className="card" style={{ maxWidth: '400px' }}>
          <div className="error-message">{error}</div>
          <p>Please check the link and try again, or contact the administrator.</p>
        </div>
      </div>
    );
  }

  const isTopSecret = metadata?.prototype?.is_top_secret;
  const accessGranted = metadata?.access?.granted;

  if (isTopSecret && !accessGranted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ background: '#1e293b', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: '600' }}>{metadata?.prototype?.title || 'Prototype Viewer'}</span>
            <span style={{ background: '#dc2626', color: 'white', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', letterSpacing: '1px' }}>TOP SECRET</span>
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>Powered by Taulia</div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
          <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '40px', maxWidth: '480px', width: '100%' }}>
            {requestStatus === 'pending' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>&#9203;</div>
                <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1e293b', marginBottom: '10px' }}>Access Request Pending</h2>
                <p style={{ color: '#64748b', lineHeight: '1.6' }}>Your request has been submitted and is awaiting admin approval.</p>
              </div>
            ) : requestStatus === 'denied' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>&#10060;</div>
                <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#dc2626', marginBottom: '10px' }}>Access Denied</h2>
                <p style={{ color: '#64748b', lineHeight: '1.6' }}>Your access request was not approved. Contact the administrator.</p>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>&#128274;</div>
                  <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1e293b', marginBottom: '10px' }}>Access Required</h2>
                  <p style={{ color: '#64748b', fontSize: '14px' }}>This is a restricted prototype. Submit your information to request access.</p>
                </div>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleRequestAccess}>
                  <div className="form-group"><label htmlFor="req-name">Full Name *</label><input id="req-name" type="text" value={accessForm.name} onChange={(e) => setAccessForm({ ...accessForm, name: e.target.value })} placeholder="Your full name" required /></div>
                  <div className="form-group"><label htmlFor="req-email">Email Address *</label><input id="req-email" type="email" value={accessForm.email} onChange={(e) => setAccessForm({ ...accessForm, email: e.target.value })} placeholder="your.email@company.com" required /></div>
                  <div className="form-group"><label htmlFor="req-company">Company</label><input id="req-company" type="text" value={accessForm.company} onChange={(e) => setAccessForm({ ...accessForm, company: e.target.value })} placeholder="Your company name" /></div>
                  <div className="form-group"><label htmlFor="req-reason">Reason for Access</label><textarea id="req-reason" value={accessForm.reason} onChange={(e) => setAccessForm({ ...accessForm, reason: e.target.value })} placeholder="Why do you need access?" rows={3} /></div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={submitting}>{submitting ? 'Submitting...' : 'Request Access'}</button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ background: 'var(--taulia-secondary)', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: '600' }}>{metadata?.prototype?.title || 'Prototype Viewer'}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {feedbackStats && feedbackStats.averageRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
              <StarRating rating={Math.round(feedbackStats.averageRating)} size={16} />
              <span>{feedbackStats.averageRating}</span>
              <span style={{ opacity: 0.7 }}>({feedbackStats.ratingCount})</span>
            </div>
          )}
          <button onClick={() => setShowFeedbackPanel(!showFeedbackPanel)} style={{ background: showFeedbackPanel ? 'rgba(255,255,255,0.2)' : 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: 'white', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
            {showFeedbackPanel ? 'Hide Feedback' : 'Leave Feedback'}
          </button>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>Powered by Taulia</div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <iframe src={`/api/viewer/${token}/serve/index.html`} style={{ flex: 1, border: 'none', width: showFeedbackPanel ? '60%' : '100%' }} title="Prototype" />

        {showFeedbackPanel && (
          <div style={{ width: '40%', minWidth: '350px', maxWidth: '500px', background: '#f8fafc', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: 'white' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', color: '#1e293b' }}>Leave Your Feedback</h3>
              {feedbackSuccess && (<div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '14px' }}>{feedbackSuccess}</div>)}
              <form onSubmit={handleSubmitFeedback}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px', color: '#475569' }}>Your Name</label>
                  <input type="text" value={feedbackForm.reviewerName} onChange={(e) => setFeedbackForm({ ...feedbackForm, reviewerName: e.target.value })} placeholder="Optional" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px', color: '#475569' }}>Rating</label>
                  <StarRating rating={feedbackForm.rating} onRate={(r) => setFeedbackForm({ ...feedbackForm, rating: r })} interactive size={28} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px', color: '#475569' }}>Category</label>
                  <select value={feedbackForm.category} onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}>
                    <option value="general-feedback">General Feedback</option>
                    <option value="feature-request">Feature Request</option>
                    <option value="bug-report">Bug Report</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px', color: '#475569' }}>Message *</label>
                  <textarea value={feedbackForm.message} onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })} placeholder="Share your thoughts... (min 10 characters)" rows={3} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box' }} required minLength={10} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px', color: '#475569' }}>Email (optional)</label>
                  <input type="email" value={feedbackForm.contactEmail} onChange={(e) => setFeedbackForm({ ...feedbackForm, contactEmail: e.target.value })} placeholder="your@email.com" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" disabled={submittingFeedback || feedbackForm.message.length < 10} style={{ width: '100%', padding: '10px', background: '#0070c0', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', opacity: submittingFeedback || feedbackForm.message.length < 10 ? 0.6 : 1 }}>
                  {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Community Feedback ({feedback.length})</h3>
              {feedback.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '14px' }}>No feedback yet. Be the first to share your thoughts!</p>
              ) : (
                feedback.map(item => (
                  <div key={item.id} style={{ background: 'white', borderRadius: '8px', padding: '14px', marginBottom: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>{item.reviewer_name || 'Anonymous'}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    {item.rating && (<div style={{ marginBottom: '6px' }}><StarRating rating={item.rating} size={14} /></div>)}
                    <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: 0 }}>{item.message}</p>
                    <div style={{ marginTop: '6px' }}>
                      <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: '500', background: item.category === 'feature-request' ? '#ede9fe' : item.category === 'bug-report' ? '#fef2f2' : '#f0f9ff', color: item.category === 'feature-request' ? '#7c3aed' : item.category === 'bug-report' ? '#dc2626' : '#0070c0' }}>
                        {item.category.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicViewer;