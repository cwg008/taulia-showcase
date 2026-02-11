import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const ProspectHomepage = ({ token }) => {
  const [prototypes, setPrototypes] = useState([]);
  const [restrictedPrototypes, setRestrictedPrototypes] = useState([]);
  const [linkInfo, setLinkInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingPrototype, setViewingPrototype] = useState(null);
  const [requestingAccess, setRequestingAccess] = useState(null);
  const [accessForm, setAccessForm] = useState({ name: '', email: '', company: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(null);

  useEffect(() => {
    fetchHomepageData();
  }, [token]);

  const fetchHomepageData = async () => {
    try {
      const data = await apiClient.get(`/api/viewer/${token}/homepage`);
      setPrototypes(data.prototypes || []);
      setRestrictedPrototypes(data.restrictedPrototypes || []);
      setLinkInfo(data.link || null);
    } catch (err) {
      setError('Failed to load prototypes. The link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (e) => {
    e.preventDefault();
    if (!requestingAccess) return;
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post(`/api/viewer/${token}/homepage/request-access`, {
        prototypeId: requestingAccess,
        name: accessForm.name,
        email: accessForm.email,
        company: accessForm.company || undefined,
        reason: accessForm.reason || undefined,
      });
      setRequestSuccess(requestingAccess);
      setRequestingAccess(null);
      setAccessForm({ name: '', email: '', company: '', reason: '' });
      // Refresh data to update access statuses
      const data = await apiClient.get(`/api/viewer/${token}/homepage`);
      setRestrictedPrototypes(data.restrictedPrototypes || []);
    } catch (err) {
      if (err.message.includes('409')) {
        setRequestSuccess(requestingAccess);
        setRequestingAccess(null);
      } else {
        setError('Failed to submit access request. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Fullscreen iframe overlay for viewing a prototype
  if (viewingPrototype) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{
          background: '#1e293b', color: 'white', padding: '12px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={() => setViewingPrototype(null)}
              style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white',
                padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px',
              }}
            >
              &larr; Back to Prototypes
            </button>
            <span style={{ fontSize: '16px', fontWeight: '600' }}>{viewingPrototype.title}</span>
          </div>
          <div style={{ fontSize: '12px', opacity: 0.7 }}>Powered by Taulia</div>
        </div>
        <iframe
          src={`/api/viewer/${token}/homepage/serve/${viewingPrototype.id}/index.html`}
          style={{ flex: 1, border: 'none', width: '100%' }}
          title={viewingPrototype.title}
        />
      </div>
    );
  }

  // Access request modal overlay
  const renderAccessModal = () => {
    if (!requestingAccess) return null;
    const proto = restrictedPrototypes.find(p => p.id === requestingAccess);
    if (!proto) return null;

    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000, padding: '20px',
      }} onClick={() => setRequestingAccess(null)}>
        <div style={{
          background: 'white', borderRadius: '12px', padding: '32px',
          maxWidth: '460px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }} onClick={e => e.stopPropagation()}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '50%', background: '#fef2f2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '24px',
            }}>&#128274;</div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
              Request Access
            </h2>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              Submit your information to access <strong>{proto.title}</strong>
            </p>
          </div>
          <form onSubmit={handleRequestAccess}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px', color: '#475569' }}>Full Name *</label>
              <input type="text" value={accessForm.name} onChange={e => setAccessForm({ ...accessForm, name: e.target.value })} placeholder="Your full name" required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px', color: '#475569' }}>Email Address *</label>
              <input type="email" value={accessForm.email} onChange={e => setAccessForm({ ...accessForm, email: e.target.value })} placeholder="your.email@company.com" required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px', color: '#475569' }}>Company</label>
              <input type="text" value={accessForm.company} onChange={e => setAccessForm({ ...accessForm, company: e.target.value })} placeholder="Your company name"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '4px', color: '#475569' }}>Reason for Access</label>
              <textarea value={accessForm.reason} onChange={e => setAccessForm({ ...accessForm, reason: e.target.value })} placeholder="Why do you need access to this prototype?" rows={3}
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={submitting}
                style={{
                  flex: 1, padding: '10px', background: '#0070c0', color: 'white', border: 'none',
                  borderRadius: '6px', cursor: submitting ? 'wait' : 'pointer', fontSize: '14px',
                  fontWeight: '500', opacity: submitting ? 0.7 : 1,
                }}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
              <button type="button" onClick={() => setRequestingAccess(null)}
                style={{
                  padding: '10px 16px', background: 'white', color: '#64748b', border: '1px solid #d1d5db',
                  borderRadius: '6px', cursor: 'pointer', fontSize: '14px',
                }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error && prototypes.length === 0 && restrictedPrototypes.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
        <div className="card" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <div className="error-message">{error}</div>
          <p>Please check the link and try again, or contact the administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {renderAccessModal()}

      {/* Header */}
      <div style={{
        background: '#1e293b', color: 'white', padding: '20px 30px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontWeight: '700', fontSize: '18px',
          }}>T</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>Taulia Prototypes</div>
            {linkInfo?.label && (
              <div style={{ fontSize: '12px', opacity: 0.7 }}>{linkInfo.label}</div>
            )}
          </div>
        </div>
        <div style={{ fontSize: '12px', opacity: 0.7 }}>Powered by Taulia</div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '30px' }}>
        {error && <div className="error-message" style={{ marginBottom: '16px' }}>{error}</div>}

        {/* Prototypes Section */}
        {prototypes.length > 0 && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
              Prototypes
            </h2>
            <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>
              Click on a prototype to view it.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px', marginBottom: '40px',
            }}>
              {prototypes.map(proto => (
                <div key={proto.id}
                  onClick={() => setViewingPrototype(proto)}
                  style={{
                    background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0',
                    overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div style={{
                    height: '130px', background: 'linear-gradient(135deg, #0070c0 0%, #1e293b 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: '40px', opacity: 0.3, color: 'white' }}>&#9881;</span>
                  </div>
                  <div style={{ padding: '18px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>{proto.title}</h3>
                    <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', marginBottom: '12px' }}>
                      {proto.description || 'No description available.'}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: '500', color: '#0070c0',
                        background: '#f0f9ff', padding: '3px 10px', borderRadius: '10px',
                      }}>View Prototype</span>
                      <span style={{
                        fontSize: '11px', fontWeight: '500', color: '#16a34a',
                        background: '#f0fdf4', padding: '3px 10px', borderRadius: '10px',
                      }}>v{proto.version}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Restricted Prototypes Section */}
        {restrictedPrototypes.length > 0 && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>
              Restricted Prototypes
            </h2>
            <p style={{ color: '#64748b', marginBottom: '20px', fontSize: '14px' }}>
              These prototypes require approval before you can view them.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px',
            }}>
              {restrictedPrototypes.map(proto => {
                const isApproved = proto.accessGranted;
                const isPending = proto.accessStatus === 'pending';
                const isDenied = proto.accessStatus === 'denied';
                const justRequested = requestSuccess === proto.id;

                return (
                  <div key={proto.id} style={{
                    background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0',
                    overflow: 'hidden', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    cursor: isApproved ? 'pointer' : 'default',
                    transition: isApproved ? 'box-shadow 0.2s, transform 0.2s' : 'none',
                  }}
                    onClick={() => isApproved && setViewingPrototype(proto)}
                    onMouseEnter={e => { if (isApproved) { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                    onMouseLeave={e => { if (isApproved) { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                  >
                    {/* Card header with blur + lock overlay */}
                    <div style={{
                      height: '130px', background: 'linear-gradient(135deg, #0070c0 0%, #1e293b 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      filter: isApproved ? 'none' : 'blur(4px)', position: 'relative',
                    }}>
                      <span style={{ fontSize: '40px', opacity: 0.3, color: 'white' }}>&#9881;</span>
                    </div>
                    {!isApproved && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '130px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.35)',
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '28px', marginBottom: '4px' }}>&#128274;</div>
                          <span style={{
                            fontSize: '10px', fontWeight: '700', color: '#fbbf24',
                            background: 'rgba(0,0,0,0.6)', padding: '3px 10px', borderRadius: '4px',
                            letterSpacing: '1px', textTransform: 'uppercase',
                          }}>Top Secret</span>
                        </div>
                      </div>
                    )}

                    <div style={{ padding: '18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: 0 }}>{proto.title}</h3>
                        <span style={{
                          fontSize: '9px', fontWeight: '700', color: '#dc2626',
                          background: '#fef2f2', padding: '2px 8px', borderRadius: '4px',
                          letterSpacing: '0.5px', textTransform: 'uppercase',
                        }}>TOP SECRET</span>
                      </div>
                      <p style={{
                        fontSize: '13px', color: '#64748b', lineHeight: '1.5', marginBottom: '14px',
                        filter: isApproved ? 'none' : 'blur(3px)', userSelect: isApproved ? 'auto' : 'none',
                      }}>
                        {proto.description || 'No description available.'}
                      </p>

                      {/* Access status / actions */}
                      {isApproved && (
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                          <span style={{
                            fontSize: '11px', fontWeight: '500', color: '#16a34a',
                            background: '#f0fdf4', padding: '3px 10px', borderRadius: '10px',
                          }}>Access Granted - View Prototype</span>
                          <span style={{
                            fontSize: '11px', fontWeight: '500', color: '#16a34a',
                            background: '#f0fdf4', padding: '3px 10px', borderRadius: '10px',
                          }}>v{proto.version}</span>
                        </div>
                      )}

                      {(isPending || justRequested) && !isApproved && (
                        <div style={{
                          background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px',
                          padding: '10px 14px', fontSize: '13px', color: '#92400e',
                          display: 'flex', alignItems: 'center', gap: '8px',
                        }}>
                          <span>&#9203;</span>
                          <span>Access request pending &mdash; awaiting admin approval</span>
                        </div>
                      )}

                      {isDenied && (
                        <div style={{
                          background: '#fef2f2', border: '1px solid #ef4444', borderRadius: '8px',
                          padding: '10px 14px', fontSize: '13px', color: '#991b1b',
                        }}>
                          Access request was denied. Contact the administrator for more information.
                        </div>
                      )}

                      {!isApproved && !isPending && !isDenied && !justRequested && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setRequestingAccess(proto.id); setAccessForm({ name: '', email: '', company: '', reason: '' }); }}
                          style={{
                            width: '100%', padding: '10px',
                            background: 'linear-gradient(135deg, #0070c0, #1e293b)',
                            color: 'white', border: 'none', borderRadius: '8px',
                            cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                          }}
                        >
                          <span>&#128274;</span> Request Access
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {prototypes.length === 0 && restrictedPrototypes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '16px', color: '#64748b' }}>No prototypes are currently available.</p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Check back later or contact the administrator.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px',
        borderTop: '1px solid #e2e8f0', marginTop: '40px',
      }}>
        Powered by Taulia
      </div>
    </div>
  );
};

export default ProspectHomepage;
