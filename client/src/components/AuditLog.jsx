import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    try {
      const data = await apiClient.get(`/api/admin/audit-logs?page=${page}&limit=${pageSize}`);
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading audit logs...
      </div>
    );
  }

  return (
    <div>
      {error && <div className="error-message">{error}</div>}

      {logs.length > 0 ? (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>{log.userEmail}</td>
                  <td>
                    <span className="badge badge-primary">{log.action}</span>
                  </td>
                  <td>{log.resourceType}: {log.resourceId}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              ← Previous
            </button>
            <span style={{ padding: '0 10px' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              Next →
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">No audit logs available.</div>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
