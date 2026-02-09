import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

export default function PublicViewer({ token }) {
  const [state, setState] = useState({
    loading: true,
    error: null,
    prototypeTitle: '',
    serveUrl: '',
  });

  useEffect(() => {
    validateAndFetchToken();
  }, [token]);

  const validateAndFetchToken = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await apiClient.get(`/viewer/${token}`);

      setState({
        loading: false,
        error: null,
        prototypeTitle: response.prototype.title || 'Prototype',
        serveUrl: `/viewer/${token}/serve/`,
      });
    } catch (error) {
      let errorMessage = 'Prototype unavailable';

      if (error.response?.status === 404) {
        errorMessage = 'Link not found';
      } else if (error.response?.data?.error) {
        const err = error.response.data.error.toLowerCase();
        if (err.includes('expired')) {
          errorMessage = 'Link expired';
        } else if (err.includes('revoked')) {
          errorMessage = 'Link revoked';
        }
      }

      setState({
        loading: false,
        error: errorMessage,
        prototypeTitle: '',
        serveUrl: '',
      });
    }
  };

  const errorPage = (
    <div className="viewer-error">
      <div className="error-content">
        <svg className="logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="16" fill="#0066CC" />
          <text
            x="16"
            y="22"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontSize="18"
            fontWeight="bold"
            fill="white"
          >
            T
          </text>
        </svg>
        <h1>Taulia Prototype Showcase</h1>
        <div className="error-message">
          <h2>{state.error}</h2>
          <p>
            {state.error === 'Link not found' && "The link you're looking for doesn't exist."}
            {state.error === 'Link expired' && 'This link has expired. Please request a new one.'}
            {state.error === 'Link revoked' && 'This link has been revoked. Please request a new one.'}
            {state.error === 'Prototype unavailable' && 'The prototype is currently unavailable. Please try again later.'}
          </p>
        </div>
      </div>
    </div>
  (