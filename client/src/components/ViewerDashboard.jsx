import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import apiClient from '../api/client.js';

const ViewerDashboard = () => {
  const { user, logout } = useAuth();
  const [prototypes, setPrototypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPrototype, setSelectedPrototype] = useState(null);

  useEffect(() => { fetchPrototypes(); }, []);

  const fetchPrototypes = async () => {
    try {
      const data = await apiClient.get('/api/viewer-dashboard/prototypes');
      setPrototypes(data.prototypes || []);
    } catch (err) {
      setError('Failed to load prototypes');
    } finally {
      setLoading(false);
    }
  };

  if (selectedPrototype) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ background: 'var(--taulia-secondary)', color: 'white', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button onClick={() => setSelectedPrototype(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>&larr; Back</button>
            <span style={{ fontSize: '16px', fontWeight: '600' }}>{selectedPrototype.title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', opacity: 0.8 }}>{user?.name}</span>
            <button onClick={logout} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Logout</button>
          </div>
        </div>
        <iframe src={`/api/viewer-dashboard/prototypes/${selectedPrototype.id}/serve/index.html`} style={{ flex: 1, border: 'none', width: '100%' }} title={selectedPrototype.title} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ background: 'var(--taulia-secondary)', color: 'white', padding: '18px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '18px' }}>T</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>Taulia Prototypes</div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Welcome, {user?.name || user?.email}</div>
          </div>
        </div>
        <button onClick={logout} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Logout</button>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>Your Prototypes</h2>
        <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>The following prototypes have been shared with you for review.</p>

        {loading && (<div style={{ textAlign: 'center', padding: '40px' }}><div className="spinner"></div><p style={{ color: '#64748b' }}>Loading prototypes...</p></div>)}
        {error && <div className="error-message">{error}</div>}

        {!loading && prototypes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '16px', color: '#64748b' }}>No prototypes have been assigned to you yet.</p>
            <p style={{ fontSize: '14px', color: '#94a3b8' }}>Check back later or contact your administrator.</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {prototypes.map(proto => (
            <div key={proto.id} onClick={() => setSelectedPrototype(proto)} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ height: '140px', background: 'linear-gradient(135deg, #0070c0 0%, #1e293b 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '40px', opacity: 0.3, color: 'white' }}>&#9881;</span>
              </div>
              <div style={{ padding: '18px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '6px' }}>{proto.title}</h3>
                <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', marginBottom: '12px' }}>{proto.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: '500', color: '#16a34a', background: '#f0fdf4', padding: '3px 10px', borderRadius: '10px' }}>v{proto.version}</span>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(proto.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px', borderTop: '1px solid #e2e8f0', marginTop: '40px' }}>
        Taulia Prototype Showcase v1.3.0
      </div>
    </div>
  );
};

export default ViewerDashboard;
