import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const StarDisplay = ({ rating, size = 16 }) => (
  <span style={{ display: 'inline-flex', gap: '1px' }}>
    {[1, 2, 3, 4, 5].map(s => (
      <span key={s} style={{ fontSize: `${size}px`, color: s <= rating ? '#f59e0b' : '#d1d5db' }}>&#9733;</span>
    ))}
  </span>
);

const ViewsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No data available</div>;
  }

  const maxViews = Math.max(...data.map(d => d.count), 1);
  const chartHeight = 200;
  const chartWidth = Math.max(600, data.length * 40);
  const barWidth = Math.max(20, chartWidth / data.length - 10);
  const padding = 40;

  return (
    <div style={{ marginTop: '12px' }}>
      <svg width="100%" height={chartHeight + padding + 40} viewBox={`0 0 ${chartWidth + padding * 2} ${chartHeight + padding + 40}`} style={{ border: '1px solid #e5e7eb', borderRadius: '4px', backgroundColor: '#f9fafb' }}>
        {/* Y-axis */}
        <line x1={padding} y1={padding} x2={padding} y2={chartHeight + padding} stroke="#d1d5db" strokeWidth="1" />

        {/* X-axis */}
        <line x1={padding} y1={chartHeight + padding} x2={chartWidth + padding} y2={chartHeight + padding} stroke="#d1d5db" strokeWidth="1" />

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const value = Math.round(maxViews * ratio);
          const y = chartHeight + padding - (chartHeight * ratio);
          return (
            <g key={`y-${i}`}>
              <text x={padding - 5} y={y + 4} fontSize="12" textAnchor="end" fill="#6b7280">{value}</text>
              <line x1={padding - 3} y1={y} x2={padding} y2={y} stroke="#d1d5db" strokeWidth="1" />
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = (item.count / maxViews) * chartHeight;
          const x = padding + (index * (chartWidth / data.length)) + (chartWidth / data.length - barWidth) / 2;
          const y = chartHeight + padding - barHeight;

          return (
            <g key={`bar-${index}`}>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill="#0070c0" rx="2" />
              <text
                x={x + barWidth / 2}
                y={chartHeight + padding + 15}
                fontSize="11"
                textAnchor="middle"
                fill="#6b7280"
                transform={`rotate(45 ${x + barWidth / 2} ${chartHeight + padding + 15})`}
              >
                {item.date}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const ConversionFunnel = ({ analytics }) => {
  const totalViews = analytics.totalViews || 0;
  const uniqueViewers = analytics.uniqueViewers || 0;
  const feedbackSubmitted = analytics.totalFeedback || 0;
  const accessRequests = analytics.accessRequests || 0;

  const getPercentage = (value) => totalViews > 0 ? Math.round((value / totalViews) * 100) : 0;

  const stages = [
    { label: 'Total Views', value: totalViews, percentage: 100, color: '#0070c0' },
    { label: 'Unique Viewers', value: uniqueViewers, percentage: getPercentage(uniqueViewers), color: '#60a5fa' },
    { label: 'Feedback Submitted', value: feedbackSubmitted, percentage: getPercentage(feedbackSubmitted), color: '#16a34a' },
    { label: 'Access Requests', value: accessRequests, percentage: getPercentage(accessRequests), color: '#f59e0b' },
  ];

  return (
    <div style={{ marginTop: '12px' }}>
      {stages.map((stage, index) => (
        <div key={stage.label} style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '14px', color: '#374151' }}>{stage.label}</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#111827' }}>
              {stage.value} ({stage.percentage}%)
            </span>
          </div>
          <div style={{ width: '100%', height: '24px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${stage.percentage}%`,
                height: '100%',
                backgroundColor: stage.color,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

const RecentActivityFeed = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No recent activity</div>;
  }

  const timeAgo = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div style={{ marginTop: '12px' }}>
      {activities.slice(0, 20).map((activity, index) => (
        <div
          key={index}
          style={{
            padding: '12px',
            marginBottom: '8px',
            backgroundColor: '#f9fafb',
            borderRadius: '4px',
            borderLeft: '3px solid #0070c0',
            fontSize: '14px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', color: '#0070c0', marginBottom: '4px' }}>
                {activity.linkLabel || 'Unnamed Link'}
              </div>
              <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>
                {activity.prototypeTitle || 'Unknown Prototype'}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                {activity.ipAddress && <span>{activity.ipAddress} • </span>}
                {timeAgo(activity.viewedAt)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const FeedbackBreakdown = ({ analytics }) => {
  const feedbackByCategory = analytics.feedbackByCategory || {};
  const ratingDistribution = analytics.ratingDistribution || {};

  const categories = [
    { key: 'feature-request', label: 'Feature Request', color: '#0070c0' },
    { key: 'bug-report', label: 'Bug Report', color: '#dc2626' },
    { key: 'general-feedback', label: 'General Feedback', color: '#16a34a' },
    { key: 'other', label: 'Other', color: '#6b7280' },
  ];

  const totalFeedback = Object.values(feedbackByCategory).reduce((sum, val) => sum + val, 0) || 1;

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '12px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
          Feedback Categories
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(cat => (
            <div
              key={cat.key}
              style={{
                padding: '6px 12px',
                backgroundColor: cat.color,
                color: 'white',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              {cat.label}: {feedbackByCategory[cat.key] || 0}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ marginBottom: '12px', fontWeight: '600', color: '#374151', fontSize: '14px' }}>
          Rating Distribution
        </div>
        {[5, 4, 3, 2, 1].map(stars => {
          const count = ratingDistribution[stars] || 0;
          const percentage = totalFeedback > 0 ? Math.round((count / totalFeedback) * 100) : 0;

          return (
            <div key={stars} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StarDisplay rating={stars} size={14} />
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>({count})</span>
                </div>
                <span style={{ color: '#374151', fontWeight: '600', fontSize: '13px' }}>{percentage}%</span>
              </div>
              <div style={{ width: '100%', height: '20px', backgroundColor: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${percentage}%`,
                    height: '100%',
                    backgroundColor: '#f59e0b',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [detailedAnalytics, setDetailedAnalytics] = useState(null);
  const [selectedDays, setSelectedDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [detailedLoading, setDetailedLoading] = useState(false);
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

  useEffect(() => {
    const fetchDetailedAnalytics = async () => {
      setDetailedLoading(true);
      try {
        const data = await apiClient.get(`/api/admin/analytics/detailed?days=${selectedDays}`);
        setDetailedAnalytics(data);
      } catch (err) {
        console.error('Failed to load detailed analytics:', err);
      } finally {
        setDetailedLoading(false);
      }
    };
    fetchDetailedAnalytics();
  }, [selectedDays]);

  if (loading) return (<div className="loading"><div className="spinner"></div>Loading dashboard...</div>);

  return (
    <div style={{ padding: '20px' }}>
      {error && <div className="error-message">{error}</div>}

      {/* Stat Cards */}
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

      {/* Engagement Analytics Section */}
      <div style={{ marginTop: '40px' }}>
        {/* Date Range Selector */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {[
              { label: '7 Days', value: 7 },
              { label: '30 Days', value: 30 },
              { label: '90 Days', value: 90 },
              { label: 'All', value: 999999 },
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setSelectedDays(option.value)}
                style={{
                  padding: '8px 16px',
                  border: selectedDays === option.value ? 'none' : '1px solid #d1d5db',
                  backgroundColor: selectedDays === option.value ? '#0070c0' : 'white',
                  color: selectedDays === option.value ? 'white' : '#374151',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {detailedLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>Loading analytics...</div>
        ) : detailedAnalytics ? (
          <>
            {/* Views Over Time Chart */}
            <div style={{ marginBottom: '40px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                Views Over Time
              </h3>
              <ViewsChart data={detailedAnalytics.viewsOverTime} />
            </div>

            {/* Per-Prototype Engagement Table */}
            {detailedAnalytics.viewsByPrototype && detailedAnalytics.viewsByPrototype.length > 0 && (
              <div style={{ marginBottom: '40px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                  Per-Prototype Engagement
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Prototype</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Views</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Unique Viewers</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Feedback</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#374151' }}>Avg Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedAnalytics.viewsByPrototype.map((proto, index) => (
                        <tr key={proto.prototypeId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px', color: '#111827' }}>{proto.prototypeTitle}</td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#374151' }}>{proto.views}</td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#374151' }}>{proto.uniqueViewers}</td>
                          <td style={{ padding: '12px', textAlign: 'right', color: '#374151' }}>{proto.feedback}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            {proto.avgRating ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                                <span style={{ color: '#374151' }}>{proto.avgRating.toFixed(1)}</span>
                                <StarDisplay rating={Math.round(proto.avgRating)} size={12} />
                              </div>
                            ) : (
                              <span style={{ color: '#9ca3af' }}>N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Conversion Funnel */}
            {analytics && (
              <div style={{ marginBottom: '40px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                  Conversion Funnel
                </h3>
                <ConversionFunnel analytics={analytics} />
              </div>
            )}

            {/* Recent Activity Feed */}
            {detailedAnalytics.recentViews && (
              <div style={{ marginBottom: '40px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                  Recent Activity
                </h3>
                <RecentActivityFeed activities={detailedAnalytics.recentViews} />
              </div>
            )}

            {/* Feedback Breakdown */}
            {detailedAnalytics.feedbackByCategory && (
              <div style={{ marginBottom: '40px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
                  Feedback Breakdown
                </h3>
                <FeedbackBreakdown analytics={detailedAnalytics} />
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Dashboard;
