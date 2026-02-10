import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import apiClient from '../api/client.js';

const ViewerDashboard = () => {
  const { user, logout } = useAuth();
  const [prototypes, setPrototypes] = useState([]);
  const [lockedPrototypes, setLockedPrototypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPrototype, setSelectedPrototype] = useState(null);
  const [requestingAccess, setRequestingAccess] = useState(null);
  const [requestReason, setRequestReason] = useState('');
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(null);

  useEffect(() => { fetchPrototypes(); }, []);

  const fetchPrototypes = async () => {
    try {
      const data = await apiClient.get('/api/viewer-dashboard/prototypes');
      setPrototypes(data.prototypes || []);
      setLockedPrototypes(data.lockedPrototypes || []);
    } catch (err) {
      setError('Failed to load prototypes');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (protoId) => {
    setRequestSubmitting(true);
    try {
      await apiClient.post(`/api/viewer-dashboard/prototypes/${protoId}/request-access`, {
        reason: requestReason || undefined,
      });
      setRequestSuccess(protoId);
      setRequestingAccess(null);
      setRequestReason('');
      // Refresh to update status
      const data = await apiClient.get('/api/viewer-dashboard/prototypes');
      setPrototypes(data.prototypes || []);
      setLockedPrototypes(data.lockedPrototypes || []);
    } catch (err) {
      setError(err.message || 'Failed to submit access request');
    } finally {
      setRequestSubmitting(false);
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

  const allEmpty = !loading && prototypes.length === 0 && lockedPrototypes.length === 0;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ background: 'var(--taulia-secondary)', color: 'white', padding: '18px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '18px' }}>T</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600' }}>Taulia Prototypes</div>
            <div style={{ fontSize: '12px', opacity: 0.7 }}>Welcome, {user?.name || user?.email}</div>