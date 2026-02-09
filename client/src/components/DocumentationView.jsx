import React from 'react';

const DocumentationView = () => {
  return (
    <div>
      <div className="card">
        <div className="card-header">Taulia Prototype Showcase Documentation</div>
        <div className="card-body">
          <p>
            Welcome to the Taulia Prototype Showcase documentation. This guide covers the features and capabilities
            of the admin portal.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Getting Started</div>
        <div className="card-body">
          <h3 style={{ marginTop: '10px', marginBottom: '10px' }}>Overview</h3>
          <p>
            The Prototype Showcase application allows Taulia administrators to upload HTML prototypes and share them
            with customers via magic links.
          </p>
          <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Key Features</h3>
          <ul style={{ marginLeft: '20px' }}>
            <li>Upload and manage HTML prototypes</li>
            <li>Create magic links for secure sharing</li>
            <li>Track prototype views and engagement</li>
            <li>Manage user invitations and access</li>
            <li>View comprehensive audit logs</li>
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Admin Features</div>
        <div className="card-body">
          <h3 style={{ marginTop: '10px', marginBottom: '10px' }}>Dashboard</h3>
          <p>
            The dashboard provides a quick overview of your prototypes, active links, total views, and active users.
          </p>
          <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Prototype Management</h3>
          <p>
            Upload HTML or ZIP files containing your prototypes. Each prototype can have multiple magic links for sharing
            with different customers.
          </p>
          <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Magic Links</h3>
          <p>
            Generate and manage magic links that allow customers to access prototypes without authentication. Track view
            counts and revoke links as needed.
          </p>
          <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>User Management</h3>
          <p>
            Invite team members to the platform and manage their roles and access levels.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">API Reference</div>
        <div className="card-body">
          <h3 style={{ marginTop: '10px', marginBottom: '10px' }}>Authentication</h3>
          <p>
            <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>
              POST /api/auth/login
            </code>
            - Authenticate with email and password
          </p>
          <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Prototypes</h3>
          <p>
            <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>
              GET /api/prototypes
            </code>
            - List all prototypes
          </p>
          <p>
            <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>
              POST /api/prototypes
            </code>
            - Upload a new prototype
          </p>
          <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Magic Links</h3>
          <p>
            <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>
              GET /api/links
            </code>
            - List all magic links
          </p>
          <p>
            <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>
              DELETE /api/links/:id
            </code>
            - Revoke a magic link
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Version History</div>
        <div className="card-body">
          <h3 style={{ marginTop: '10px', marginBottom: '10px' }}>v1.0.0 (Current)</h3>
          <ul style={{ marginLeft: '20px' }}>
            <li>Initial release</li>
            <li>Basic prototype upload and management</li>
            <li>Magic link generation and sharing</li>
            <li>User management and invitations</li>
            <li>Analytics and audit logging</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DocumentationView;
