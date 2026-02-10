import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import LoginPage from './components/LoginPage.jsx';
import Dashboard from './components/Dashboard.jsx';
import PrototypeList from './components/PrototypeList.jsx';
import PrototypeDetail from './components/PrototypeDetail.jsx';
import MagicLinkManager from './components/MagicLinkManager.jsx';
import UserManager from './components/UserManager.jsx';
import AuditLog from './components/AuditLog.jsx';
import PublicViewer from './components/PublicViewer.jsx';
import InviteAcceptPage from './components/InviteAcceptPage.jsx';
import ProspectPortal from './components/ProspectPortal.jsx';
import DocumentationView from './components/DocumentationView.jsx';

export default function App() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedPrototypeId, setSelectedPrototypeId] = useState(null);

  // Parse URL to determine view
  const path = window.location.pathname;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Public routes (no auth required)
  if (path.startsWith('/viewer/')) {
    const token = path.replace('/viewer/', '');
    return <PublicViewer token={token} />;
  }

  if (path.startsWith('/prospect/')) {
    const token = path.replace('/prospect/', '');
    return <ProspectPortal token={token} />;
  }

  if (path.startsWith('/invite/')) {
    const token = path.replace('/invite/', '');
    return <InviteAcceptPage token={token} />;
  }

  // Protected routes
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Admin dashboard
  const renderContent = () => {
    if (selectedPrototypeId) {
      return (
        <PrototypeDetail
          prototypeId={selectedPrototypeId}
          onBack={() => setSelectedPrototypeId(null)}
        />
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'prototypes':
        return <PrototypeList onSelectPrototype={setSelectedPrototypeId} />;
      case 'links':
        return <MagicLinkManager />;
      case 'users':
        return <UserManager />;
      case 'audit':
        return <AuditLog />;
      case 'docs':
        return <DocumentationView />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-logo">T</span>
          Taulia
        </div>
        <nav className="sidebar-nav">
          <div
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('dashboard');
              setSelectedPrototypeId(null);
            }}
          >
            📊 Dashboard
          </div>
          <div
            className={`nav-item ${currentView === 'prototypes' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('prototypes');
              setSelectedPrototypeId(null);
            }}
          >
            🖼️ Prototypes
          </div>
          <div
            className={`nav-item ${currentView === 'links' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('links');
              setSelectedPrototypeId(null);
            }}
          >
            🔗 Magic Links
          </div>
          <div
            className={`nav-item ${currentView === 'users' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('users');
              setSelectedPrototypeId(null);
            }}
          >
            👥 Users
          </div>
          <div
            className={`nav-item ${currentView === 'audit' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('audit');
              setSelectedPrototypeId(null);
            }}
          >
            📋 Audit Log
          </div>
          <div
            className={`nav-item ${currentView === 'docs' ? 'active' : ''}`}
            onClick={() => {
              setCurrentView('docs');
              setSelectedPrototypeId(null);
            }}
          >
            📚 Documentation
          </div>
        </nav>
        <div className="sidebar-footer">
          Version 1.1.0
        </div>
      </div>

      <div className="main-content">
        <div className="app-header">
          <div className="header-title">
            {currentView === 'dashboard' && 'Dashboard'}
            {currentView === 'prototypes' && 'Prototypes'}
            {currentView === 'links' && 'Magic Links'}
            {currentView === 'users' && 'User Management'}
            {currentView === 'audit' && 'Audit Log'}
            {currentView === 'docs' && 'Documentation'}
          </div>
          <div className="header-user">
            <span className="user-email">{user?.email}</span>
            <button className="btn-secondary btn-small" onClick={logout}>
              Logout
            </button>
          </div>
        </div>

        <div className="content-area">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
