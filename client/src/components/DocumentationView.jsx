import React, { useState } from 'react';

const CURRENT_VERSION = '1.1.0';
const BUILD_DATE = '2026-02-09';

const VERSION_HISTORY = [
  {
    version: '1.1.0',
    date: '2026-02-09',
    label: 'Prospect Portal & Feedback',
    changes: [
      { type: 'feature', text: 'Prospect portal with dedicated gallery view for shared prototypes' },
      { type: 'feature', text: 'Feedback system with star ratings, categories, and comments' },
      { type: 'feature', text: 'Role-based routing â€” prospects see portal, admins see dashboard' },
      { type: 'improvement', text: 'Magic links now display share URLs with copy-to-clipboard' },
      { type: 'fix', text: 'Fixed prototype file_path references and status validation' },
      { type: 'fix', text: 'Fixed creator name and date display across prototype views' },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-02-09',
    label: 'Initial Release',
    changes: [
      { type: 'feature', text: 'Admin dashboard with prototype stats and activity overview' },
      { type: 'feature', text: 'Prototype upload system with HTML and ZIP support' },
      { type: 'feature', text: 'Magic link generation for secure, no-login prototype sharing' },
      { type: 'feature', text: 'Prototype preview with sandboxed iframe rendering' },
      { type: 'feature', text: 'User management with invite flow' },
      { type: 'feature', text: 'Comprehensive audit logging' },
      { type: 'security', text: 'JWT authentication with httpOnly cookies' },
      { type: 'security', text: 'Role-based access control (admin / prospect)' },
    ],
  },
];

const badgeColors = {
  feature: { bg: 'rgba(0,102,204,0.1)', text: '#0066CC' },
  improvement: { bg: 'rgba(46,125,50,0.1)', text: '#2E7D32' },
  fix: { bg: 'rgba(237,137,54,0.1)', text: '#C05621' },
  security: { bg: 'rgba(107,70,193,0.1)', text: '#6B46C1' },
};

function DocSection({ title, tag, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen || false);
  const tagColors = {
    dev: { bg: '#E3F2FD', text: '#1565C0' },
    product: { bg: '#F3E5F5', text: '#7B1FA2' },
    both: { bg: '#E8F5E9', text: '#2E7D32' },
  };
  const tc = tagColors[tag] || tagColors.both;

  return (
    <div style={{
      border: '1px solid #E2E8F0',
      borderRadius: '10px',
      marginBottom: '12px',
      overflow: 'hidden',
      background: '#fff',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '16px 20px',
          border: 'none',
          background: open ? '#F8FAFC' : '#fff',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '15px',
          fontWeight: 600,
          color: '#1A2B4A',
          textAlign: 'left',
          transition: 'background 0.15s',
        }}
      >
        <span style={{
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
          fontSize: '12px',
          color: '#7B8A9E',
        }}>â–¶</span>
        <span style={{ flex: 1 }}>{title}</span>
        {tag && (
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '4px',
            background: tc.bg,
            color: tc.text,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>{tag}</span>
        )}
      </button>
      {open && (
        <div style={{
          padding: '0 20px 20px',
          fontSize: '14px',
          lineHeight: '1.7',
          color: '#374151',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

export default function DocumentationView() {
  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '0 20px 40px',
    }}>
      {/* Version Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0A2540 0%, #0066CC 100%)',
        borderRadius: '14px',
        padding: '32px',
        marginBottom: '28px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px', opacity: 0.7, marginBottom: '6px' }}>
            Taulia Prototype Showcase
          </div>
          <div style={{ fontSize: '36px', fontWeight: 800, marginBottom: '4px', letterSpacing: '-0.5px' }}>
            v{CURRENT_VERSION}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>
            Built {BUILD_DATE} &nbsp;Â·&nbsp; Node.js + React + SQLite
          </div>
        </div>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: '-30px', right: '-30px', width: '140px', height: '140px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20px', right: '60px', width: '80px', height: '80px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.04)',
        }} />
      </div>

      {/* Version History */}
      <DocSection title="Version History & Changelog" tag="both" defaultOpen={true}>
        {VERSION_HISTORY.map((release) => (
          <div key={release.version} style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #F0F3F7',
            }}>
              <span style={{
                fontWeight: 700, fontSize: '16px', color: '#0066CC',
              }}>v{release.version}</span>
              <span style={{ fontSize: '13px', color: '#7B8A9E' }}>{release.date}</span>
              <span style={{
                fontSize: '12px', fontWeight: 600, color: '#1A2B4A',
                background: '#F0F3F7', padding: '2px 8px', borderRadius: '4px',
              }}>{release.label}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {release.changes.map((c, i) => {
                const bc = badgeColors[c.type] || badgeColors.feature;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                      background: bc.bg, color: bc.text, textTransform: 'uppercase',
                      whiteSpace: 'nowrap', marginTop: '2px', minWidth: '80px', textAlign: 'center',
                    }}>{c.type}</span>
                    <span style={{ fontSize: '13px', color: '#374151' }}>{c.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </DocSection>

      {/* Product Overview */}
      <DocSection title="Product Overview" tag="product" defaultOpen={false}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: '#1A2B4A' }}>Purpose</h3>
        <p style={{ marginBottom: '16px' }}>
          The Taulia Prototype Showcase enables the Taulia product team to upload static HTML prototypes
          of upcoming features, share them securely with customers and prospects via magic links (no login
          required for viewers), and collect structured feedback â€” all through a clean, branded portal.
        </p>

        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: '#1A2B4A' }}>Key Capabilities</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#7B8A9E', fontWeight: 600 }}>Capability</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#7B8A9E', fontWeight: 600 }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Prototype Upload', 'Upload HTML files or ZIP archives; auto-extraction and file serving'],
              ['Magic Links', 'Generate unique share URLs with optional expiration and revocation'],
              ['Prospect Portal', 'Dedicated gallery view for prospects showing only prototypes shared with them'],
              ['Feedback System', 'Star ratings, category tagging, and free-text comments on each prototype'],
              ['Iframe Preview', 'Sandboxed prototype rendering within the admin and prospect interfaces'],
              ['Audit Logging', 'Full audit trail of all admin and viewer actions'],
              ['User Management', 'Invite-based admin onboarding, prospect account management'],
              ['Analytics', 'View counts, daily trends, and top-viewed prototype tracking'],
            ].map(([cap, desc], i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F0F3F7' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1A2B4A' }}>{cap}</td>
                <td style={{ padding: '8px 12px' }}>{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: '#1A2B4A' }}>User Roles</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#7B8A9E', fontWeight: 600 }}>Role</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#7B8A9E', fontWeight: 600 }}>Access</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #F0F3F7' }}>
              <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1A2B4A' }}>Admin</td>
              <td style={{ padding: '8px 12px' }}>Full access â€” upload prototypes, manage links, view analytics, manage users, view audit logs</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #F0F3F7' }}>
              <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1A2B4A' }}>Prospect</td>
              <td style={{ padding: '8px 12px' }}>View prototypes shared via magic links, submit feedback per prototype</td>
            </tr>
          </tbody>
        </table>
      </DocSection>

      {/* Architecture & Tech Stack */}
      <DocSection title="Architecture & Tech Stack" tag="dev" defaultOpen={false}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: '#1A2B4A' }}>Stack Overview</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#7B8A9E', fontWeight: 600 }}>Layer</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#7B8A9E', fontWeight: 600 }}>Technology</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: '#7B8A9E', fontWeight: 600 }}>Purpose</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Frontend', 'React 18 + Vite 6', 'Single-page application with HMR dev server'],
              ['Backend', 'Node.js 22 + Express 4.18', 'REST API, static file serving, auth'],
              ['Database', 'SQLite (dev) / PostgreSQL (prod)', 'Data persistence via Knex.js query builder'],
              ['Auth', 'JWT + bcryptjs', 'httpOnly cookie tokens, password hashing'],
              ['Upload', 'Multer + Unzipper', 'Multipart file handling, ZIP extraction'],
              ['Validation', 'express-validator', 'Request body and param validation'],
              ['Deployment', 'Docker + Railway', 'Multi-stage build, managed hosting'],
            ].map(([layer, tech, purpose], i) => (
              <tr key={i} style={{ borderBottom: '1px solid #F0F3F7' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1A2B4A' }}>{layer}</td>
                <td style={{ padding: '8px 12px' }}><code style={{ background: '#F0F3F7', padding: '1px 6px', borderRadius: '3px', fontSize: '12px' }}>{tech}</code></td>
                <td style={{ padding: '8px 12px' }}>{purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: '#1A2B4A' }}>Architecture Diagram</h3>
        <svg viewBox="0 0 700 320" style={{ width: '100%', maxWidth: '700px', marginBottom: '16px' }}>
          {/* Client Layer */}
          <rect x="10" y="10" width="680" height="70" rx="8" fill="#E3F2FD" stroke="#1565C0" strokeWidth="1.5"/>
          <text x="350" y="35" textAnchor="middle" fill="#1565C0" fontWeight="700" fontSize="14">Client (React SPA)</text>
          <text x="120" y="58" textAnchor="middle" fill="#374151" fontSize="11">AuthContext</text>
          <text x="260" y="58" textAnchor="middle" fill="#374151" fontSize="11">Admin Views</text>
          <text x="400" y="58" textAnchor="middle" fill="#374151" fontSize="11">Prospect Portal</text>
          <text x="560" y="58" textAnchor="middle" fill="#374151" fontSize="11">Public Viewer</text>

          {/* Arrow */}
          <line x1="350" y1="80" x2="350" y2="110" stroke="#7B8A9E" strokeWidth="1.5" markerEnd="url(#arrow)"/>
          <text x="380" y="100" fill="#7B8A9E" fontSize="10">REST API</text>

          {/* Server Layer */}
          <rect x="10" y="110" width="680" height="90" rx="8" fill="#FFF3E0" stroke="#E65100" strokeWidth="1.5"/>
          <text x="350" y="135" textAnchor="middle" fill="#E65100" fontWeight="700" fontSize="14">Server (Express)</text>
          <text x="100" y="162" textAnchor="middle" fill="#374151" fontSize="11">Auth Routes</text>
          <text x="240" y="162" textAnchor="middle" fill="#374151" fontSize="11">Prototypes API</text>
          <text x="390" y="162" textAnchor="middle" fill="#374151" fontSize="11">Magic Links API</text>
          <text x="550" y="162" textAnchor="middle" fill="#374151" fontSize="11">Viewer Routes</text>
          <text x="180" y="185" textAnchor="middle" fill="#374151" fontSize="11">Audit Middleware</text>
          <text x="400" y="185" textAnchor="middle" fill="#374151" fontSize="11">Upload Service</text>
          <text x="580" y="185" textAnchor="middle" fill="#374151" fontSize="11">Feedback API</text>

          {/* Arrow */}
          <line x1="250" y1="200" x2="250" y2="230" stroke="#7B8A9E" strokeWidth="1.5" markerEnd="url(#arrow)"/>
          <line x1="500" y1="200" x2="500" y2="230" stroke="#7B8A9E" strokeWidth="1.5" markerEnd="url(#arrow)"/>
          <text x="250" y="222" fill="#7B8A9E" fontSize="10">Knex.js</text>
          <text x="520" y="222" fill="#7B8A9E" fontSize="10">File I/O</text>

          {/* Data Layer */}
          <rect x="10" y="230" width="340" height="70" rx="8" fill="#E8F5E9" stroke="#2E7D32" strokeWidth="1.5"/>
          <text x="180" y="258" textAnchor="middle" fill="#2E7D32" fontWeight="700" fontSize="14">Database</text>
          <text x="180" y="280" textAnchor="middle" fill="#374151" fontSize="11">users Â· prototypes Â· magic_links Â· link_views Â· feedback Â· audit_logs</text>

          <rect x="370" y="230" width="320" height="70" rx="8" fill="#F3E5F5" stroke="#7B1FA2" strokeWidth="1.5"/>
          <text x="530" y="258" textAnchor="middle" fill="#7B1FA2" fontWeight="700" fontSize="14">File Storage</text>
          <text x="530" y="280" textAnchor="middle" fill="#374151" fontSize="11">server/uploads/prototypes/{'{id}'}/index.html</text>

          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="#7B8A9E"/>
            </marker>
          </defs>
        </svg>

        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: '#1A2B4A' }}>API Endpoints</h3>
        <pre style={{
          background: '#0A2540', color: '#A5D6FF', padding: '16px', borderRadius: '8px',
          fontSize: '12px', lineHeight: '1.8', overflow: 'auto',
        }}>{`Auth
  POST  /api/auth/login          â€” Authenticate user
  POST  /api/auth/logout         â€” Clear session
  GET   /api/auth/me             â€” Current user info

Prototypes (admin)
  GET   /api/prototypes          â€” List all (filterable)
  POST  /api/prototypes          â€” Upload new (multipart)
  GET   /api/prototypes/:id      â€” Detail + magic links
  PATCH /api/prototypes/:id      â€” Update metadata
  DELETE/api/prototypes/:id      â€” Delete + cleanup

Magic Links (admin)
  GET   /api/links               â€” List all links
  POST  /api/links               â€” Create link
  PATCH /api/links/:id           â€” Revoke / update
  DELETE/api/links/:id           â€” Delete link

Viewer (public â€” magic link token)
  GET   /api/viewer/:token       â€” Validate + metadata
  GET   /api/viewer/:token/serve â€” Serve prototype files

Prospect
  GET   /api/prospect/prototypes â€” Gallery of shared prototypes
  GET   /api/prospect/prototypes/:id â€” Prototype detail + serve URL
  POST  /api/prospect/prototypes/:id/feedback â€” Submit feedback
  GET   /api/prospect/prototypes/:id/feedback â€” List feedback

Admin
  GET   /api/admin/users         â€” List users
  POST  /api/admin/users/invite  â€” Invite admin
  PATCH /api/admin/users/:id     â€” Update user
  DELETE/api/admin/users/:id      â€” Deactivate
  GET   /api/admin/audit-logs    â€” Paginated logs
  GET   /api/admin/analytics     â€” Dashboard stats`}</pre>
      </DocSection>

      {/* Security */}
      <DocSection title="Security Architecture" tag="dev" defaultOpen={false}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: '#1A2B4A' }}>Authentication & Authorization</h3>
        <p style={{ marginBottom: '16px' }}>
          Authentication uses JSON Web Tokens stored in httpOnly cookies (name: <code style={{ background: '#F0F3F7', padding: '1px 6px', borderRadius: '3px', fontSize: '12px' }}>taulia_token</code>).
          Passwords are hashed with bcryptjs (12 salt rounds). Role-based middleware gates admin vs. prospect routes.
        </p>

        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: '#1A2B4A' }}>Security Layers</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '16px' }}>
          <tbody>
            {[
              ['Helmet.js', 'HTTP security headers (CSP, HSTS, X-Frame-Options)'],
              ['CORS', 'Origin whitelist for API access'],
              ['Rate Limiting', 'Express rate limiter on auth and API routes'],
              ['Input Validation', 'express-validator on all route parameters and body fields'],
              ['Cookie Security', 'httpOnly, secure, sameSite=strict in production'],
              ['File Validation', 'MIME type whitelist (HTML, ZIP), 50MB size limit'],
              ['Audit Trail', 'Every authen¥…Ñ•É•ÅÕ•ÍÐ±½•Ý¥Ñ ÕÍ•È°…Ñ¥½¸°ÍÑ…ÑÕÌ°%@t°(€€€€€€€€€€€t¹µ…À ¡m±…å•È°‘•Ít°¤¤€ôø€ (€€€€€€€€€€€€€€ñÑÈ­•äõí¥ôÍÑå±”õíì‰½É‘•É	½ÑÑ½´è€œÅÁàÍ½±¥€ÁÍÜœõôø(€€€€€€€€€€€€€€€€ñÑÍÑå±”õíìÁ…‘‘¥¹œè€œáÁà€ÄÉÁàœ°™½¹Ñ]•¥¡Ðè€ØÀÀ°½±½Èè€œŒÅÉÑœ°Ý¡¥Ñ•MÁ…”è€¹½ÝÉ…Àœõôùí±…å•Éôð½Ñø(€€€€€€€€€€€€€€€€ñÑÍÑå±”õíìÁ…‘‘¥¹œè€œáÁà€ÄÉÁàœõôùí‘•Íôð½Ñø(€€€€€€€€€€€€€€ð½ÑÈø(€€€€€€€€€€€€¤¥ô(€€€€€€€€€€ð½Ñ‰½‘äø(€€€€€€€€ð½Ñ…‰±”ø((€€€€€€€€ñ ÌÍÑå±”õíì™½¹ÑM¥é”è€œÄÕÁàœ°™½¹Ñ]•¥¡Ðè€ÜÀÀ°µ…É¥¹	½ÑÑ½´è€œáÁàœ°½±½Èè€œŒÅÉÑœõôù5…¥Œ1¥¹¬M•ÕÉ¥Ñäð½ Ìø(€€€€€€€€ñÀø(€€€€€€€€€5…¥Œ±¥¹¬Ñ½­•¹Ì…É”€ØÐµ¡…É…Ñ•È¡•àÍÑÉ¥¹Ì•¹•É…Ñ•Ý¥Ñ €ñ½‘”ÍÑå±”õíì‰…­É½Õ¹è€œÁÍÜœ°Á…‘‘¥¹œè€œÅÁà€ÙÁàœ°‰½É‘•ÉI…‘¥ÕÌè€œÍÁàœ°™½¹ÑM¥é”è€œÄÉÁàœõôùÉåÁÑ¼¹É…¹‘½µ	åÑ•Ì ÌÈ¤ð½½‘”ø¸(€€€€€€€€€1¥¹­ÌÍÕÁÁ½ÉÐ½ÁÑ¥½¹…°•áÁ¥É…Ñ¥½¸‘…Ñ•Ì…¹…¸‰”É•Ù½­•¥¹ÍÑ…¹Ñ±ä‰ä…‘µ¥¹Ì¸… Ù¥•Ü¥ÌÉ•½É‘•(€€€€€€€€€Ý¥Ñ %@…‘‘É•ÍÌ…¹ÕÍ•È…•¹Ð™½È…¹…±åÑ¥Ì…¹…‰ÕÍ”‘•Ñ•Ñ¥½¸¸(€€€€€€€€ð½Àø(€€€€€€ð½½M•Ñ¥½¸ø((€€€€€ì¼¨…Ñ„5½‘•°€¨½ô(€€€€€€ñ½M•Ñ¥½¸Ñ¥Ñ±”ô‰…Ñ„5½‘•°ˆÑ…œô‰‘•Øˆ‘•™…Õ±Ñ=Á•¸õí™…±Í•ôø(€€€€€€€€ñ ÌÍÑå±”õíì™½¹ÑM¥é”è€œÄÕÁàœ°™½¹Ñ]•¥¡Ðè€ÜÀÀ°µ…É¥¹	½ÑÑ½´è€œÄÉÁàœ°½±½Èè€œŒÅÉÑœõôù¹Ñ¥ÑäI•±…Ñ¥½¹Í¡¥Àð½ Ìø(€€€€€€€€ñÍÙœÙ¥•Ý	½àôˆÀ€À€ÜÀÀ€ÈØÀˆÍÑå±”õíìÝ¥‘Ñ è€œÄÀÀ”œ°µ…á]¥‘Ñ è€œÜÀÁÁàœ°µ…É¥¹	½ÑÑ½´è€œÄÙÁàœõôø(€€€€€€€€€ì¼¨UÍ•ÉÌ€¨½ô(€€€€€€€€€€ñÉ•ÐàôˆÄÀˆäôˆÄÀˆÝ¥‘Ñ ôˆÄÔÀˆ¡•¥¡ÐôˆàÀˆÉàôˆØˆ™¥±°ôˆÍÉˆÍÑÉ½­”ôˆŒÄÔØÕÀˆÍÑÉ½­•]¥‘Ñ ôˆÄ¸Ôˆ¼ø(€€€€€€€€€€ñÑ•áÐàôˆàÔˆäôˆÌÈˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÄÔØÕÀˆ™½¹Ñ]•¥¡ÐôˆÜÀÀˆ™½¹ÑM¥é”ôˆÄÌˆùÕÍ•ÉÌð½Ñ•áÐø(€€€€€€€€€€ñÑ•áÐàôˆàÔˆäôˆÔÀˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÌÜÐÄÔÄˆ™½¹ÑM¥é”ôˆÄÀˆù¥°•µ…¥°°¹…µ”ð½Ñ•áÐø(€€€€€€€€€€ñÑ•áÐàôˆàÔˆäôˆØÔˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÌÜÐÄÔÄˆ™½¹ÑM¥é”ôˆÄÀˆùÉ½±”°Á…ÍÍÝ½É‘}¡…Í ð½Ñ•áÐø(€€€€€€€€€€ñÑ•áÐàôˆàÔˆäôˆàÀˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÌÜÐÄÔÄˆ™½¹ÑM¥é”ôˆÄÀˆù¥Í}…Ñ¥Ù”°É•…Ñ•‘}…Ðð½Ñ•áÐø((€€€€€€€€€ì¼¨AÉ½Ñ½ÑåÁ•Ì€¨½ô(€€€€€€€€€€ñÉ•ÐàôˆÈÜÀˆäôˆÄÀˆÝ¥‘Ñ ôˆÄØÀˆ¡•¥¡ÐôˆäÔˆÉàôˆØˆ™¥±°ôˆÍÀˆÍÑÉ½­”ôˆØÔÄÀÀˆÍÑÉ½­•]¥‘Ñ ôˆÄ¸Ôˆ¼ø(€€€€€€€€€€ñÑ•áÐàôˆÌÔÀˆäôˆÌÈˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆØÔÄÀÀˆ™½¹Ñ]•¥¡ÐôˆÜÀÀˆ™½¹ÑM¥é”ôˆÄÌˆùÁÉ½Ñ½ÑåÁ•Ìð½Ñ•áÐø(€€€€€€€€€€ñÑ•áÐàôˆÌÔÀˆäôˆÔÀˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÌÜÐÄÔÄˆ™½¹ÑM¥é”ôˆÄÀˆù¥°Ñ¥Ñ±”°‘•ÍÉ¥ÁÑ¥½¸ð½Ñ•áÐø(€€€€€€€€€€ñÑ•áÐàôˆÌÔÀˆäôˆØÔˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÌÜÐÄÔÄˆ™½¹ÑM¥é”ôˆÄÀˆùÍ±Õœ°ÍÑ…ÑÕÌ°ÑåÁ”ð½Ñ•áÐø(€€€€€€€€€€ñÑ•áÐàôˆÌÔÀˆäôˆàÀˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÌÜÐÄÔÄˆ™½¹ÑM¥é”ôˆÄÀˆù™¥±•}Á…Ñ °Ù•ÉÍ¥½¸ð½Ñ•áÐø(€€€€€€€€€€ñÑ•áÐàôˆÌÔÀˆäôˆäÔˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÌÜÐÄÔÄˆ™½¹ÑM¥é”ôˆÄÀˆùÉ•…Ñ•‘}‰äƒŠHÕÍ•ÉÌ¹¥ð½Ñ•áÐø((€€€€€€€€€ì¼¨5…¥Œ1¥¹­Ì€¨½ô(€€€€€€€€€€ñÉ•ÐàôˆÔÌÀˆäôˆÄÀˆÝ¥‘Ñ ôˆÄØÀˆ¡•¥¡ÐôˆäÔˆÉàôˆØˆ™¥±°ôˆÍÕÔˆÍÑÉ½­”ôˆŒÝÅÈˆÍÑÉ½­•]¥‘Ñ ôˆÄ¸Ôˆ¼ø(€€€€€€€€€€ñÑ•áÐàôˆØÄÀˆäôˆÌÈˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÝÅÈˆ™½¹Ñ]•¥¡ÐôˆÜÀÀˆ™½¹ÑM¥é”ôˆÄÌˆùµ…¥}±¥¹­Ìð½Ñ•áÐø(€€€€€€€€€€ñÑ•áÐàôˆØÄÀˆäôˆÔÀˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÌÜÐÄÔÄˆ™½¹ÑM¥é”ôˆÄÀˆù¥°Ñ½­•¸°±…‰•°ð½Ñ•áÐø(€€€€€€€€€€ñÑ•áÐàôˆØÄÀˆäôˆØÔˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÌÜÐÄÔÄˆ™½¹ÑM¥é”ôˆÄÀˆùÁÉ½Ñ½ÑåÁ•}¥ƒŠHÁÉ½Ñ½ÑåÁ•Ì¹¥ð½Ñ•áÐø(€€€€€€€€€€ñÑ•áÐàôˆØÄÀˆäôˆàÀˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÌÜÐÄÔÄˆ™½¹ÑM¥é”ôˆÄÀˆù•áÁ¥É•Í}…Ð°¥Í}É•Ù½­•ð½Ñ•áÐø(€€€€€€€€€€ñÑ•áÐàôˆØÄÀˆäôˆäÔˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÌÜÐÄÔÄˆ™½¹ÑM¥é”ôˆÄÀˆùÙ¥•Ý}½Õ¹Ð°É•¥Á¥•¹Ñ}•µ…¥°ð½Ñ•áÐø((€€€€€€€€€ì¼¨1¥¹¬Y¥•ÝÌ€¨½ô(€€€€€€€€€€ñÉ•ÐàôˆÔÌÀˆäôˆÄÐÀˆÝ¥‘Ñ ôˆÄØÀˆ¡•¥¡ÐôˆÜÀˆÉàôˆØˆ™¥±°ôˆáÕäˆÍÑÉ½­”ôˆŒÉÝÌÈˆÍÑÉ½­•]¥‘Ñ ôˆÄ¸Ôˆ¼ø(€€€€€€€€€€ñÑ•áÐàôˆØÄÀˆäôˆÄØÈˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÉÝÌÈˆ™½¹Ñ]•¥¡ÐôˆÜÀÀˆ™½¹ÑM¥é”ôˆÄÌˆù±¥¹­}Ù¥•ÝÌð½Ñ•áÐø(€€€€€€€€€€ñÑ•áÐàôˆØÄÀˆäôˆÄàÀˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÌÜÐÄÔÄˆ™½¹ÑM¥é”ôˆÄÀˆùµ…¥}±¥¹­}¥°ÁÉ½Ñ½ÑåÁ•}¥ð½Ñ•áÐø(€€€€€€€€€€ñÑ•áÐàôˆØÄÀˆäôˆÄäÔˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÌÜÐÄÔÄˆ™½¹ÑM¥é”ôˆÄÀˆù¥Á}…‘‘É•ÍÌ°ÕÍ•É}…•¹Ðð½Ñ•áÐø((€€€€€€€€€ì¼¨••‘‰…¬€¨½ô(€€€€€€€€€€ñÉ•ÐàôˆÈÜÀˆäôˆÄÔÔˆÝ¥‘Ñ ôˆÄØÀˆ¡•¥¡ÐôˆàÔˆÉàôˆØˆ™¥±°ôˆÑˆÍÑÉ½­”ôˆØÈàÈàˆÍÑÉ½­•]¥‘Ñ ôˆÄ¸Ôˆ¼ø(€€€€€€€€€€ñÑ•áÐàôˆÌÔÀˆäôˆÄÜÜˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆØÈàÈàˆ™½¹Ñ]•¥¡ÐôˆÜÀÀˆ™½¹ÑM¥é”ôˆÄÌˆù™••‘‰…¬ð½Ñ•áÐø(€€€€€€€€€€ñÑ•áÐàôˆÌÔÀˆäôˆÄäÔˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÌÜÐÄÔÄˆ™½¹ÑM¥é”ôˆÄÀˆùÁÉ½Ñ½ÑåÁ•}¥ƒŠHÁÉ½Ñ½ÑåÁ•Ì¹¥ð½Ñ•áÐø(€€€€€€€€€€ñÑ•áÐàôˆÌÔÀˆäôˆÈÄÀˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÌÜÐÄÔÄˆ™½¹ÑM¥é”ôˆÄÀˆùÕÍ•É}¥°É…Ñ¥¹œ°…Ñ•½Éäð½Ñ•áÐø(€€€€€€€€€€ñÑ•áÐàôˆÌÔÀˆäôˆÈÈÔˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÌÜÐÄÔÄˆ™½¹ÑM¥é”ôˆÄÀˆù½µµ•¹Ð°É•…Ñ•‘}…Ðð½Ñ•áÐø((€€€€€€€€€ì¼¨Õ‘¥Ð1½Ì€¨½ô(€€€€€€€€€€ñÉ•ÐàôˆÄÀˆäôˆÄÐÀˆÝ¥‘Ñ ôˆÄÔÀˆ¡•¥¡ÐôˆàÀˆÉàôˆØˆ™¥±°ôˆáÄˆÍÑÉ½­”ôˆåàÈÔˆÍÑÉ½­•]¥‘Ñ ôˆÄ¸Ôˆ¼ø(€€€€€€€€€€ñÑ•áÐàôˆàÔˆäôˆÄØÈˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆåàÈÔˆ™½¹Ñ]•¥¡ÐôˆÜÀÀˆ™½¹ÑM¥é”ôˆÄÌˆù…Õ‘¥Ñ}±½Ìð½Ñ•áÐø(€€€€€€€€€€ñÑ•áÐàôˆàÔˆäôˆÄàÀˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÌÜÐÄÔÄˆ™½¹ÑM¥é”ôˆÄÀˆùÕÍ•É}¥ƒŠHÕÍ•ÉÌ¹¥ð½Ñ•áÐø(€€€€€€€€€€ñÑ•áÐàôˆàÔˆäôˆÄäÔˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÌÜÐÄÔÄˆ™½¹ÑM¥é”ôˆÄÀˆù…Ñ¥½¸°µ•Ñ¡½°Á…Ñ ð½Ñ•áÐø(€€€€€€€€€€ñÑ•áÐàôˆàÔˆäôˆÈÄÀˆÑ•áÑ¹¡½Èô‰µ¥‘‘±”ˆ™¥±°ôˆŒÌÜÐÄÔÄˆ™½¹ÑM¥é”ôˆÄÀˆùÍÑ…ÑÕÍ}½‘”°¥Á}…‘‘É•ÍÌð½Ñ•áÐø((€€€€€€€€€ì¼¨I•±…Ñ¥½¹Í¡¥À±¥¹•Ì€¨½ô(€€€€€€€€€€ñ±¥¹”àÄôˆÄØÀˆäÄôˆÔÀˆàÈôˆÈÜÀˆäÈôˆÔÀˆÍÑÉ½­”ôˆŒÝáåˆÍÑÉ½­•]¥‘Ñ ôˆÄˆÍÑÉ½­•…Í¡…ÉÉ…äôˆÐˆ¼ø(€€€€€€€€€€ñ±¥¹”àÄôˆÐÌÀˆäÄôˆÔÀˆàÈôˆÔÌÀˆäÈôˆÔÀˆÍÑÉ½­”ôˆŒÝáåˆÍÑÉ½­•]¥‘Ñ ôˆÄˆÍÑÉ½­•…Í¡…ÉÉ…äôˆÐˆ¼ø(€€€€€€€€€€ñ±¥¹”àÄôˆØÄÀˆäÄôˆÄÀÔˆàÈôˆØÄÀˆäÈôˆÄÐÀˆÍÑÉ½­”ôˆŒÝáåˆÍÑÉ½­•]¥‘Ñ ôˆÄˆÍÑÉ½­•…Í¡…ÉÉ…äôˆÐˆ¼ø(€€€€€€€€€€ñ±¥¹”àÄôˆÌÔÀˆäÄôˆÄÀÔˆàÈôˆÌÔÀˆäÈôˆÄÔÔˆÍÑÉ½­”ôˆŒÝáåˆÍÑÉ½­•]¥‘Ñ ôˆÄˆÍÑÉ½­•…Í¡…ÉÉ…äôˆÐˆ¼ø(€€€€€€€€€€ñ±¥¹”àÄôˆàÔˆäÄôˆäÀˆàÈôˆàÔˆäÈôˆÄÐÀˆÍÑÉ½­”ôˆŒÝáåˆÍÑÉ½­•]¥‘Ñ ôˆÄˆÍÑÉ½­•…Í¡…ÉÉ…äôˆÐˆ¼ø(€€€€€€€€ð½ÍÙœø(€€€€€€ð½½M•Ñ¥½¸ø((€€€€€ì¼¨•Á±½åµ•¹Ð€¨½ô(€€€€€€ñ½M•Ñ¥½¸Ñ¥Ñ±”ô‰•Á±½åµ•¹Ð€˜½¹™¥ÕÉ…Ñ¥½¸ˆÑ…œô‰‘•Øˆ‘•™…Õ±Ñ=Á•¸õí™…±Í•ôø(€€€€€€€€ñ ÌÍÑå±”õíì™½¹ÑM¥é”è€œÄÕÁàœ°™½¹Ñ]•¥¡Ðè€ÜÀÀ°µ…É¥¹	½ÑÑ½´è€œáÁàœ°½±½Èè€œŒÅÉÑœõôù¹Ù¥É½¹µ•¹ÐY…É¥…‰±•Ìð½ Ìø(€€€€€€€€ñÁÉ”ÍÑå±”õíì(€€€€€€€€€‰…­É½Õ¹è€œŒÁÈÔÐÀœ°½±½Èè€œÕÙœ°Á…‘‘¥¹œè€œÄÙÁàœ°‰½É‘•ÉI…‘¥ÕÌè€œáÁàœ°(€€€€€€€€€™½¹ÑM¥é”è€œÄÉÁàœ°±¥¹•!•¥¡Ðè€œÄ¸àœ°½Ù•É™±½Üè€…ÕÑ¼œ°µ…É¥¹	½ÑÑ½´è€œÄÙÁàœ°(€€€€€€€õôùí€ŒM•ÉÙ•È)A=IPôÌÀÀÄ)9=}9XõÁÉ½‘ÕÑ¥½¸))]Q}MIPôñÉ…¹‘½´´ØÐµ¡…Èø)1%9Q}UI0õ¡ÑÑÁÌè¼½å½ÕÈµ‘½µ…¥¸¹½´((Œ…Ñ…‰…Í”€¡ÁÉ½‘ÕÑ¥½¸¤)Q	M}UI0õÁ½ÍÑÉ•ÍÅ°è¼½ÕÍ•ÈéÁ…ÍÍ¡½ÍÐèÔÐÌÈ½Ñ…Õ±¥„((Œµ…¥°€¡™½È¥¹Ù¥Ñ•Ì¤)M5QA}!=MPõÍµÑÀ¹•á…µÁ±”¹½´)M5QA}A=IPôÔàÜ)M5QA}UMHõ¹½É•Á±åÑ…Õ±¥„¹½´)M5QA}AMLôñÁ…ÍÍÝ½Éø)I=5}5%0õ¹½É•Á±åÑ…Õ±¥„¹½µôð½ÁÉ”ø((€€€€€€€€ñ ÌÍÑå±”õíì™½¹ÑM¥é”è€œÄÕÁàœ°™½¹Ñ]•¥¡Ðè€ÜÀÀ°µ…É¥¹	½ÑÑ½´è€œáÁàœ°½±½Èè€œŒÅÉÑœõôù½­•ÈM•ÑÕÀð½ Ìø(€€€€€€€€ñÀÍÑå±”õíìµ…É¥¹	½ÑÑ½´è€œáÁàœõôø(€€€€€€€€€5Õ±Ñ¤µÍÑ…”½­•É™¥±”è9½‘”¹©Ì‰Õ¥±ÍÑ…”½µÁ¥±•ÌÑ¡”I•…ÐMA°ÁÉ½‘ÕÑ¥½¸ÍÑ…”ÉÕ¹ÌÑ¡”áÁÉ•ÍÌ(€€€€€€€€€Í•ÉÙ•ÈÝ¥Ñ Ñ¡”‰Õ¥±ÐÍÑ…Ñ¥Œ™¥±•Ì¸Q¡”€ñ½‘”ÍÑå±”õíì‰…­É½Õ¹è€œÁÍÜœ°Á…‘‘¥¹œè€œÅÁà€ÙÁàœ°‰½É‘•ÉI…‘¥ÕÌè€œÍÁàœ°™½¹ÑM¥é”è€œÄÉÁàœõôùÍ•ÉÙ•È½ÕÁ±½…‘Ì¼ð½½‘”ø‘¥É•Ñ½Éä(€€€€€€€€€µÕÍÐ‰”µ½Õ¹Ñ•…Ì„Á•ÉÍ¥ÍÑ•¹ÐÙ½±Õµ”¸(€€€€€€€€ð½Àø((€€€€€€€€ñ ÌÍÑå±”õíì™½¹ÑM¥é”è€œÄÕÁàœ°™½¹Ñ]•¥¡Ðè€ÜÀÀ°µ…É¥¹	½ÑÑ½´è€œáÁàœ°½±½Èè€œŒÅÉÑœõôùI…¥±Ý…ä•Á±½åµ•¹Ðð½ Ìø(€€€€€€€€ñÀø(€€€€€€€€€½¹™¥ÕÉ•Ù¥„€ñ½‘”ÍÑå±”õíì‰…­É½Õ¹è€œÁÍÜœ°Á…‘‘¥¹œè€œÅÁà€ÙÁàœ°‰½É‘•ÉI…‘¥ÕÌè€œÍÁàœ°™½¹ÑM¥é”è€œÄÉÁàœõôùÉ…¥±Ý…ä¹Ñ½µ°ð½½‘”øƒŠP(€€€€€€€€€…ÕÑ¼µ‘•Á±½åÌ™É½´¥Ð°ÉÕ¹Ìµ¥É…Ñ¥½¹Ì½¸‘•Á±½ä°¥¹±Õ‘•Ì¡•…±Ñ ¡•¬•¹‘Á½¥¹Ð…Ð€ñ½‘”ÍÑå±”õíì‰…­É½Õ¹è€œÁÍÜœ°Á…‘‘¥¹œè€œÅÁà€ÙÁàœ°‰½É‘•ÉI…‘¥ÕÌè€œÍÁàœ°™½¹ÑM¥é”è€œÄÉÁàœõôø½…Á¤½¡•…±Ñ ð½½‘”ø¸(€€€€€€€€ð½Àø(€€€€€€ð½½M•Ñ¥½¸ø((€€€€€ì¼¨•Í¥¸MåÍÑ•´€¨½ô(€€€€€€ñ½M•Ñ¥½¸Ñ¥Ñ±”ô‰•Í¥¸MåÍÑ•´€˜	É…¹‘¥¹œˆÑ…œô‰ÁÉ½‘ÕÐˆ‘•™…Õ±Ñ=Á•¸õí™…±Í•ôø(€€€€€€€€ñ ÌÍÑå±”õíì™½¹ÑM¥é”è€œÄÕÁàœ°™½¹Ñ]•¥¡Ðè€ÜÀÀ°µ…É¥¹	½ÑÑ½´è€œÄÉÁàœ°½±½Èè€œŒÅÉÑœõôù½±½ÈA…±•ÑÑ”ð½ Ìø(€€€€€€€€ñ‘¥ØÍÑå±”õíì‘¥ÍÁ±…äè€É¥œ°É¥‘Q•µÁ±…Ñ•½±Õµ¹Ìè€É•Á•…Ð Ð°€Å™È¤œ°…Àè€œÄÁÁàœ°µ…É¥¹	½ÑÑ½´è€œÈÁÁàœõôø(€€€€€€€€€íl(€€€€€€€€€€€ì¹…µ”è€AÉ¥µ…Éäœ°¡•àè€œŒÀÀØÙœ°Ñ•áÐè€œ™™˜œô°(€€€€€€€€€€€ì¹…µ”è€9…Ùäœ°¡•àè€œŒÁÈÔÐÀœ°Ñ•áÐè€œ™™˜œô°(€€€€€€€€€€€ì¹…µ”è€…É¬Q•áÐœ°¡•àè€œŒÅÉÑœ°Ñ•áÐè€œ™™˜œô°(€€€€€€€€€€€ì¹…µ”è€M•½¹‘…Éäœ°¡•àè€œŒÕÙÝœ°Ñ•áÐè€œ™™˜œô°(€€€€€€€€€€€ì¹…µ”è€MÕ•ÍÌœ°¡•àè€œŒÉÝÌÈœ°Ñ•áÐè€œ™™˜œô°(€€€€€€€€€€€ì¹…µ”è€]…É¹¥¹œœ°¡•àè€œÀÔØÈÄœ°Ñ•áÐè€œ™™˜œô°(€€€€€€€€€€€ì¹…µ”è€…¹•Èœ°¡•àè€œÈØÈØœ°Ñ•áÐè€œ™™˜œô°(€€€€€€€€€€€ì¹…µ”è€AÕÉÁ±”œ°¡•àè€œŒÙÐÙÄœ°Ñ•áÐè€œ™™˜œô°(€€€€€€€€€€€ì¹…µ”è€1¥¡Ð	œ°¡•àè€œÑÙäœ°Ñ•áÐè€œŒÅÉÑœô°(€€€€€€€€€€€ì¹…µ”è€…É	œ°¡•àè€œœ°Ñ•áÐè€œŒÅÉÑœô°(€€€€€€€€€€€ì¹…µ”è€	½É‘•Èœ°¡•àè€œÉáÀœ°Ñ•áÐè€œŒÅÉÑœô°(€€€€€€€€€€€ì¹…µ”è€5ÕÑ•œ°¡•àè€œŒÝáåœ°Ñ•áÐè€œ™™˜œô°(€€€€€€€€€t¹µ…À ¡Œ°¤¤€ôø€ (€€€€€€€€€€€€ñ‘¥Ø­•äõí¥ôÍÑå±”õíì(€€€€€€€€€€€€€‰…­É½Õ¹èŒ¹¡•à°½±½ÈèŒ¹Ñ•áÐ°Á…‘‘¥¹œè€œÄÉÁà€ÄÁÁàœ°(€€€€€€€€€€€€€‰½É‘•ÉI…‘¥ÕÌè€œáÁàœ°Ñ•áÑ±¥¸è€•¹Ñ•Èœ°‰½É‘•Èè€œÅÁàÍ½±¥€ÉáÀœ°(€€€€€€€€€€€õôø(€€€€€€€€€€€€€€ñ‘¥ØÍÑå±”õíì™½¹ÑM¥é”è€œÄÉÁàœ°™½¹Ñ]•¥¡Ðè€ØÀÀ°µ…É¥¹	½ÑÑ½´è€œÑÁàœõôùíŒ¹¹…µ•ôð½‘¥Øø(€€€€€€€€€€€€€€ñ‘¥ØÍÑå±”õíì™½¹ÑM¥é”è€œÄÅÁàœ°™½¹Ñ…µ¥±äè€µ½¹½ÍÁ…”œ°½Á…¥Ñäè€À¸àÔõôùíŒ¹¡•áôð½‘¥Øø(€€€€€€€€€€€€ð½‘¥Øø(€€€€€€€€€€¤¥ô(€€€€€€€€ð½‘¥Øø((€€€€€€€€ñ ÌÍÑå±”õíì™½¹ÑM¥é”è€œÄÕÁàœ°™½¹Ñ]•¥¡Ðè€ÜÀÀ°µ…É¥¹	½ÑÑ½´è€œáÁàœ°½±½Èè€œŒÅÉÑœõôùQåÁ½É…Á¡äð½ Ìø(€€€€€€€€ñÀø(€€€€€€€€€MåÍÑ•´™½¹ÐÍÑ…¬è€ñ½‘”ÍÑå±”õíì‰…­É½Õ¹è€œÁÍÜœ°Á…‘‘¥¹œè€œÅÁà€ÙÁàœ°‰½É‘•ÉI…‘¥ÕÌè€œÍÁàœ°™½¹ÑM¥é”è€œÄÉÁàœõôøµ…ÁÁ±”µÍåÍÑ•´°	±¥¹­5…MåÍÑ•µ½¹Ð°€M•½”U$œ°I½‰½Ñ¼°Í…¹ÌµÍ•É¥˜ð½½‘”ø¸(€€€€€€€€€!•…‘¥¹ÌÕÍ”Ý•¥¡Ð€ÜÀÃŠLàÀÀ°‰½‘äÑ•áÐ€ÐÀÃŠLÔÀÀ¸½¹ÐÍ¥é•Ì™½±±½Ü„µ½‘Õ±…ÈÍ…±”™É½´€ÄÅÁà€¡…ÁÑ¥½¹Ì¤Ñ¼€ÌÙÁà€¡Ù•ÉÍ¥½¸‰…¹¹•È¤¸(€€€€€€€€ð½Àø(€€€€€€ð½½M•Ñ¥½¸ø((€€€€€€ñ‘¥ØÍÑå±”õíì(€€€€€€€Ñ•áÑ±¥¸è€•¹Ñ•Èœ°Á…‘‘¥¹œè€œÈÁÁà€Àœ°™½¹ÑM¥é”è€œÄÉÁàœ°½±½Èè€œŒÝáåœ°(€€€€€õôø(€€€€€€€Q…Õ±¥„AÉ½Ñ½ÑåÁ”M¡½Ý…Í”ÙíUII9Q}YIM%=9ô€™¹‰ÍÀï
Ü™¹‰ÍÀìí	U%1}Qô(€€€€€€ð½‘¥Øø(€€€€ð½‘¥Øø(€€¤ì)ô(