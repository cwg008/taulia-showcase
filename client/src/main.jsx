import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import App from './App';
import './styles/index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#f5f5f5',
          padding: '20px',
        }}>
          <h1 style={{ color: '#d32f2f', marginBottom: '16px' }}>Something went wrong</h1>
          <p style={{ color: '#666', marginBottom: '16px', maxWidth: '500px', textAlign: 'center' }}>
            An unexpected error occurred. Please try refreshing the page.
          </p>
          <details style={{ whiteSpace: 'pre-wrap', color: '#666', backgroundColor: '#fff', padding: '16px', borderRadius: '4px', maxWidth: '500px', overflow: 'auto' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>Error details</summary>
            {this.state.error?.toString()}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
