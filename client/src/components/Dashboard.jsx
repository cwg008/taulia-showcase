import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const StarDisplay = ({ rating, size = 16 }) => (
  <span style={{ display: 'inline-flex', gap: '1px' }}>
    {[1, 2, 3, 4, 5].map(s => (
      <span key={s} style={{ fontSize: `${size}px`, color: s <= rating ? '#f59e0b' : '#d1d5db' }}>&#9733;</span>
    ))}
  </span>
);

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [recentViews, setRecentViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await apiClient.get('/api/admin/analytics');
        setAnalytics(data.analytics);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return (<div className="loading"><div className="spinner"></div>Loading dashboard...</div>);

  return (
    <div>
      {error && <div className="error-message">{error}</div>}

      {analytics && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Prototypes</div>
            <div className="stat-value">{analytics.totalPrototypes || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Magic Links</div>
            <div className="stat-value">{analytics.totalLinks || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Views</div>
            <div className="stat-value">{analytics.totalViews || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Users</div>
            <div className="stat-value">{analytics.totalUsers || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Requests</div>
            <div className="stat-value" style={{ color: analytics.pendingAccessRequests > 0 ? '#dc2626' : undefined }}>
              {analytics.pendingAccessRequests || 0}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Feedback</div>
            <div className="stat-value">{analytics.totalFeedback || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Rating</div>
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {analytics.averageRating ? (
                <>
                  <span>{analytics.averageRating}</span>
                  <StarDisplay rating={Math.round(analytics.averageRating)} />
                </>
              ) : 'N/A'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Ratings</div>
            <div className="stat-value">{analytics.ratingCount || 0}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
