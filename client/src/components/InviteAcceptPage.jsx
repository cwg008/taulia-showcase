import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const InviteAcceptPage = ({ token }) => {
  const [formData, setFormData] = useState({ name: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    const validateInvite = async () => {
      try {
        await apiClient.get(`/api/auth/validate-invite?token=${token}`);
      } catch (err) {
        setError('Invalid or expired invite link');
      } finally {
        setValidating(false);
      }
    };

    validateInvite();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiClient.post('/api/auth/accept-invite', {
        token,
        name: formData.name,
        password: formData.password,
      });
      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to accept invite');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error && error.includes('Invalid')) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--taulia-bg)',
        }}
      >
        <div className="card" style={{ maxWidth: '400px' }}>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--taulia-bg)',
        }}
      >
        <div className="card" style={{ maxWidth: '400px' }}>
          <div className="success-message">Account created successfully! Redirecting...</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, var(--taulia-primary) 0%, var(--taulia-secondary) 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          padding: '40px',
          maxWidth: '400px',
          width: '100%',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '600',
              color: 'var(--taulia-text)',
              marginBottom: '8px',
            }}
          >
            Join Taulia
          </h1>
          <p style={{ color: 'var(--taulia-light-text)', fontSize: '14px' }}>
            Complete your account setup
          </p>
        </div>

        {error && !error.includes('Invalid') && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InviteAcceptPage;
