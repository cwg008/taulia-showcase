import React, { useState } from 'react';
import apiClient from '../api/client.js';

const ProspectPortal = ({ token }) => {
  const [feedback, setFeedback] = useState('');
  const [category, setCategory] = useState('general');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await apiClient.post(`/api/prospect/${token}/feedback`, {
        feedback,
        category,
      });
      setSubmitted(true);
      setTimeout(() => {
        setFeedback('');
        setCategory('general');
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      setError('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--taulia-bg)',
        padding: '40px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          padding: '40px',
          maxWidth: '500px',
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
            Share Your Feedback
          </h1>
          <p style={{ color: 'var(--taulia-light-text)', fontSize: '14px' }}>
            Help us improve the prototype
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {submitted && <div className="success-message">Thank you for your feedback!</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="category">Feedback Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="general">General</option>
              <option value="ui">UI/Design</option>
              <option value="feature">Feature Request</option>
              <option value="bug">Bug Report</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="feedback">Your Feedback</label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what you think..."
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%' }}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProspectPortal;
