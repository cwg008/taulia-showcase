import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({ email: '' });
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await apiClient.get('/api/admin/users');
      setUsers(data.users || []);
    } catch (err) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteData.email) {
      setError('Please enter an email address');
      return;
    }

    setInviting(true);
    try {
      await apiClient.post('/api/admin/users/invite', { email: inviteData.email });
      setInviteData({ email: '' });
      setShowInviteForm(false);
      fetchUsers();
    } catch (err) {
      setError('Failed to invite user: ' + err.message);
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading users...
      </div>
    );
  }

  return (
    <div>
      {error && <div className="error-message">{error}</div>}

      <div style={{ marginBottom: '20px' }}>
        <button className="btn-primary" onClick={() => setShowInviteForm(!showInviteForm)}>
          {showInviteForm ? 'Cancel' : '+ Invite User'}
        </button>
      </div>

      {showInviteForm && (
        <div className="card">
          <div className="card-header">Invite New User</div>
          <form onSubmit={handleInvite}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ email: e.target.value })}
                placeholder="user@example.com"
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={inviting}>
              {inviting ? 'Sending Invite...' : 'Send Invite'}
            </button>
          </form>
        </div>
      )}

      {users.length > 0 ? (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.name || 'N/A'}</td>
                  <td>
                    <span className="badge badge-primary">{user.role}</span>
                  </td>
                  <td>
                    <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">No users yet.</div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
