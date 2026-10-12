import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { commuteService } from '../services/api';
import {
  Route,
  MapPin,
  Calendar,
  Clock,
  Users,
  IndianRupee,
  Car,
  AlertCircle,
  CheckCircle2,
  Edit3,
  XCircle,
  PlusCircle,
  RefreshCw,
  Filter,
  Check
} from 'lucide-react';

export const MyCommutesPage = () => {
  const { user } = useAuth();
  const [commutes, setCommutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Edit Modal states
  const [editingCommute, setEditingCommute] = useState(null);
  const [editOrigin, setEditOrigin] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [editDatetime, setEditDatetime] = useState('');
  const [editTotalSeats, setEditTotalSeats] = useState(3);
  const [editAvailableSeats, setEditAvailableSeats] = useState(3);
  const [editPrice, setEditPrice] = useState(150);
  const [editDescription, setEditDescription] = useState('');
  const [editError, setEditError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Cancellation confirm state
  const [cancellingId, setCancellingId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchCommutes = async () => {
    setLoading(true);
    setError('');
    try {
      const statusParam = filterStatus === 'ALL' ? '' : filterStatus;
      const response = await commuteService.getMyCommutes(statusParam);
      setCommutes(response.data?.commutes || []);
    } catch (err) {
      setError(err.message || 'Failed to load your commutes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommutes();
  }, [filterStatus]);

  // Open Edit Modal
  const handleStartEdit = (commute) => {
    setEditingCommute(commute);
    setEditOrigin(commute.origin);
    setEditDestination(commute.destination);
    
    // Format datetime for datetime-local input
    const d = new Date(commute.departure_datetime);
    const pad = (n) => n.toString().padStart(2, '0');
    const isoString = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setEditDatetime(isoString);

    setEditTotalSeats(commute.total_seats);
    setEditAvailableSeats(commute.available_seats);
    setEditPrice(parseFloat(commute.price_per_seat));
    setEditDescription(commute.route_description || '');
    setEditError('');
  };

  // Submit Edit
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');

    if (!editOrigin.trim() || !editDestination.trim() || !editDatetime) {
      setEditError('Origin, destination, and departure time are required.');
      return;
    }

    const departureDate = new Date(editDatetime);
    const minTime = new Date(Date.now() + 15 * 60 * 1000);
    if (departureDate < minTime) {
      setEditError('Departure time must be at least 15 minutes in the future.');
      return;
    }

    const totalSeatsNum = parseInt(editTotalSeats, 10);
    const availSeatsNum = parseInt(editAvailableSeats, 10);
    if (availSeatsNum > totalSeatsNum) {
      setEditError('Available seats cannot exceed total seats.');
      return;
    }

    setIsUpdating(true);

    try {
      const payload = {
        origin: editOrigin.trim(),
        destination: editDestination.trim(),
        departure_datetime: departureDate.toISOString(),
        total_seats: totalSeatsNum,
        available_seats: availSeatsNum,
        price_per_seat: parseFloat(editPrice),
        route_description: editDescription.trim() || undefined,
        vehicle_id: editingCommute.vehicle_id
      };

      const res = await commuteService.updateCommute(editingCommute.id, payload);
      setSuccess('Commute updated successfully!');
      setEditingCommute(null);

      // Update state locally
      setCommutes(prev => prev.map(c => c.id === editingCommute.id ? { ...c, ...res.data.commute } : c));
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setEditError(err.message || 'Failed to update commute');
    } finally {
      setIsUpdating(false);
    }
  };

  // Cancel Commute
  const handleCancelCommute = async (id) => {
    setIsCancelling(true);
    setError('');
    try {
      const res = await commuteService.cancelCommute(id);
      setSuccess('Commute cancelled successfully.');
      setCancellingId(null);

      // Update locally
      setCommutes(prev => prev.map(c => c.id === id ? { ...c, status: 'CANCELLED' } : c));
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError(err.message || 'Failed to cancel commute');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isPast = (dateStr) => {
    return new Date(dateStr) <= new Date();
  };

  return (
    <div className="dashboard-container">
      {/* Page Header */}
      <div className="dashboard-header">
        <div>
          <h2>My Commutes</h2>
          <p>View, manage, and monitor the routes you have published.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchCommutes} className="btn-refresh" disabled={loading} title="Refresh list">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/driver/commutes/new" className="btn-primary">
            <PlusCircle size={16} />
            <span>Publish Commute</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="commute-filter-bar">
        <div className="filter-pill-group">
          {['ALL', 'SCHEDULED', 'CANCELLED', 'COMPLETED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`filter-pill ${filterStatus === status ? 'active' : ''}`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading your commutes...</p>
        </div>
      ) : commutes.length === 0 ? (
        <div className="card empty-commute-card">
          <div className="empty-icon-circle">
            <Route size={32} />
          </div>
          <h3>No Commutes Found</h3>
          <p>
            {filterStatus === 'ALL'
              ? "You haven't published any shared commutes yet. Create your first route to start splitting travel expenses!"
              : `No commutes found with status "${filterStatus}".`}
          </p>
          <Link to="/driver/commutes/new" className="btn-primary" style={{ marginTop: '1rem' }}>
            <PlusCircle size={16} />
            <span>Publish a Commute Now</span>
          </Link>
        </div>
      ) : (
        <div className="commutes-list">
          {commutes.map((commute) => {
            const past = isPast(commute.departure_datetime);
            const canModify = commute.status === 'SCHEDULED' && !past;

            return (
              <div key={commute.id} className="commute-card">
                {/* Top Status & Route Row */}
                <div className="commute-card-top">
                  <div className="commute-route">
                    <span className="route-point origin-point">{commute.origin}</span>
                    <span className="route-arrow">&rarr;</span>
                    <span className="route-point dest-point">{commute.destination}</span>
                  </div>

                  <span className={`status-badge status-${commute.status.toLowerCase()}`}>
                    {commute.status}
                    {past && commute.status === 'SCHEDULED' && ' (DEPARTED)'}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="commute-details-grid">
                  <div className="commute-detail-item">
                    <Calendar size={15} className="detail-icon" />
                    <span>{formatDate(commute.departure_datetime)}</span>
                  </div>

                  <div className="commute-detail-item">
                    <Car size={15} className="detail-icon" />
                    <span>
                      {commute.vehicle?.model || 'Vehicle'} ({commute.vehicle?.registration_number || 'N/A'})
                    </span>
                  </div>

                  <div className="commute-detail-item">
                    <Users size={15} className="detail-icon" />
                    <span>
                      <strong>{commute.available_seats}</strong> of {commute.total_seats} seats available
                    </span>
                  </div>

                  <div className="commute-detail-item">
                    <IndianRupee size={15} className="detail-icon" />
                    <span className="price-highlight">
                      ₹{parseFloat(commute.price_per_seat).toFixed(0)} / seat
                    </span>
                  </div>
                </div>

                {/* Route description / notes */}
                {commute.route_description && (
                  <div className="commute-notes-box">
                    <strong>Route Notes:</strong> {commute.route_description}
                  </div>
                )}

                {/* Card Actions */}
                {canModify && (
                  <div className="commute-card-actions">
                    <button
                      onClick={() => handleStartEdit(commute)}
                      className="btn-action-small"
                    >
                      <Edit3 size={14} />
                      <span>Edit Details</span>
                    </button>

                    {cancellingId === commute.id ? (
                      <div className="cancel-confirm-box">
                        <span className="confirm-text">Cancel this commute?</span>
                        <button
                          onClick={() => handleCancelCommute(commute.id)}
                          className="btn-danger-small"
                          disabled={isCancelling}
                        >
                          {isCancelling ? 'Cancelling...' : 'Yes, Cancel'}
                        </button>
                        <button
                          onClick={() => setCancellingId(null)}
                          className="btn-secondary-small"
                          disabled={isCancelling}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCancellingId(commute.id)}
                        className="btn-action-small btn-cancel-trigger"
                      >
                        <XCircle size={14} />
                        <span>Cancel Commute</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Commute Modal */}
      {editingCommute && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Edit Scheduled Commute</h3>
              <button onClick={() => setEditingCommute(null)} className="btn-close-modal">
                &times;
              </button>
            </div>

            {editError && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="auth-form">
              <div className="form-group">
                <label className="form-label">Origin</label>
                <input
                  type="text"
                  className="form-input"
                  value={editOrigin}
                  onChange={(e) => setEditOrigin(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Destination</label>
                <input
                  type="text"
                  className="form-input"
                  value={editDestination}
                  onChange={(e) => setEditDestination(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Departure Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={editDatetime}
                  onChange={(e) => setEditDatetime(e.target.value)}
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Total Seats</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    className="form-input"
                    value={editTotalSeats}
                    onChange={(e) => setEditTotalSeats(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Available Seats</label>
                  <input
                    type="number"
                    min="0"
                    max={editTotalSeats}
                    className="form-input"
                    value={editAvailableSeats}
                    onChange={(e) => setEditAvailableSeats(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Price (₹ per seat)</label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  className="form-input"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Route Notes (Optional)</label>
                <textarea
                  rows="2"
                  className="form-input textarea-input"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>

              <div className="form-actions-row">
                <button type="submit" className="btn-primary" disabled={isUpdating}>
                  <Check size={16} />
                  <span>{isUpdating ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCommute(null)}
                  className="btn-secondary"
                  disabled={isUpdating}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
