import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const Settings = () => {
  // Slack Integration state
  const [slackWebhook, setSlackWebhook] = useState('');
  const [slackEvents, setSlackEvents] = useState({
    view: false,
    feedback: false,
    access_request: false,
    access_approved: false,
  });
  const [slackLoading, setSlackLoading] = useState(false);
  const [slackMessage, setSlackMessage] = useState({ type: '', text: '' });

  // Default Branding state
  const [brandingData, setBrandingData] = useState({
    headerText: '',
    footerText: '',
    primaryColor: '#0070c0',
    hideTauliaBranding: false,
  });
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [brandingMessage, setBrandingMessage] = useState({ type: '', text: '' });

  // Load Slack settings on mount
  useEffect(() => {
    const loadSlackSettings = async () => {
      try {
        const response = await apiClient.get('/api/admin/settings/slack');
        if (response.data) {
          setSlackWebhook(response.data.webhookUrl || '');
          setSlackEvents(response.data.events || {
            view: false,
            feedback: false,
            access_request: false,
            access_approved: false,
          });
        }
      } catch (error) {
        console.error('Failed to load Slack settings:', error);
      }
    };

    loadSlackSettings();
  }, []);

  // Load Branding settings on mount
  useEffect(() => {
    const loadBrandingSettings = async () => {
      try {
        const response = await apiClient.get('/api/admin/settings/default-branding');
        if (response.data) {
          setBrandingData({
            headerText: response.data.headerText || '',
            footerText: response.data.footerText || '',
            primaryColor: response.data.primaryColor || '#0070c0',
            hideTauliaBranding: response.data.hideTauliaBranding || false,
          });
        }
      } catch (error) {
        console.error('Failed to load branding settings:', error);
      }
    };

    loadBrandingSettings();
  }, []);

  // Slack handlers
  const handleSlackWebhookChange = (e) => {
    setSlackWebhook(e.target.value);
  };

  const handleSlackEventChange = (event) => {
    setSlackEvents({
      ...slackEvents,
      [event]: !slackEvents[event],
    });
  };

  const handleTestConnection = async () => {
    if (!slackWebhook) {
      setSlackMessage({ type: 'error', text: 'Please enter a webhook URL first' });
      return;
    }

    setSlackLoading(true);
    setSlackMessage({ type: '', text: '' });

    try {
      await apiClient.post('/api/admin/settings/slack/test', {
        webhookUrl: slackWebhook,
      });
      setSlackMessage({ type: 'success', text: 'Slack connection successful!' });
    } catch (error) {
      setSlackMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to test Slack connection',
      });
    } finally {
      setSlackLoading(false);
    }
  };

  const handleSaveSlack = async () => {
    setSlackLoading(true);
    setSlackMessage({ type: '', text: '' });

    try {
      await apiClient.post('/api/admin/settings/slack', {
        webhookUrl: slackWebhook,
        events: slackEvents,
      });
      setSlackMessage({ type: 'success', text: 'Slack settings saved successfully!' });
    } catch (error) {
      setSlackMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save Slack settings',
      });
    } finally {
      setSlackLoading(false);
    }
  };

  // Branding handlers
  const handleBrandingChange = (field, value) => {
    setBrandingData({
      ...brandingData,
      [field]: value,
    });
  };

  const handleBrandingCheckboxChange = (field) => {
    setBrandingData({
      ...brandingData,
      [field]: !brandingData[field],
    });
  };

  const handleSaveBranding = async () => {
    setBrandingLoading(true);
    setBrandingMessage({ type: '', text: '' });

    try {
      await apiClient.post('/api/admin/settings/default-branding', brandingData);
      setBrandingMessage({ type: 'success', text: 'Branding settings saved successfully!' });
    } catch (error) {
      setBrandingMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save branding settings',
      });
    } finally {
      setBrandingLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px', color: '#1e293b' }}>Settings</h1>

      {/* Slack Integration Section */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <div className="card-header">
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem' }}>
            Slack Integration
          </h2>
        </div>
        <div className="card-body">
          {/* Slack Message */}
          {slackMessage.text && (
            <div
              style={{
                padding: '12px 16px',
                marginBottom: '20px',
                borderRadius: '4px',
                backgroundColor: slackMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: slackMessage.type === 'success' ? '#166534' : '#991b1b',
                border: `1px solid ${
                  slackMessage.type === 'success' ? '#bbf7d0' : '#fecaca'
                }`,
              }}
            >
              {slackMessage.text}
            </div>
          )}

          {/* Webhook URL Input */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#1e293b',
                fontWeight: '500',
              }}
            >
              Slack Webhook URL
            </label>
            <input
              type="password"
              value={slackWebhook}
              onChange={handleSlackWebhookChange}
              placeholder="https://hooks.slack.com/services/..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Test Connection Button */}
          <div style={{ marginBottom: '20px' }}>
            <button
              className="btn-secondary"
              onClick={handleTestConnection}
              disabled={slackLoading}
              style={{ marginRight: '10px' }}
            >
              {slackLoading ? 'Testing...' : 'Test Connection'}
            </button>
          </div>

          {/* Event Checkboxes */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '12px', color: '#1e293b', fontWeight: '500' }}>
              Send Notifications For:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {['view', 'feedback', 'access_request', 'access_approved'].map((event) => (
                <label
                  key={event}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    color: '#1e293b',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={slackEvents[event] || false}
                    onChange={() => handleSlackEventChange(event)}
                    style={{ marginRight: '8px', cursor: 'pointer' }}
                  />
                  <span>
                    {event === 'view' && 'View Events'}
                    {event === 'feedback' && 'Feedback'}
                    {event === 'access_request' && 'Access Requests'}
                    {event === 'access_approved' && 'Access Approved'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <button
            className="btn-primary"
            onClick={handleSaveSlack}
            disabled={slackLoading}
          >
            {slackLoading ? 'Saving...' : 'Save Slack Settings'}
          </button>
        </div>
      </div>

      {/* Default Branding Section */}
      <div className="card">
        <div className="card-header">
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem' }}>
            Default Branding
          </h2>
        </div>
        <div className="card-body">
          {/* Branding Message */}
          {brandingMessage.text && (
            <div
              style={{
                padding: '12px 16px',
                marginBottom: '20px',
                borderRadius: '4px',
                backgroundColor: brandingMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: brandingMessage.type === 'success' ? '#166534' : '#991b1b',
                border: `1px solid ${
                  brandingMessage.type === 'success' ? '#bbf7d0' : '#fecaca'
                }`,
              }}
            >
              {brandingMessage.text}
            </div>
          )}

          {/* Header Text Input */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#1e293b',
                fontWeight: '500',
              }}
            >
              Header Text
            </label>
            <input
              type="text"
              value={brandingData.headerText}
              onChange={(e) => handleBrandingChange('headerText', e.target.value)}
              placeholder="Enter header text"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Footer Text Input */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#1e293b',
                fontWeight: '500',
              }}
            >
              Footer Text
            </label>
            <input
              type="text"
              value={brandingData.footerText}
              onChange={(e) => handleBrandingChange('footerText', e.target.value)}
              placeholder="Enter footer text"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Primary Color Input with Preview */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: '#1e293b',
                fontWeight: '500',
              }}
            >
              Primary Color
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="text"
                value={brandingData.primaryColor}
                onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                placeholder="#0070c0"
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  backgroundColor: brandingData.primaryColor,
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                }}
              />
            </div>
          </div>

          {/* Hide Taulia Branding Checkbox */}
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                color: '#1e293b',
              }}
            >
              <input
                type="checkbox"
                checked={brandingData.hideTauliaBranding}
                onChange={() => handleBrandingCheckboxChange('hideTauliaBranding')}
                style={{ marginRight: '8px', cursor: 'pointer' }}
              />
              <span>Hide Taulia Branding</span>
            </label>
          </div>

          {/* Save Button */}
          <button
            className="btn-primary"
            onClick={handleSaveBranding}
            disabled={brandingLoading}
          >
            {brandingLoading ? 'Saving...' : 'Save Branding Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
