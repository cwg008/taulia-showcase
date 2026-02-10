import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const PublicViewer = ({ token }) => {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessForm, setAccessForm] = useState({ name: '', email: '', company: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null); // null, 'pending', 'approved', 'denied'

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const data = await apiClient.get(`/api/viewer/${token}`);
        setMetadata(data);

        // Check access status for top-secret prototypes
        if (data.access) {
          if (data.access.granted) {
            setRequestStatus('approved');
          } else if (data.access.status) {
            setRequestStatus(data.access.status);
          }
        }
      } catch (err) {
        setError('Invalid or expired link');
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [token]);

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const result = await apiClient.post(`/api/prospect/${token}/request-access`, {
        name: accessForm.name,
        email: accessForm.email,
        company: accessForm.company,
        reason: accessForm.reason,
      });
      setRequestStatus('pending');
    } catch (err) {
      if (err.message.includes('409')) {
        setRequestStatus('pending');
      } else {
        setError('Failed to submit access request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error && !metadata) {
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

  const isTopSecret = metadata?.prototype?.is_top_secret;
  const accessGranted = metadata?.access?.granted;

  // Top-secret prototype without access - show access request flow
  if (isTopSecret && !accessGranted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div
          style={{
            background: '#1e293b',
            color: 'white',
            padding: '15px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px', fontWeight: '600' }}>
              {metadata?.prototype?.title || 'Prototype Viewer'}
            </span>
            <span style={{
              background: '#dc2626',
              color: 'white',
              padding: '3px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '700',
              letterSpacing: '1px',
            }}>
              TOP SECRET
            </span>
          </div>
          <div style={{ fontSize: '12px', opacity: 0.8 }}>
            Powered by Taulia
          </div>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          padding: '20px',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            padding: '40px',
            maxWidth: '480px',
            width: '100%',
          }}>
            {requestStatus === 'pending' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  background: '#fef9c3', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', fontSize: '28px',
                }}>
                  &#9203;
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1e293b', marginBottom: '10px' }}>
                  Access Request Pending
                </h2>
                <p style={{ color: '#64748b', lineHeight: '1.6' }}>
                  Your request to view this prototype has been submitted and is awaiting admin approval.
                  Please check back later.
                </p>
              </div>
            ) : requestStatus === 'denied' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%',
                  background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 20px', fontSize: '28px',
                }}>
                  &#10060;
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#dc2626', marginBottom: '10px' }}>
                  Access Denied
                </h2>
                <p style={{ color: '#64748b', lineHeight: '1.6' }}>
                  Your access request was not approved. Please contact the administrator for more information.
                </p>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 20px', fontSize: '28px',
                  }}>
                    &#128274;
                  </div>
                  <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1e293b', marginBottom: '10px' }}>
                    Access Required
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '14px' }}>
                    This is a restricted prototype. Please submit your information to request access.
                  </p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleRequestAccess}>
                  <div className="form-group">
                    <label htmlFor="req-name">Full Name *</label>
                    <input
                      id="req-name"
                      type="text"
                      value={accessForm.name}
                      onChange={(e) => setAccessForm({ ...accessForm, name: e.target.value })}
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="req-email">Email Address *</label>
                    <input
                      id="req-email"
                      type="email"
                      value={accessForm.email}
                      onChange={(e) => setAccessForm({ ...accessForm, email: e.target.value })}
                      placeholder="your.email@company.com"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="req-company">Company</label>
                    <input
                      id="req-company"
                      type="text"
                      value={accessForm.company}
                      onChange={(e) => setAccessForm({ ...accessForm, company: e.target.value })}
                      placeholder="Your company name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="req-reason">Reason for Access</label>
                    <textarea
                      id="req-reason"
                      value={accessForm.reason}
                      onChange={(e) => setAccessForm({ ...accessForm, reason: e.target.value })}
                      placeholder="Why do you need access to this prototype?"
                      rows={3}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    style={{ width: '100%', marginTop: '10px' }}
                    disabled={submitting}
                  >
                    {submitting ? 'Submitting...' : 'Request Access'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Normal viewer (access granted or non-top-secret)
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
          {metadata?.prototype?.title || 'Prototype Viewer'}
        </div>
        <div style={{ fontSize: '12px', opacity: 0.8 }}>
          Powered by Taulia
        </div>
      </div>

      <iframe
        src={`/api/viewer/${token}/serve/index.html`}
        style={{
          flex: 1,
          border: 'none',
          width: '100%',
        }}
        title="Prototype"
      />
    </div>
  );
};

export default PublicViewer;
