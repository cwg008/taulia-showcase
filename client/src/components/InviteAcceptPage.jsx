import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export default function InviteAcceptPage({ token, onAccepted }) {
  const [inviteData, setInviteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Track password requirement checklist
  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
  });

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await apiClient.get(`/auth/validate-invite?token=${encodeURIComponent(token)}`);
        if (res.data.valid) {
          setInviteData(res.data);
          setName(res.data.name || '');
        } else {
          setError(res.data.error || 'Invalid invitation');
        }
      } catch (err) {
        setError('Failed to validate invitation');
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const validatePassword = (pw) => {
    const checks = {
      minLength: pw.length >= 12,
      hasUppercase: /[A-Z]/.test(pw),
      hasLowercase: /[a-z]/.test(pw),
      hasNumber: /[0-9]/.test(pw),
    };
    setPasswordChecks(checks);

    if (!checks.minLength) return 'Password must be at least 12 characters';
    if (!checks.hasUppercase) return 'Must contain an uppercase letter';
    if (!checks.hasLowercase) return 'Must contain a lowercase letter';
    if (!checks.hasNumber) return 'Must contain a number';
    return '';
  };

  const handlePasswordChange = (pw) => {
    setPassword(pw);
    validatePassword(pw);
    setPasswordError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const pwError = validatePassword(password);
    if (pwError) {
      setPasswordError(pwError);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      const res = await apiClient.post('/auth/accept-invite', {
        token,
        password,
        name: name.trim() || undefined,
      });

      if (onAccepted) {
        onAccepted(res.data.user);
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to accept invitation');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    fontSize: 14,
    fontFamily: 'inherit',
    border: '1.5px solid #DDE1E8',
    borderRadius: 8,
    outline: 'none',
    marginBottom: 16,
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: '#5A6178',
    textTransform: 'uppercase',
    letterSpacing: '0.7px',
    display: 'block',
    marginBottom: 6,
  };

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          width: '100vw',
          background: 'linear-gradient(135deg, #001B3D 0%, #0066CC 50%, #0066CC 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: '48px 40px',
            width: 400,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#666', fontSize: 14 }}>Validating invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #001B3D 0%, #0066CC 50%, #0066CC 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: '48px 40px',
          width: 440,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Taulia Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              marginBottom: 16,
            }}
          >
            {/* Big T Circle */}
            <div
              style={{
                width: 56,
                height: 56,
                background: '#0066CC',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  color: '#fff',
                  fontSize: 32,
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                T
              </span>
            </div>
            {/* Taulia Text */}
            <span
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: '#001B3D',
                letterSpacing: '-0.5px',
              }}
            >
              aulia
            </span>
          </div>
          <h1
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#001B3D',
              marginBottom: 4,
            }}
          >
            {error ? 'Invitation Error' : 'Accept Invitation'}
          </h1>
          {!error && inviteData && (
            <p style={{ fontSize: 13, color: '#666' }}>
              You have been invited to join asx' '}
              <strong style={{ color: '#0066CC' }}>{inviteData.role}</strong>
            </p>
          )}
        </div>

        {error ? (
          <div
            style={{
              padding: '20px 16px',
              background: 'rgba(211,47,47,0.08)',
              border: '1px solid rgba(211,47,47,0.25)',
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 14, color: '#D32F2F', fontWeight: 500, marginBottom: 8 }}>
              {error}
            </p>
            <p style={{ fontSize: 12, color: '#5A6178' }}>
              Please contact your administrator for a new invitation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={inviteData?.email || ''}
              disabled
              style={{ ...inputStyle, background: '#f5f5f5', color: '#666' }}
            />

            <label style={labelStyle}>Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              style={inputStyle}
            />

            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="Minimum 12 characters"
              style={{
                ...inputStyle,
                borderColor: passwordError ? '#D32F2F' : '#DDE1E8',
              }}
            />

            <label style={labelStyle}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setPasswordError('');
              }}
              placeholder="Re-enter password"
              style={{
                ...inputStyle,
                borderColor: passwordError ? '#D32F2F' : '#DDE1E8',
              }}
            />

            {/* Password Requirements Checklist */}
            <div
              style={{
                fontSize: 11,
                color: '#5A6178',
                marginBottom: 16,
                lineHeight: 1.8,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Password requirements:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 16,
                    height: 16,
                    borderRadius: 3,
                    background: passwordChecks.minLength ? '#0066CC' : '#DDE1E8',
                    color: '#fff',
                    fontSize: 10,
                  }}
                >
                  {passwordChecks.minLength ? '✓' : ''}
                </span>
                <span style={{ color: passwordChecks.minLength ? '#001B3D' : '#9CA3AF' }}>
                  At least 12 characters
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 16,
                    height: 16,
                    borderRadius: 3,
                    background: passwordChecks.hasUppercase ? '#0066CC' : '#DDE1E8',
                    color: '#fff',
                    fontSize: 10,
                  }}
                >
                  {passwordChecks.hasUppercase ? '✓' : ''}
                </span>
                <span style={{ color: passwordChecks.hasUppercase ? '#001B3D' : '#9CA3AF' }}>
                  One uppercase letter
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 16,
                    height: 16,
                    borderRadius: 3,
                    background: passwordChecks.hasLowercase ? '#0066CC' : '#DDE1E8',
                    color: '#fff',
                    fontSize: 10,
                  }}
                >
                  {passwordChecks.hasLowercase ? '✓' : ''}
                </span>
                <span style={{ color: passwordChecks.hasLowercase ? '#001B3D' : '#9CA3AF' }}>
                  One lowercase letter
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 16,
                    height: 16,
                    borderRadius: 3,
                    background: passwordChecks.hasNumber ? '#0066CC' : '#DDE1E8',
                    color: '#fff',
                    fontSize: 10,
                  }}
                >
                  {passwordChecks.hasNumber ? '✓' : ''}
                </span>
                <span style={{ color: passwordChecks.hasNumber ? '#001B3D' : '#9CA3AF' }}>
                  One number
                </span>
              </div>
            </div>

            ;passwordError && (
              <p
                style={{
                  fontSize: 12,
                  color: '#D32F2F',
                  marginBottom: 16,
                  fontWeight: 500,
                }}
              >
                {passwordError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'inherit',
                background: submitting ? '#999' : '#0066CC',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {submitting ? 'Setting up account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
