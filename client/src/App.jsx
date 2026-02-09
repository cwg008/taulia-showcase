import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './components/LoginPage';
import InviteAcceptPage from './components/InviteAcceptPage';
import PublicViewer from './components/PublicViewer';
import ProspectPortal from './components/ProspectPortal';
import Dashboard from './components/Dashboard';
import PrototypeList from './components/PrototypeList';
import PrototypeDetail from './components/PrototypeDetail';
import MagicLinkManager from './components/MagicLinkManager';
import UserManager from './components/UserManager';
import AuditLog from './components/AuditLog';
import DocumentationView from './components/DocumentationView';

function App() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedPrototypeId, setSelectedPrototypeId] = useState(null);

  // Check for public viewer route
  const path = window.location.pathname;
  if (path.startsWith('/view/')) {
    const token = path.split('/view/')[1];
    return <PublicViewer token={token} />;
  }

  // Check for invite token
  const params = new URLSearchParams(window.location.search);
  const inviteToken = params.get('invite');
  if (inviteToken) {
    return <InviteAcceptPage token={inviteToken} onAccepted={() => window.location.href = '/'} />;
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f7fa' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" />
          <p style={{ color: '#666', marginTop: 16 }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Route prospects/customers to their dedicated portal
  if (user.role === 'prospect') {
    return <ProspectPortal />;
  }

  // Admin experience below
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'prototypes', label: 'Prototypes', icon: '🧩' },
    { id: 'links', label: 'Magic Links', icon: '🔗' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'audit', label: 'Audit Log', icon: '📋' },
    { id: 'docs', label: 'Documentation', icon: '📖' },
  ];

  const handleViewPrototype = (id) => {
    setSelectedPrototypeId(id);
    setActiveView('prototype-detail');
  };

  const handleBackToList = () => {
    setSelectedPrototypeId(null);
    setActiveView('prototypes');
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveView} onViewPrototype={handleViewPrototype} />;
      case 'prototypes':
        return <PrototypeList onViewPrototype={handleViewPrototype} />;
      case 'prototype-detail':
        return <PrototypeDetail prototypeId={selectedPrototypeId} onBack={handleBackToList} />;
      case 'links':
        return <MagicLinkManager />;
      case 'users':
        return <UserManager />;
      case 'audit':
        return <AuditLog />;
      case 'docs':
        return <DocumentationView />;
      default:
        return <Dashboard onNavigate={setActiveView} onViewPrototype={handleViewPrototype} />;
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">T</span>
            <div>
              <div className="logo-title">Taulia</div>
              <div className="logo-subtitle">Prototype Showcase</div>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id || (activeView === 'prototype-detail' && item.id === 'prototypes') ? 'active' : ''}`}
              onClick={() => {
                if (item.id === 'prototypes') handleBackToList();
                else setActiveView(item.id);
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user.name?.[0]?.toUpperCase() || 'A'}</div>
            <div>
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>Sign Out</button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
