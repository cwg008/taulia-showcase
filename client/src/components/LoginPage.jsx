import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid email or password');
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

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
          animation: shaking ? 'shake 0.5s ease' : 'none',
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
            Admin Login
          </h1>
          <p style={{ fontSize: 13, color: '#666' }}>
            Prototype Showcase
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#5A6178',
              textTransform: 'uppercase',
              letterSpacing: '0.7px',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="admin@example.com"
            autoFocus
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 14px',
              fontSize: 14,
              fontFamily: 'inherit',
              border: `1.5px solid ${error ? '#D32F2F' : '#DDE1E8'}`,
              borderRadius: 8,
              outline: 'none',
              marginBottom: 16,
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
          />

          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#5A6178',
              textTransform: 'uppercase',
              letterSpacing: '0.7px',
              display: 'block',
              marginBottom: 6,
            }}
          >
            Password
          </label>
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter your password"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 42px 12px 14px',
                fontSize: 14,
                fontFamily: 'inherit',
                border: `1.5px solid ${error ? '#D32F2F' : '#DDE1E8'}`,
                borderRadius: 8,
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9CA3AF',
              }}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                /* Eye-off icon */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                /* Eye icon */
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <p
              style={{
                fontSize: 12,
                color: '#D32F2F',
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'inherit',
              background: loading ? '#999' : '#0066CC',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 8,
              transition: 'background 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p
          style={{
            fontSize: 11,
            color: '#9CA3AF',
            textAlign: 'center',
            marginTop: 20,
          }}
        >
          v1.1.0-debug
        </p>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-10px); }
            40% { transform: translateX(10px); }
            60% { transform: translateX(-6px); }
            80% { transform: translateX(6px); }
          }
        `,
      }} />
    </div>
  );
}
