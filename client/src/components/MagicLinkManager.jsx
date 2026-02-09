import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const CLIENT_URL = import.meta.env.VITE_CLIENT_URL || window.location.origin;

export default function MagicLinkManager() {
  const [links, setLinks] = useState([]);
  const [prototypes, setPrototypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Form state
  const [formData, setFormData] = useState({
    prototype_id: '',
    label: '',
    expires_at: '',
  });

  useEffect(() => {
    fetchLinks();
    fetchPrototypes();
  }, [currentPage]);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/links', {
        params: { page: currentPage, limit: itemsPerPage },
      });
      setLinks(response.links || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch link:', error);
    }
    setLoading(false);
  };

  const fetchPrototypes = async () => {
    try {
      const response = await apiClient.get('/prototypes');
      setPrototypes(response.prototypes || []);
    } catch (error) {
      console.error('Failed to fetch prototypes:', error);
    }
  };

  const handleCreateLink = async (e) => {
    e.preventDefault();
    if (!formData.prototype_id || !formData.label) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        prototype_id: formData.prototype_id,
        label: formData.label,
      };
      if (formData.expires_at) {
        payload.expires_at = formData.expires_at;
      }

      await apiClient.post('/links', payload);
      setFormData({ prototype_id: '', label: '', expires_at: '' });
      setShowModal(false);
      fetchLinks();
    } catch (error) {
      console.error('Failed to create link:', error);
      alert('Failed to create link');
    }
  };

  const handleCopyLink = (token) => {
    const fullUrl = `${CLIENT_URL || window.location.origin}/view/${token}`;
    navigator.clipboard.writeText(fullUrl);
    alert('Link copied to clipboard!');
  };

  const handleRevokeLink = async (id) => {
    if (!confirm('Are you sure you want to revoke this link?')) return;

    try {
      await apiClient.patch(`/links/${id}`, { is_revoked: true });
      fetchLinks();
    } catch (error) {
      console.error('Failed to revoke link:', error);
      alert('Failed to revoke link');
    }
  };

  const handleDeleteLink = async (id) => {
    if (!confirm('Are you sure you want to delete this link? This cannot be undone.')) return;

    try {
      await apiClient.delete(`/links/${id}`);
      fetchLinks();
    } catch (error) {
      console.error('Failed to delete link:', error);
      alert('Failed to delete link');
    }
  };

  const getStatusBadge = (link) => {
    if (link.is_revoked) {
      return <span className="badge badge-red">Revoked</span>;
    }
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return <span className="badge badge-orange">Expired</span>;
    }
    return <span className="badge badge-green">Active</span>;
  };

  const truncateUrl = (token) => {
    const fullUrl = `${CLIENT_URL || window.location.origin}/view/${token}`;
    return fullUrl.length > 50 ? fullUrl.substring(0, 47) + '...' : fullUrl;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && links.length === 0) {
    return <div className="container"><p>Loading...</p></div>;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1>Magic Links</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Create Link
        </button>
      </div>

      {/* Create Link Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Create Magic Link</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                Ã—
              </button>
            </div>
            <form onSubmit={handleCreateLink}>
              <div className="form-group">
                <label htmlFor="prototype">Prototype *</label>
                <select
                  id="prototype"
                  value={formData.prototype_id}
                  onChange={(e) =>
                    setFormData({ ...formData, prototype_id: e.target.value })
                  }
                  required
                >
                  <option value="">Select a prototype</option>
                  {prototypes.map((proto) => (
                    <option key={proto.id} value={proto.id}>
                      {proto.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="label">Label *</label>
                <input
                  id="label"
                  type="text"
                  value={formData.label}
                  onChange={(e) =>
                    setFormData({ ...formData, label: e.target.value })
                  }
                  placeholder="e.g., Client Review - Jan 2024"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="expires_at">Expiration Date (optional)</label>
                <input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) =>
                    setFormData({ ...formData, expires_at: e.target.value })
                  }
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Links Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Prototype Title</th>
              <th>Label</th>
              <th>Share URL</th>
              <th>Created</th>
              <th>Expires</th>
              <th>Views</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {links.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center">
                  No links yet. Create one to get started.
                </td>
              </tr>
            ) : (
              links.map((link) => (
                <tr key={link.id}>
                  <td>{lknk.prototype_title || 'Unknown'}</td>
                  <td>{lknk.label}</td>
                  <td>
                    <code className="truncated-url">
                      {truncateUrl(link.token)}
                    </code>
                  </td>
                  <td>{formatDate(link.created_at)}</td>
                  <td>{formatDate(link.expires_at)}</td>
                  <td>{lknk.view_count || 0}</td>
                  <td>{getStatusBadge(link)}</td>
                  <td className="actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleCopyLink(link.token)}
                      title="Copy link"
                    >
                      Copy
                    </button>
                    {!link.is_revoked && (
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleRevokeLink(link.id)}
                        title="Revoke link"
                      >
                        Revoke
                      </button>
                    ))}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteLink(link.id)}
                      title="Delete link"
                    >
                      Delete
                    </button>
                  ü½Ñø(€€€€€€€€€€€€€€€€ğ½ÑÈø(€€€€€€€€€€€€€€¤¤(€€€€€€€€€€€€¥ô(€€€€€€€€€€ğ½Ñ‰½‘äø(€€€€€€€€ğ½Ñ…‰±”ø(€€€€€€ğ½‘¥Øø((€€€€€ì¼¨A…¥¹…Ñ¥½¸€¨½ô(€€€€€€ñ‘¥Ø±…ÍÍ9…µ”ô‰Á…¥¹…Ñ¥½¸ˆø(€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€±…ÍÍ9…µ”ô‰‰Ñ¸‰Ñ¸µÍ•½¹‘…Éäˆ(€€€€€€€€€‘¥Í…‰±•õíÕÉÉ•¹ÑA…”€ôôô€Åô(€€€€€€€€€½¹±¥¬õì ¤€ôøÍ•ÑÕÉÉ•¹ÑA…”¡ÕÉÉ•¹ÑA…”€´€Ä¥ô(€€€€€€€€ø(€€€€€€€€€AÉ•Ù¥½ÕÌ(€€€€€€€€ğ½‰ÕÑÑ½¸ø(€€€€€€€€ñÍÁ…¸±…ÍÍ9…µ”ô‰Á…¥¹…Ñ¥½¸µ¥¹™¼ˆø(€€€€€€€€€A…”íÕÉÉ•¹ÑA…•ô½˜íÑ½Ñ…±A…•Íô(€€€€€€€€ğ½ÍÁ…¸ø(€€€€€€€€ñ‰ÕÑÑ½¸(€€€€€€€€€±…ÍÍ9…µ”ô‰‰Ñ¸‰Ñ¸µÍ•½¹‘…Éäˆ(€€€€€€€€€‘¥Í…‰±•õíÕÉÉ•¹ÑA…”€øôÑ½Ñ…±A…•Íô(€€€€€€€€€½¹±¥¬õì ¤€ôøÍ•ÑÕÉÉ•¹ÑA…”¡ÕÉÉ•¹ÑA…”€¬€Ä¥ô(€€€€€€€€ø(€€€€€€€€€9•áĞ(€€€€€€€€ğ½‰ÕÑÑ½¸ø(€€€€€€ğ½‘¥Øø(€€€€ğ½‘¥Øø(€€¤ì)ô