import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [prototypes, setPrototypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '', name: '', role: 'viewer', prototypeIds: [] });
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  useEffect(() => { fetchUsers(); fetchPrototypes(); }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiClient.get('/api/admin/users');
      setUsers(data.users || []);
    } catch (err) { setError('Failed to load users'); } finally { setLoading(false); }
  };

  const fetchPrototypes = async () => {
    try { const data = await apiClient.get('/api/prototypes'); setPrototypes(data.prototypes || []); } catch (err) { /* non-critical */ }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteData.email || !inviteData.name) { setError('Please enter email and name'); return; }
    setInviting(true); setError('');
    try {
      const result = await apiClient.post('/api/admin/users/invite', {
        email: inviteData.email, name: inviteData.name, role: inviteData.role,
        prototypeIds: inviteData.role === 'viewer' ? inviteData.prototypeIds : [],
      });
      setInviteResult(result);
      setInviteData({ email: '', name: '', role: 'viewer', prototypeIds: [] });
      fetchUsers();
    } catch (err) { setError('Failed to invite user: ' + err.message); } finally { setInviting(false); }
  };

  const togglePrototype = (protoId) => {
    setInviteData(prev => {
      const ids = prev.prototypeIds.includes(protoId) ? prev.prototypeIds.filter(id => id !== protoId) : [...prev.prototypeIds, protoId];
      return { ...prev, prototypeIds: ids };
    });
  };

  if (loading) return (<div className="loading"><div className="spinner"></div>Loading users...</div>);

  return (
    <div>
      {error && <div className="error-message">{error}</div>}
      <div style={{ marginBottom: '20px' }}>
        <button className="btn-primary" onClick={() => { setShowInviteForm(!showInviteForm); setInviteResult(null); }}>
          {showInviteForm ? 'Cancel' : '+ Invite User'}
        </button>
      </div>

      {inviteResult && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header" style={{ background: '#f0fdf4', color: '#16a34a' }}>Invite Sent Successfully</div>
          <div className="card-body">
            <p><strong>User:</strong> {inviteResult.user?.email} ({inviteResult.user?.role})</p>
            <p><strong>Invite Link:</strong></p>
            <div style={{ background: '#f1f5f9', padding: '10px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all' }}>
              {window.location.origin}/invite/{inviteResult.inviteToken}
            </div>
            <button className="btn-primary btn-small" style={{ marginTop: '10px' }} onClick={() => navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteResult.inviteToken}`)}>Copy Invite Link</button>
          </div>
        </div>
      )}

      {showInviteForm && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-header">Invite New User</div>
          <form onSubmit={handleInvite} style={{ padding: '20px' }}>
            <div className="form-group">
              <label htmlFor="invite-name">Full Name</label>
              <input id="invite-name" type="text" value={inviteData.name} onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })} placeholder="John Doe" required />
            </div>
            <div className="form-group">
              <label htmlFor="invite-email">Email Address</label>
              <input id="invite-email" type="email" value={inviteData.email} onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })} placeholder="user@example.com" required />
            </div>
            <div className="form-group">
              <label htmlFor="invite-role">Role</label>
              <select id="invite-role" value={inviteData.role} onChange={(e) => setInviteData({ ...inviteData, role: e.target.value, prototypeIds: [] })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}>
                <option value="viewer">Viewer (Prospect)</option>
                <option value="admin">Admin</option>
              </select>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {inviteData.role === 'viewer' ? 'Viewers can only see prototypes assigned to them.' : 'Admins have full access to manage prototypes, links, and users.'}
              </p>
            </div>

            {inviteData.role === 'viewer' && prototypes.length > 0 && (
              <div className="form-group">
                <label>Assign Prototypes</label>
                <div style={{ border: '1px solid #d1d5db', borderRadius: '6px', maxHeight: '200px', overflow: 'auto' }}>
                  {prototypes.map(proto => (
                    <label key={proto.id} style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: '10px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                      <input type="checkbox" checked={inviteData.prototypeIds.includes(proto.id)} onChange={() => togglePrototype(proto.id)} />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{proto.title}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{proto.description?.substring(0, 60)}</div>
                      </div>
                      {!!proto.is_top_secret && (<span style={{ marginLeft: 'auto', background: '#dc2626', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}>TOP SECRET</span>)}
                    </label>
                  ))}
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Selected: {inviteData.prototypeIds.length} prototype(s)</p>
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={inviting}>
              {inviting ? 'Sending Invite...' : 'Send Invite'}
            </button>
          </form>
        </div>
      )}

      {users.length > 0 ? (
        <div className="card">
          <table>
            <thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.name || 'N/A'}</td>
                  <td><span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-info'}`}>{user.role}</span></td>
                  <td><span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>{user.isActive ? 'Active' : 'Pending'}</span></td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (<div className="card"><div className="card-body">No users yet.</div></div>)}
    </div>
  );
};

export default UserManager;
