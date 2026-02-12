import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';
import ProspectHomepage from './ProspectHomepage.jsx';

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

  const [isHomepage, setIsHomepage] = useState(false);

  // Item 3 - Branding
  const [branding, setBranding] = useState(null);

  // Item 6 - Password Gate
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authenticating, setAuthenticating] = useState(false);

  // Item 7 - Prospect Identity
  const [prospectIdentity, setProspectIdentity] = useState(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [identityForm, setIdentityForm] = useState({ name: '', email: '', company: '' });
  const [submittingIdentity, setSubmittingIdentity] = useState(false);

  // Item 9 - Annotations / Guided Tour
  const [annotations, setAnnotations] = useState([]);
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const data = await apiClient.get(`/api/viewer/${token}`);
        // Detect homepage link
        if (data.type === 'homepage') {
          setIsHomepage(true);
          setLoading(false);
          return;
        }

        // Item 6 - Check for password requirement
        if (data.requiresPassword) {
          setRequiresPassword(true);
          setLoading(false);
          return;
        }

        setMetadata(data);
        if (data.access) {
          if (data.access.granted) setRequestStatus('approved');
          else if (data.access.status) setRequestStatus(data.access.status);
        }

        // Item 3 - Read branding from metadata
        if (data.branding) {
          setBranding(data.branding);
        }

        // Item 9 - Read annotations from metadata
        if (data.annotations && Array.isArray(data.annotations) && data.annotations.length > 0) {
          setAnnotations(data.annotations.sort((a, b) => (a.step_order || 0) - (b.step_order || 0)));
        }

        // Item 7 - Check localStorage for prospect identity
        const storedIdentity = localStorage.getItem(`taulia_prospect_${token.substring(0, 8)}`);
        if (storedIdentity) {
          try {
            setProspectIdentity(JSON.parse(storedIdentity));
          } catch (e) {
            setShowIdentityModal(true);
          }
        } else {
          setShowIdentityModal(true);
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

  // Item 6 - Handle password authentication
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setAuthenticating(true);
    setPasswordError('');
    try {
      const data = await apiClient.post(`/api/viewer/${token}/authenticate`, { password: passwordInput });
      setMetadata(data);
      setRequiresPassword(false);

      // Item 3 - Read branding from response
      if (data.branding) {
        setBranding(data.branding);
      }

      // Item 9 - Read annotations from response
      if (data.annotations && Array.isArray(data.annotations) && data.annotations.length > 0) {
        setAnnotations(data.annotations.sort((a, b) => (a.step_order || 0) - (b.step_order || 0)));
      }

      if (data.access) {
        if (data.access.granted) setRequestStatus('approved');
        else if (data.access.status) setRequestStatus(data.access.status);
      }

      // Item 7 - Check localStorage for prospect identity
      const storedIdentity = localStorage.getItem(`taulia_prospect_${token.substring(0, 8)}`);
      if (storedIdentity) {
        try {
          setProspectIdentity(JSON.parse(storedIdentity));
        } catch (e) {
          setShowIdentityModal(true);
        }
      } else {
        setShowIdentityModal(true);
      }

      setPasswordInput('');
    } catch (err) {
      setPasswordError('Incorrect password. Please try again.');
    } finally {
      setAuthenticating(false);
    }
  };

  // Item 7 - Handle prospect identity submission
  const handleIdentitySubmit = async (e) => {
    e.preventDefault();
    if (!identityForm.name.trim()) return;

    setSubmittingIdentity(true);
    try {
      await apiClient.post(`/api/viewer/${token}/identify`, {
        name: identityForm.name,
        email: identityForm.email || undefined,
        company: identityForm.company || undefined,
      });

      const identity = {
        name: identityForm.name,
        email: identityForm.email,
        company: identityForm.company,
      };
      localStorage.setItem(`taulia_prospect_${token.substring(0, 8)}`, JSON.stringify(identity));
      setProspectIdentity(identity);
      setShowIdentityModal(false);
    } catch (err) {
      setError('Failed to save identity. Please try again.');
    } finally {
      setSubmittingIdentity(false);
    }
  };

  const handleIdentitySkip = () => {
    setShowIdentityModal(false);
  };

  // Item 9 - Tour navigation
  const handleTourNext = () => {
    if (tourStep < annotations.length - 1) {
      setTourStep(tourStep + 1);
    } else {
      setTourActive(false);
    }
  };

  const handleTourPrevious = () => {
    if (tourStep > 0) {
      setTourStep(tourStep - 1);
    }
  };

  const handleTourEnd = () => {
    setTourActive(false);
    setTourStep(0);
  };

  const handleTourStepClick = (stepIndex) => {
    setTourStep(stepIndex);
  };

  if (loading) {
    return (<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><div className="spinner"></div></div>);
  }

  // Delegate to homepage view for general magic links
  if (isHomepage) {
    return <ProspectHomepage token={token} />;
  }

  // Item 6 - Password gate modal
  if (requiresPassword) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc', flexDirection: 'column' }}>
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '40px', maxWidth: '480px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>&#128274;</div>
            <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1e293b', marginBottom: '10px' }}>Password Required</h2>
            <p style={{ color: '#64748b', fontSize: '14px' }}>This prototype requires authentication.</p>
          </div>
          {passwordError && <div className="error-message">{passwordError}</div>}
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={authenticating}>
              {authenticating ? 'Unlocking...' : 'Unlock'}
            </button>
          </form>
        </div>
      </div>
    );
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

  // Item 3 - Determine header background color
  const headerBackground = branding?.primaryColor || 'var(--taulia-secondary)';

  if (isTopSecret && !accessGranted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ background: headerBackground, color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: '600' }}>
              {metadata?.prototype?.title || 'Prototype Viewer'}
              {branding?.headerText && <span style={{ marginLeft: '8px', fontSize: '14px', opacity: 0.9 }}>({branding.headerText})</span>}
            </span>
            <span style={{ background: '#dc2626', color: 'white', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', letterSpacing: '1px' }}>TOP SECRET</span>
          </div>
          {!branding?.hideTaulia && <div style={{ fontSize: '12px', opacity: 0.8 }}>Powered by Taulia</div>}
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

  // Item 7 - Identity modal
  const identityModalContent = (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '40px', maxWidth: '480px', width: '100%', margin: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1e293b', marginBottom: '10px' }}>Help us personalize your experience</h2>
          <p style={{ color: '#64748b', fontSize: '14px' }}>We'd love to know a bit about you.</p>
        </div>
        <form onSubmit={handleIdentitySubmit}>
          <div className="form-group">
            <label htmlFor="identity-name">Name *</label>
            <input
              id="identity-name"
              type="text"
              value={identityForm.name}
              onChange={(e) => setIdentityForm({ ...identityForm, name: e.target.value })}
              placeholder="Your name"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="identity-email">Email</label>
            <input
              id="identity-email"
              type="email"
              value={identityForm.email}
              onChange={(e) => setIdentityForm({ ...identityForm, email: e.target.value })}
              placeholder="your@email.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="identity-company">Company</label>
            <input
              id="identity-company"
              type="text"
              value={identityForm.company}
              onChange={(e) => setIdentityForm({ ...identityForm, company: e.target.value })}
              placeholder="Your company"
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submittingIdentity || !identityForm.name.trim()}>
              {submittingIdentity ? 'Submitting...' : 'Continue'}
            </button>
            <button type="button" onClick={handleIdentitySkip} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ background: headerBackground, color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: '600' }}>
          {metadata?.prototype?.title || 'Prototype Viewer'}
          {branding?.headerText && <span style={{ marginLeft: '8px', fontSize: '14px', opacity: 0.9 }}>({branding.headerText})</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {feedbackStats && feedbackStats.averageRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
              <StarRating rating={Math.round(feedbackStats.averageRating)} size={16} />
              <span>{feedbackStats.averageRating}</span>
              <span style={{ opacity: 0.7 }}>({feedbackStats.ratingCount})</span>
            </div>
          )}
          {annotations.length > 0 && (
            <button onClick={() => setTourActive(!tourActive)} style={{ background: tourActive ? 'rgba(255,255,255,0.2)' : 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: 'white', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
              {tourActive ? 'End Tour' : 'Start Tour'}
            </button>
          )}
          <button onClick={() => setShowFeedbackPanel(!showFeedbackPanel)} style={{ background: showFeedbackPanel ? 'rgba(255,255,255,0.2)' : 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: 'white', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
            {showFeedbackPanel ? 'Hide Feedback' : 'Leave Feedback'}
          </button>
          {!branding?.hideTaulia && <div style={{ fontSize: '12px', opacity: 0.8 }}>Powered by Taulia</div>}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <iframe src={`/api/viewer/${token}/serve/index.html`} style={{ flex: 1, border: 'none', width: showFeedbackPanel ? '60%' : '100%' }} title="Prototype" />

        {/* Item 9 - Annotations Overlay */}
        {tourActive && annotations.length > 0 && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 100, pointerEvents: 'none' }}>
            {/* Transparent overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />

            {/* Annotation circles and tooltip */}
            {annotations.map((annotation, index) => {
              const isCurrentStep = index === tourStep;
              const xPercent = annotation.x_percent || 0;
              const yPercent = annotation.y_percent || 0;
              const currentAnnotation = annotations[tourStep];

              return (
                <React.Fragment key={annotation.id || index}>
                  {/* Clickable circle */}
                  <div
                    onClick={() => handleTourStepClick(index)}
                    style={{
                      position: 'absolute',
                      left: `${xPercent}%`,
                      top: `${yPercent}%`,
                      transform: 'translate(-50%, -50%)',
                      zIndex: 101,
                      pointerEvents: 'auto',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: isCurrentStep ? '50px' : '40px',
                        height: isCurrentStep ? '50px' : '40px',
                        borderRadius: '50%',
                        background: isCurrentStep ? 'rgba(0, 112, 192, 0.9)' : 'rgba(0, 112, 192, 0.7)',
                        border: '3px solid white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        boxShadow: isCurrentStep ? '0 0 20px rgba(0, 112, 192, 0.8)' : '0 2px 8px rgba(0,0,0,0.2)',
                        animation: isCurrentStep ? 'pulse 2s infinite' : 'none',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {index + 1}
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            {/* Tooltip for current step */}
            {annotations.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'white',
                  borderRadius: '8px',
                  padding: '20px',
                  maxWidth: '350px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                  zIndex: 102,
                  pointerEvents: 'auto',
                }}
              >
                <div style={{ marginBottom: '10px', color: '#0070c0', fontSize: '12px', fontWeight: '600' }}>
                  Step {tourStep + 1} of {annotations.length}
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                  {annotations[tourStep]?.title || 'Untitled'}
                </h3>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.5', marginBottom: '15px' }}>
                  {annotations[tourStep]?.description || ''}
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleTourPrevious}
                    disabled={tourStep === 0}
                    style={{
                      padding: '6px 14px',
                      background: tourStep === 0 ? '#e2e8f0' : '#f1f5f9',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: tourStep === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      color: tourStep === 0 ? '#94a3b8' : '#475569',
                    }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleTourNext}
                    style={{
                      padding: '6px 14px',
                      background: '#0070c0',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    {tourStep === annotations.length - 1 ? 'End Tour' : 'Next'}
                  </button>
                  <button
                    onClick={handleTourEnd}
                    style={{
                      padding: '6px 14px',
                      background: '#f1f5f9',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: '#475569',
                    }}
                  >
                    Exit
                  </button>
                </div>
              </div>
            )}

            {/* CSS for pulsing animation */}
            <style>{`
              @keyframes pulse {
                0%, 100% {
                  box-shadow: 0 0 20px rgba(0, 112, 192, 0.8), 0 0 40px rgba(0, 112, 192, 0.4);
                }
                50% {
                  box-shadow: 0 0 30px rgba(0, 112, 192, 1), 0 0 60px rgba(0, 112, 192, 0.6);
                }
              }
            `}</style>
          </div>
        )}

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

      {/* Item 7 - Prospect identity modal */}
      {showIdentityModal && identityModalContent}
    </div>
  );
};

export default PublicViewer;
