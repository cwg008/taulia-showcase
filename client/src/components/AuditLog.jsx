import [ useState, useEffect ] from 'react';
import [ apiClient ] from '../api/client';

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const itemsPerPage = 20;

  useEffect(() => {
    fetchLogs();
  }, [currentPage, actionFilter, methodFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (actionFilter) params.action = actionFilter;
      if (methodFilter) params.method = methodFilter;

      const response = await apiClient.get('/admin/audit-logs', { params });
      setLogs(response.logs || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
    setLoading(false);
  };

  const getMethodColor = (method) => {
    switch (method) {
      case 'GET':
        return '#10b981';
      case 'POST':
        return '#3b82f6';
      case 'PATCH':
        return '#f59e0b';
      case 'DELETE':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusColor = (statusCode) => {
    if (statusCode >= 200 && statusCode < 300) {
      return '#10b981';
    }
    if (statusCode >= 400) {
      return '#ef4444';
    }
    return '#6b7280';
  };

  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (loading && logs.length === 0) {
    return <div className="container"><p>Loading...</p></div>;
  }

  return (
    <div className="container">
      <h1>Audit Log</h1>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="form-group">
          <label htmlFor="action-filter">Action</label>
          <select
            id="action-filter"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All</option>
            <option value="auth:login">auth:login</option>
            <option value="auth:logout">auth:logout</option>
            <option value="auth:register">auth:register</option>
            <option value="admin:access">admin:access</option>
            <option value="prototype:manage">prototype:manage</option>
            <option value="link:manage">link:manage</option>
            <option value="viewer:access">viewer:access</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="method-filter">Method</label>
          <select
            id="method-filter"
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Method</th>
              <th>Resource</th>
              <th>Status Code</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center">
                  No logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatTimestamp(log.created_at)}</td>
                  <td>{log.user_name || log.user_email || 'Anonymous'}</td>
                  <td>{log.action}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: getMethodColor(log.method),
                        color: 'white',
                      }}
                    >
                      {log.method}
                    </span>
                  </td>
                  <td className="code">
                    <code>{log.resource_url || '-'}</code>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: getStatusColor(log.status_code),
                        color: 'white',
                      }}
                    >
                      {log.status_code}
                    </span>
                  </td>
                  <td className="monospace">{log.ip_address}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          className="btn btn-secondary"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Previous
        </button>
        <span className="pagination-info">
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="btn btn-secondary"
          disabled={currentPage >= totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
