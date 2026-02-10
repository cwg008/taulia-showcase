import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const AccessRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const url = filter ? `/api/admin/access-requests?status=${filter}` : '/api/admin/access-requests';
      const data = await apiClient.get(url);
      setRequests(data.requests || []);
    } catch (err) {
      setError('Failed to load access requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId, decision) => {
    try {
      await apiClient.patch(`/api/admin/access-requests/${requestId}`, {
        status: decision,
      });
      setRequests(requests.filter(r => r.id !== requestId));
      setSuccessMsg(`Access request ${decision}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to review request');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading access requests...
      </div>
    );
  }

  return (
    <div>
      {error && <div className="error-message">{error}</div>}
      {successMsg && <div className="success-message">{successMsg}</div>}

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        {['pending', 'approved', 'denied', ''].map((f) => (
          <button
            key={f}
            className={filter === f ? 'btn-primary btn-small' : 'btn-secondary btn-small'}
            onClick={() => setFilter(f)}
          >
            {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {requests.length > 0 ? (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Prototype</th>
                <th>Name</th>
                <th>Email</th>
                <th>Company</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Requested</th>
                {filter === 'pending' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>
                    <strong>{req.prototype_title || 'Unknown'}</strong>
                  </td>
                  <td>{req.requester_name}</td>
                  <td>{req.requester_email}</td>
                  <td>{req.requester_company || '-'}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {req.reason || '-'}
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: req.status === 'approved' ? '#dcfce7' : req.status === 'denied' ? '#fef2f2' : '#fef9c3',
                        color: req.status === 'approved' ? '#16a34a' : req.status === 'denied' ? '#dc2626' : '#ca8a04',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td>{new Date(req.created_at).toLocaleDateString()}</td>
                  {filter === 'pending' && (
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn-primary btn-small"
                          style={{ background: '#16a34a', borderColor: '#16a34a' }}
                          onClick={() => handleReview(req.id, 'approved')}
                        >
                          Approve
                        </button>
                        <button
                          className="btn-secondary btn-small"
                          style={{ color: '#dc2626', borderColor: '#dc2626' }}
                          onClick={() => handleReview(req.id, 'denied')}
                        >
                          Deny
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            No {filter || ''} access requests found.
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessRequests;
