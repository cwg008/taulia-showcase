import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentViews, setRecentViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await apiClient.get('/api/admin/analytics');
        setStats(data.stats);
        setRecentViews(data.recentViews || []);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div>
      {error && <div className="error-message">{error}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Active Prototypes</div>
            <div className="stat-value">{stats.prototypeCount || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Magic Links</div>
            <div className="stat-value">{stats.activeLinkCount || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Views</div>
            <div className="stat-value">{stats.totalViews || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Active Users</div>
            <div className="stat-value">{stats.activeUserCount || 0}</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">Recent Views</div>
        {recentViews.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Prototype</th>
                <th>Viewer</th>
                <th>Time</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {recentViews.map((view, idx) => (
                <tr key={idx}>
                  <td>{view.prototypeTitle}</td>
                  <td>{view.viewerEmail || 'Anonymous'}</td>
                  <td>{new Date(view.createdAt).toLocaleDateString()}</td>
                  <td>{view.duration || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="card-body">No recent views yet.</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
