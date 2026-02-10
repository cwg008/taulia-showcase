import React, { useState, useEffect } from 'react';
import apiClient from '../api/client.js';

const PrototypeList = ({ onSelectPrototype }) => {
  const [prototypes, setPrototypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    file: null,
    isTopSecret: false,
  });
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchPrototypes();
  }, []);

  const fetchPrototypes = async () => {
    try {
      const data = await apiClient.get('/api/prototypes');
      setPrototypes(data.prototypes || []);
    } catch (err) {
      setError('Failed to load prototypes');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setUploadData({ ...uploadData, file: files[0] });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadData({ ...uploadData, file });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.title || !uploadData.description) {
      setError('Please fill in all required fields (file, title, and description)');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('is_top_secret', uploadData.isTopSecret ? 'true' : 'false');

      await apiClient.postFormData('/api/prototypes', formData);
      setUploadData({ title: '', description: '', file: null, isTopSecret: false });
      setShowUploadForm(false);
      fetchPrototypes();
    } catch (err) {
      setError('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading prototypes...
      </div>
    );
  }

  return (
    <div>
      {error && <div className="error-message">{error}</div>}

      <div style={{ marginBottom: '20px' }}>
        <button className="btn-primary" onClick={() => setShowUploadForm(!showUploadForm)}>
          {showUploadForm ? 'Cancel' : '+ Upload Prototype'}
        </button>
      </div>

      {showUploadForm && (
        <div className="card">
          <div className="card-header">Upload New Prototype</div>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label>HTML/ZIP File</label>
              <div
                className={`dropzone ${dragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="dropzone-text">
                  {uploadData.file ? uploadData.file.name : 'Drag & drop your file here'}
                </div>
                <div className="dropzone-hint">or click to select</div>
                <input
                  type="file"
                  accept=".html,.zip"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="file-input"
                />
              </div>
              <button
                type="button"
                className="btn-secondary"
                style={{ marginTop: '10px', width: '100%' }}
                onClick={() => document.getElementById('file-input').click()}
              >
                Choose File
              </button>
            </div>

            <div className="form-group">
              <label htmlFor="title">Prototype Title</label>
              <input
                id="title"
                type="text"
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                placeholder="e.g., Payment Portal v2"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={uploadData.description}
                onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                placeholder="Describe the prototype..."
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={uploadData.isTopSecret}
                  onChange={(e) => setUploadData({ ...uploadData, isTopSecret: e.target.checked })}
                  style={{ width: 'auto', margin: 0 }}
                />
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Mark as Top Secret
                  <span style={{
                    background: '#dc2626',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                  }}>
                    TOP SECRET
                  </span>
                </span>
              </label>
              <p style={{ fontSize: '12px', color: 'var(--taulia-light-text)', marginTop: '4px' }}>
                Top-secret prototypes require prospects to request access before viewing.
              </p>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>
      )}

      {prototypes.length > 0 ? (
        <div className="grid">
          {prototypes.map((proto) => (
            <div key={proto.id} className="grid-item">
              <div className="grid-item-header">
                <div className="grid-item-title">
                  {proto.title}
                  {!!proto.is_top_secret && (
                    <span style={{
                      background: '#dc2626',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '600',
                      letterSpacing: '0.5px',
                      marginLeft: '8px',
                      verticalAlign: 'middle',
                    }}>
                      TOP SECRET
                    </span>
                  )}
                </div>
                <div className="grid-item-subtitle">
                  <span className="badge badge-primary">{proto.status}</span>
                </div>
              </div>
              <div className="grid-item-body">{proto.description}</div>
              <div className="grid-item-footer">
                <button
                  className="btn-primary btn-small"
                  onClick={() => onSelectPrototype(proto.id)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body">No prototypes yet. Upload one to get started!</div>
        </div>
      )}
    </div>
  );
};

export default PrototypeList;
