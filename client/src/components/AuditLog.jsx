import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const pageSize = 20;

  useEffect(() => {
    fetchLogs();
  }, [page, search]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchLogs = async () => {
    try {
      let url = `/api/admin/audit-logs?page=${page}&limit=${pageSize}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const data = await apiClient.get(url);
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString();
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

      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by user email, action, or IP..."
          style={{ width: '100%', maxWidth: '400px', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }}
        />
      </div>

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
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDate(log.created_at)}</td>
                  <td>{log.user_email || 'System'}</td>
                  <td>
                    <span className="badge badge-primary">{log.action}</span>
                  </td>
                  <td>{log.resource_type}: {log.resource_id}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', gap: '8px' }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="btn-secondary btn-small"
            >
              &larr; Previous
            </button>
            <span style={{ padding: '0 10px', fontSize: '14px', color: '#64748b' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="btn-secondary btn-small"
            >
              Next &rarr;
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">{search ? 'No audit logs match your search.' : 'No audit logs available.'}</div>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
