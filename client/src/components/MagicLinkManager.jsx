import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';
import SearchFilterBar from './SearchFilterBar.jsx';

const MagicLinkManager = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [prototypes, setPrototypes] = useState([]);
  const [createForm, setCreateForm] = useState({
    linkType: 'homepage',
    prototypeId: '',
    label: '',
    passwordProtect: false,
    password: '',
    customBranding: false,
    brandingConfig: { primaryColor: '#1e293b', headerText: '', footerText: '', hideTaulia: false },
  });
  const [creating, setCreating] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchLinks();
  }, [search, filters]);

  const fetchLinks = async () => {
    try {
      let url = '/api/links';
      const params = [];
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (filters.status === 'active') params.push('active=true');
      if (filters.status === 'revoked') params.push('active=false');
      if (filters.status === 'password') params.push('hasPassword=true');
      if (params.length) url += '?' + params.join('&');
      const data = await apiClient.get(url);
      setLinks(data.links || []);
    } catch (err) {
      setError('Failed to load magic links');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrototypes = async () => {
    try {
      const data = await apiClient.get('/api/prototypes');
      setPrototypes(data.prototypes || []);
    } catch (err) {
      // non-critical
    }
  };

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
    setCreateForm({
      linkType: 'homepage', prototypeId: '', label: '',
      passwordProtect: false, password: '',
      customBranding: false,
      brandingConfig: { primaryColor: '#1e293b', headerText: '', footerText: '', hideTaulia: false },
    });
    setCreateSuccess('');
    fetchPrototypes();
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    if (!createForm.label.trim()) return;
    if (createForm.linkType === 'prototype' && !createForm.prototypeId) return;

    setCreating(true);
    setError('');
    setCreateSuccess('');
    try {
      const body = { label: createForm.label.trim() };
      if (createForm.linkType === 'prototype') {
        body.prototypeId = createForm.prototypeId;
      }
      if (createForm.passwordProtect && createForm.password) {
        body.password = createForm.password;
      }
      if (createForm.customBranding) {
        const bc = createForm.brandingConfig;
        const brandingToSend = {};
        if (bc.primaryColor && bc.primaryColor !== '#1e293b') brandingToSend.primaryColor = bc.primaryColor;
        if (bc.headerText) brandingToSend.headerText = bc.headerText;
        if (bc.footerText) brandingToSend.footerText = bc.footerText;
        if (bc.hideTaulia) brandingToSend.hideTaulia = true;
        if (Object.keys(brandingToSend).length > 0) {
          body.brandingConfig = brandingToSend;
        }
      }
      const data = await apiClient.post('/api/links', body);
      setCreateSuccess(`Magic link created! Token: ${data.link.token.substring(0, 20)}...`);
      setShowCreateForm(false);
      setCreateForm({
        linkType: 'homepage', prototypeId: '', label: '',
        passwordProtect: false, password: '',
        customBranding: false,
        brandingConfig: { primaryColor: '#1e293b', headerText: '', footerText: '', hideTaulia: false },
      });
      fetchLinks();
      setTimeout(() => setCreateSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to create magic link');
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (token) => {
    const url = `${window.location.origin}/viewer/${token}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const revokeLink = async (linkId) => {
    if (!window.confirm('Are you sure you want to revoke this link?')) {
      return;
    }

    try {
      await apiClient.delete(`/api/links/${linkId}`);
      fetchLinks();
    } catch (err) {
      setError('Failed to revoke link');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading magic links...
      </div>
    );
  }

  return (
    <div>
      {error && <div className="error-message">{error}</div>}
      {createSuccess && (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
          {createSuccess}
        </div>
      )}

      {/* Search & Filter Bar */}
      <SearchFilterBar
        searchPlaceholder="Search by label or token..."
        filters={[
          { key: 'status', label: 'Status', options: [
            { value: '', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'revoked', label: 'Revoked' },
            { value: 'password', label: 'Password Protected' },
          ]},
        ]}
        onSearchChange={setSearch}
        onFilterChange={setFilters}
      />

      {/* Create Magic Link Button & Form */}
      <div style={{ marginBottom: '20px' }}>
        {!showCreateForm ? (
          <button className="btn-primary" onClick={handleShowCreateForm}>
            + Create Magic Link
          </button>
        ) : (
          <div className="card" style={{ marginBottom: '16px' }}>
            <div style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' }}>Create New Magic Link</h3>
              <form onSubmit={handleCreateLink}>
                {/* Link Type Toggle */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#475569' }}>Link Type</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
                      border: createForm.linkType === 'homepage' ? '2px solid #0070c0' : '1px solid #d1d5db',
                      borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
                      background: createForm.linkType === 'homepage' ? '#f0f9ff' : 'white',
                      transition: 'all 0.15s',
                    }}>
                      <input type="radio" name="linkType" value="homepage"
                        checked={createForm.linkType === 'homepage'}
                        onChange={() => setCreateForm({ ...createForm, linkType: 'homepage', prototypeId: '' })}
                        style={{ accentColor: '#0070c0' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600' }}>Homepage Link</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Shows all published prototypes</div>
                      </div>
                    </label>
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
                      border: createForm.linkType === 'prototype' ? '2px solid #0070c0' : '1px solid #d1d5db',
                      borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
                      background: createForm.linkType === 'prototype' ? '#f0f9ff' : 'white',
                      transition: 'all 0.15s',
                    }}>
                      <input type="radio" name="linkType" value="prototype"
                        checked={createForm.linkType === 'prototype'}
                        onChange={() => setCreateForm({ ...createForm, linkType: 'prototype' })}
                        style={{ accentColor: '#0070c0' }}
                      />
                      <div>
                        <div style={{ fontWeight: '600' }}>Prototype Link</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>Links to a specific prototype</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Prototype Selector */}
                {createForm.linkType === 'prototype' && (
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#475569' }}>Select Prototype *</label>
                    <select
                      value={createForm.prototypeId}
                      onChange={e => setCreateForm({ ...createForm, prototypeId: e.target.value })}
                      required
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                    >
                      <option value="">-- Select a prototype --</option>
                      {prototypes.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.status}){p.is_top_secret ? ' [TOP SECRET]' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Label */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px', color: '#475569' }}>Label *</label>
                  <input
                    type="text"
                    value={createForm.label}
                    onChange={e => setCreateForm({ ...createForm, label: e.target.value })}
                    placeholder="e.g., Q1 Demo Link, Acme Corp Homepage"
                    required
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Password Protection Toggle */}
                <div style={{ marginBottom: '16px', padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    <input
                      type="checkbox"
                      checked={createForm.passwordProtect}
                      onChange={e => setCreateForm({ ...createForm, passwordProtect: e.target.checked, password: '' })}
                      style={{ accentColor: '#0070c0' }}
                    />
                    Password Protect
                  </label>
                  {createForm.passwordProtect && (
                    <div style={{ marginTop: '10px' }}>
                      <input
                        type="text"
                        value={createForm.password}
                        onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                        placeholder="Enter a password for this link"
                        style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                      />
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Viewers will need to enter this password before accessing the prototype.</div>
                    </div>
                  )}
                </div>

                {/* Custom Branding Toggle */}
                <div style={{ marginBottom: '16px', padding: '14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                    <input
                      type="checkbox"
                      checked={createForm.customBranding}
                      onChange={e => setCreateForm({ ...createForm, customBranding: e.target.checked })}
                      style={{ accentColor: '#0070c0' }}
                    />
                    Customize Branding
                  </label>
                  {createForm.customBranding && (
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#475569', marginBottom: '3px' }}>Header Text</label>
                        <input type="text" value={createForm.brandingConfig.headerText}
                          onChange={e => setCreateForm({ ...createForm, brandingConfig: { ...createForm.brandingConfig, headerText: e.target.value } })}
                          placeholder="Custom header text"
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#475569', marginBottom: '3px' }}>Footer Text</label>
                        <input type="text" value={createForm.brandingConfig.footerText}
                          onChange={e => setCreateForm({ ...createForm, brandingConfig: { ...createForm.brandingConfig, footerText: e.target.value } })}
                          placeholder="Custom footer text"
                          style={{ width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#475569', marginBottom: '3px' }}>Primary Color</label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="color" value={createForm.brandingConfig.primaryColor}
                              onChange={e => setCreateForm({ ...createForm, brandingConfig: { ...createForm.brandingConfig, primaryColor: e.target.value } })}
                              style={{ width: '36px', height: '36px', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', padding: '2px' }} />
                            <input type="text" value={createForm.brandingConfig.primaryColor}
                              onChange={e => setCreateForm({ ...createForm, brandingConfig: { ...createForm.brandingConfig, primaryColor: e.target.value } })}
                              style={{ width: '100px', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace', boxSizing: 'border-box' }} />
                          </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: '#475569', marginTop: '18px' }}>
                          <input type="checkbox" checked={createForm.brandingConfig.hideTaulia}
                            onChange={e => setCreateForm({ ...createForm, brandingConfig: { ...createForm.brandingConfig, hideTaulia: e.target.checked } })}
                            style={{ accentColor: '#0070c0' }} />
                          Hide Taulia branding
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn-primary" disabled={creating}
                    style={{ opacity: creating ? 0.7 : 1 }}>
                    {creating ? 'Creating...' : 'Create Link'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {links.length > 0 ? (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>Prototype</th>
                <th>Label</th>
                <th>Views</th>
                <th>Status</th>
                <th>Created</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {link.isPasswordProtected && <span title="Password protected" style={{ fontSize: '14px' }}>&#128274;</span>}
                      {link.token.substring(0, 16)}...
                    </div>
                  </td>
                  <td>
                    {link.prototypeTitle ? (
                      link.prototypeTitle
                    ) : (
                      <span style={{
                        background: '#f0f9ff', color: '#0070c0', padding: '2px 8px',
                        borderRadius: '4px', fontSize: '12px', fontWeight: '600',
                      }}>
                        Homepage
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: '13px', color: '#475569' }}>{link.label || '\u2014'}</td>
                  <td>{link.viewCount}</td>
                  <td>
                    <span className={`badge ${link.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {link.isActive ? 'Active' : 'Revoked'}
                    </span>
                  </td>
                  <td>{new Date(link.createdAt).toLocaleDateString()}</td>
                  <td style={link.expiresAt && new Date(link.expiresAt) < new Date() ? { color: '#dc2626', fontWeight: '600' } : {}}>
                    {link.expiresAt ? new Date(link.expiresAt).toLocaleDateString() : 'Never'}
                    {link.expiresAt && new Date(link.expiresAt) < new Date() ? ' (Expired)' : ''}
                  </td>
                  <td>
                    <button
                      className="btn-primary btn-small"
                      onClick={() => copyLink(link.token)}
                      style={{ marginRight: '8px' }}
                    >
                      Copy
                    </button>
                    <button
                      className="btn-danger btn-small"
                      onClick={() => revokeLink(link.id)}
                      disabled={!link.isActive}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">{search || Object.values(filters).some(v => v) ? 'No magic links match your search.' : 'No magic links created yet. Click "Create Magic Link" above to get started.'}</div>
        </div>
      )}
    </div>
  );
};

export default MagicLinkManager;
