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
            <li>Mark prototypes as top secret with access request workflow</li>
          </ul>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Admin Features</div>
        <div className="card-body">
          <h3 style={{ marginTop: '10px', marginBottom: '10px' }}>Dashboard</h3>
          <p>
            The dashboard provides a quick overview of your prototypes, active links, total views, active users,
            and pending access requests.
          </p>
          <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Prototype Management</h3>
          <p>
            Upload HTML or ZIP files containing your prototypes. Each prototype can have multiple magic links for sharing
            with different customers. Prototypes can be marked as "top secret" to require access approval before viewing.
          </p>
          <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Top Secret Prototypes</h3>
          <p>
            When a prototype is marked as top secret, prospects who access it via a magic link will be shown an access
            request form instead of the prototype itself. They must provide their name, email, company, and reason for
            access. Admins can review these requests from the Access Requests page or directly from the prototype detail page.
          </p>
          <ul style={{ marginLeft: '20px' }}>
            <li><strong>Toggle:</strong> Mark a prototype as top secret during upload or from the detail page</li>
            <li><strong>Access Requests:</strong> Review pending requests with prospect contact info and reason</li>
            <li><strong>Approve/Deny:</strong> Once approved, the magic link becomes accessible to the prospect</li>
            <li><strong>Audit Trail:</strong> All approval and denial decisions are logged in the audit log</li>
          </ul>
          <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Magic Links</h3>
          <p>
            Generate and manage magic links that allow customers to access prototypes without authentication. Track view
            counts and revoke links as needed.
          </p>
          <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Access Requests</h3>
          <p>
            The Access Requests page shows all pending, approved, and denied access requests across all top-secret
            prototypes. Filter by status to focus on requests that need attention.
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
            {' '}- Authenticate with email and password
          </p>
          <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Prototypes</h3>
          <p>
            <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>
              GET /api/prototypes
            </code>
            {' '}- List all prototypes (includes is_top_secret field)
          </p>
          <p>
            <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>
              POST /api/prototypes
            </code>
            {' '}- Upload a new prototype (supports is_top_secret flag)
          </p>
          <p>
            <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>
              PATCH /api/prototypes/:id
            </code>
            {' '}- Update prototype (toggle is_top_secret)
          </p>
          <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Magic Links</h3>
          <p>
            <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>
              GET /api/links
            </code>
            {' '}- List all magic links
          </p>
          <p>
            <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>
              DELETE /api/links/:id
            </code>
            {' '}- Revoke a magic link
          </p>
          <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>Access Requests</h3>
          <p>
            <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>
              POST /api/prospect/:token/request-access
            </code>
            {' '}- Submit access request for top-secret prototype
          </p>
          <p>
            <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>
              GET /api/admin/access-requests
            </code>
            {' '}- List access requests (filter by ?status=pending|approved|denied)
          </p>
          <p>
            <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>
              PATCH /api/admin/access-requests/:id
            </code>
            {' '}- Approve or deny an access request
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Version History</div>
        <div className="card-body">
          <h3 style={{ marginTop: '10px', marginBottom: '10px' }}>v1.2.0 (Current)</h3>
          <ul style={{ marginLeft: '20px' }}>
            <li>Top-secret prototype designation with access request workflow</li>
            <li>Admin access request review (approve/deny) with audit logging</li>
            <li>Prospect-facing access request form for restricted prototypes</li>
            <li>Access Requests admin page with status filtering</li>
            <li>Pending access requests count in dashboard analytics</li>
          </ul>
          <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>v1.1.0</h3>
          <ul style={{ marginLeft: '20px' }}>
            <li>Security hardening (CSP, CORS, rate limiting, non-root Docker, path traversal fixes)</li>
            <li>Audit logging for authentication events</li>
            <li>Version display on login and sidebar</li>
          </ul>
          <h3 style={{ marginTop: '20px', marginBottom: '10px' }}>v1.0.0</h3>
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
