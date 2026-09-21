import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { vehicleService } from '../services/api';
import { 
  Car, 
  AlertCircle, 
  CheckCircle2, 
  Edit3, 
  ShieldCheck, 
  PlusCircle, 
  Calendar, 
  FileText,
  XCircle
} from 'lucide-react';

export const VehiclePage = () => {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [vehicleType, setVehicleType] = useState('Sedan');
  const [vehicleModel, setVehicleModel] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  
  // Feedback states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch driver's current vehicle
  const fetchVehicle = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await vehicleService.getMyVehicle();
      if (response.data && response.data.vehicle) {
        setVehicle(response.data.vehicle);
        setVehicleType(response.data.vehicle.vehicle_type);
        setVehicleModel(response.data.vehicle.vehicle_model);
        setRegistrationNumber(response.data.vehicle.registration_number);
      } else {
        setVehicle(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load vehicle information');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'DRIVER') {
      fetchVehicle();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Guard for non-drivers
  if (user?.role !== 'DRIVER') {
    return (
      <div className="dashboard-container">
        <div className="alert alert-error">
          <AlertCircle size={20} />
          <span>Access Restricted: Only registered Drivers have permission to manage vehicle information.</span>
        </div>
      </div>
    );
  }

  // Handle vehicle submission (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!vehicleModel.trim() || !registrationNumber.trim()) {
      setError('Please provide vehicle model and registration number');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        vehicle_type: vehicleType,
        vehicle_model: vehicleModel.trim(),
        registration_number: registrationNumber.trim().toUpperCase()
      };

      let res;
      if (vehicle) {
        // Update existing
        res = await vehicleService.updateVehicle(payload);
        setSuccess('Vehicle details updated successfully!');
      } else {
        // Register new
        res = await vehicleService.addVehicle(payload);
        setSuccess('Vehicle registered successfully!');
      }

      setVehicle(res.data.vehicle);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Error saving vehicle details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    if (vehicle) {
      setVehicleType(vehicle.vehicle_type);
      setVehicleModel(vehicle.vehicle_model);
      setRegistrationNumber(vehicle.registration_number);
    }
    setIsEditing(false);
    setError('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h2>My Vehicle Information</h2>
          <p>Manage the vehicle you will use when offering seats along your route.</p>
        </div>
        
        {vehicle && !isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn-action">
            <Edit3 size={16} />
            <span>Edit Vehicle</span>
          </button>
        )}
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading vehicle details...</p>
        </div>
      ) : vehicle && !isEditing ? (
        /* Display Existing Vehicle */
        <div className="vehicle-display-card">
          <div className="vehicle-card-top">
            <div className="vehicle-icon-box">
              <Car size={36} color="var(--primary)" />
            </div>
            <div className="vehicle-main-info">
              <div className="vehicle-badge-row">
                <span className="role-badge badge-driver">{vehicle.vehicle_type}</span>
                <span className="verified-badge">
                  <ShieldCheck size={14} />
                  <span>Linked to Driver Account</span>
                </span>
              </div>
              <h3 className="vehicle-title">{vehicle.vehicle_model}</h3>
            </div>
          </div>

          <div className="number-plate-container">
            <div className="number-plate">
              <div className="plate-ind">
                <span className="ind-text">IND</span>
              </div>
              <span className="plate-number">{vehicle.registration_number}</span>
            </div>
          </div>

          <div className="vehicle-meta-grid">
            <div className="meta-item">
              <span className="meta-label">
                <FileText size={14} />
                <span>Vehicle Type</span>
              </span>
              <span className="meta-val">{vehicle.vehicle_type}</span>
            </div>

            <div className="meta-item">
              <span className="meta-label">
                <Calendar size={14} />
                <span>Registered On</span>
              </span>
              <span className="meta-val">{formatDate(vehicle.created_at)}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Register or Edit Form */
        <div className="card vehicle-form-card">
          <div className="form-card-header">
            <h3>{vehicle ? 'Update Vehicle Details' : 'Register a New Vehicle'}</h3>
            <p>
              Please enter accurate vehicle specifications. This helps co-passengers recognize your ride.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="vehicleType">Vehicle Type</label>
              <select
                id="vehicleType"
                className="form-input"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
              >
                <option value="Sedan">Sedan (e.g. Honda City, Verna, Dzire)</option>
                <option value="Hatchback">Hatchback (e.g. Swift, i20, Tiago)</option>
                <option value="SUV">SUV / Compact SUV (e.g. Creta, Brezza, Nexon)</option>
                <option value="Motorcycle">Motorcycle (e.g. Classic 350, Pulsar)</option>
                <option value="Scooter">Scooter (e.g. Activa, Jupiter)</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="vehicleModel">Make & Model</label>
              <div className="input-icon-wrapper">
                <Car size={18} className="input-icon" />
                <input
                  id="vehicleModel"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Maruti Suzuki Swift VXI"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="regNumber">Registration Number Plate</label>
              <div className="input-icon-wrapper">
                <FileText size={18} className="input-icon" />
                <input
                  id="regNumber"
                  type="text"
                  className="form-input text-uppercase"
                  placeholder="e.g. DL 01 AB 1234"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  required
                />
              </div>
              <span className="field-hint">Enter your official state license plate number.</span>
            </div>

            <div className="form-actions-row">
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                <PlusCircle size={18} />
                <span>{submitting ? 'Saving...' : vehicle ? 'Update Vehicle' : 'Register Vehicle'}</span>
              </button>

              {vehicle && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  <XCircle size={18} />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
