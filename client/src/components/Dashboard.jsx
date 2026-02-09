import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const Dashboard = ({ onNavigate, onViewPrototype }) => {
  const [stats, setStats] = useState({
    totalPrototypes: 0,
    publishedPrototypes: 0,
    activeLinks: 0,
    totalViews: 0,
    topPrototypes: [],
    recentViews: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // apiClient returns JSON directly â€” no .data wrapper
        const data = await apiClient.get('/admin/analytics');
        console.log('[Dashboard] Analytics response:', data);
        setStats({
          totalPrototypes: data.totalPrototypes || 0,
          publishedPrototypes: data.publishedPrototypes || 0,
          activeLinks: data.activeLinks || 0,
          totalViews: data.totalViews || 0,
          topPrototypes: data.topPrototypes || [],
          recentViews: data.recentViews || [],
        });
        setError(null);
      } catch (err) {
        setError(err.message || 'Failed to fetch dashboard stats');
        console.error('[Dashboard] Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>
        Loading dashboard...
      </div>
    );
  }

  const maxViews = Math.max(
    ...(stats.recentViews && stats.recentViews.length > 0
      ? stats.recentViews.map(d => Number(d.views) || 0)
      : [1]),
    1
  );

  const accentColors = {
    blue: '#1565C0',
    green: '#2E7D32',
    purple: '#6A1B9A',
    orange: '#F9A825',
  };

  return (
    <div style={{ flex: 1, overflow: 'auto', background: '#F5F7FA', padding: '32px 48px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '32px',
          }}
        >
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#001B3D' }}>
            Admin Dashboard
          </h1>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              style={{
                padding: '10px 20px',
                background: '#0066CC',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => (e.target.style.background = '#004494')}
              onMouseLeave={e => (e.target.style.background = '#0066CC')}
              onClick={() => onNavigate('prototypes')}
            >
              Upload Prototype
            </button>
            <button
              style={{
                padding: '10px 20px',
                background: '#fff',
                color: '#001B3D',
                border: '1px solid #E0E6ED',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.target.style.borderColor = '#0066CC';
                e.target.style.background = 'rgba(0,50,153,0.03)';
              }}
              onMouseLeave={e => {
                e.target.style.borderColor = '#E0E6ED';
                e.target.style.background = '#fff';
              }}
              onClick={() => onNavigate('links')}
            >
              Create Magic Link
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(211,47,47,0.08)',
              border: '1px solid rgba(211,47,47,0.25)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#D32F2F',
              marginBottom: '24px',
              fontSize: '14px',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {[
            { label: 'Total Prototypes', value: stats.totalPrototypes, color: 'blue' },
            { label: 'Published', value: stats.publishedPrototypes, color: 'green' },
            { label: 'Active Links', value: stats.activeLinks, color: 'purple' },
            { label: 'Total Views', value: stats.totalViews, color: 'orange' },
          ].map((card) => (
            <div key={card.label} style={{ display: 'flex', background: '#fff', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{ width: '4px', backgroundColor: accentColors[card.color], borderRadius: '4px 0 0 4px' }} />
              <div style={{ flex: 1, padding: '20px' }}>
                <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#6B7280', marginBottom: '8px', fontWeight: 600 }}>
                  {card.label}
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#001B3D' }}>
                  {card.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#001B3D', marginBottom: '20px' }}>
              Top Viewed Prototypes
            </h2>
            {stats.topPrototypes && stats.topPrototypes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.topPrototypes.map((proto) => (
                  <div
                    key={proto.id}
                    onClick={() => onViewPrototype(proto.id)}
                    style={{ padding: '12px 14px', background: '#F5F7FA', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s', border: '1px solid transparent' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,50,153,0.06)'; e.currentTarget.style.borderColor = '#0066CC'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#F5F7FA'; e.currentTarget.style.borderColor = 'transparent'; }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#001B3D', marginBottom: '4px' }}>{proto.title}</div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#6B7280' }}>
                      <span>{proto.views} views</span>
                      <span style={{ background: 'rgba(0,50,153,0.1)', padding: '2px 8px', borderRadius: '4px', color: '#0066CC', fontWeight: 500 }}>{proto.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6B7280', padding: '40px 20px' }}>No prototypes yet</div>
            )}
          </div>

          <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#001B3D', marginBottom: '20px' }}>
              Recent Activity
            </h2>
            {stats.recentViews && stats.recentViews.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {stats.recentViews.map((day, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', fontSize: '12px' }}>
                    <div style={{ minWidth: '80px', textAlign: 'center', color: '#6B7280' }}>{day.date}</div>
                    <div style={{ flex: 1, height: '40px', background: '#F5F7FA', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'linear-gradient(90deg, #1565C0, #0070F2)', width: `${(Number(day.views) / maxViews) * 100}%`, transition: 'width 0.3s ease' }} />
                    </div>
                    <div style={{ minWidth: '30px', textAlign: 'right', fontWeight: 600, color: '#001B3D' }}>{day.views}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#6B7280', padding: '40px 20px' }}>No activity data yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
