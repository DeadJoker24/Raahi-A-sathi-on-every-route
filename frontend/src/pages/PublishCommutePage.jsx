import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { commuteService, vehicleService } from '../services/api';
import {
  Route,
  MapPin,
  Calendar,
  Users,
  IndianRupee,
  FileText,
  Car,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
  Clock
} from 'lucide-react';

export const PublishCommutePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Driver vehicle state
  const [vehicle, setVehicle] = useState(null);
  const [checkingVehicle, setCheckingVehicle] = useState(true);

  // Form states
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDatetime, setDepartureDatetime] = useState('');
  const [totalSeats, setTotalSeats] = useState(3);
  const [pricePerSeat, setPricePerSeat] = useState(150);
  const [routeDescription, setRouteDescription] = useState('');

  // UI status states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Check if driver has a vehicle registered
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await vehicleService.getMyVehicle();
        if (res.data?.vehicle) {
          setVehicle(res.data.vehicle);
        } else {
          setVehicle(null);
        }
      } catch (err) {
        console.warn('Vehicle check failed:', err.message);
      } finally {
        setCheckingVehicle(false);
      }
    };

    fetchVehicle();

    // Default departure time to 2 hours from now formatted for datetime-local
    const defaultTime = new Date(Date.now() + 2 * 60 * 60 * 1000);
    // Format YYYY-MM-DDTHH:mm
    const pad = (n) => n.toString().padStart(2, '0');
    const localIso = `${defaultTime.getFullYear()}-${pad(defaultTime.getMonth() + 1)}-${pad(defaultTime.getDate())}T${pad(defaultTime.getHours())}:${pad(defaultTime.getMinutes())}`;
    setDepartureDatetime(localIso);
  }, []);

  // Compute minimum departure time (15 mins from now)
  const getMinDatetime = () => {
    const minTime = new Date(Date.now() + 15 * 60 * 1000);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${minTime.getFullYear()}-${pad(minTime.getMonth() + 1)}-${pad(minTime.getDate())}T${pad(minTime.getHours())}:${pad(minTime.getMinutes())}`;
  };

  // Form submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Frontend validations
    if (!origin.trim() || !destination.trim()) {
      setError('Please provide both origin and destination points.');
      return;
    }

    if (!departureDatetime) {
      setError('Please specify a departure date and time.');
      return;
    }

    const departureDate = new Date(departureDatetime);
    const minTime = new Date(Date.now() + 15 * 60 * 1000);
    if (departureDate < minTime) {
      setError('Departure time must be at least 15 minutes in the future.');
      return;
    }

    const seats = parseInt(totalSeats, 10);
    if (isNaN(seats) || seats < 1 || seats > 8) {
      setError('Total seats must be between 1 and 8.');
      return;
    }

    const price = parseFloat(pricePerSeat);
    if (isNaN(price) || price < 0) {
      setError('Contribution per seat must be a non-negative amount.');
      return;
    }

    if (!vehicle) {
      setError('You must have a registered vehicle before publishing a commute.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        origin: origin.trim(),
        destination: destination.trim(),
        departure_datetime: departureDate.toISOString(),
        total_seats: seats,
        price_per_seat: price,
        route_description: routeDescription.trim() || undefined,
        vehicle_id: vehicle.id
      };

      const response = await commuteService.createCommute(payload);
      setSuccess('Commute published successfully! Redirecting to your commutes...');
      
      setTimeout(() => {
        navigate('/driver/commutes');
      }, 1500);

    } catch (err) {
      setError(err.message || 'Failed to publish commute. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingVehicle) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Checking vehicle status...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h2>Publish a Commute</h2>
          <p>
            Share your regular travel route, offer empty seats, and split fuel contributions with co-passengers.
          </p>
        </div>
        <Link to="/driver/commutes" className="btn-secondary">
          <Route size={16} />
          <span>My Commutes</span>
        </Link>
      </div>

      {/* No Vehicle Warning */}
      {!vehicle ? (
        <div className="card" style={{ borderColor: 'var(--border-subtle)', textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--driver-bg)', borderRadius: '50%', color: 'var(--primary)', marginBottom: '1rem' }}>
            <Car size={36} />
          </div>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>No Vehicle Registered</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
            Before you can publish a commute, you need to link your vehicle details so passengers know what vehicle to look for.
          </p>
          <Link to="/driver/vehicle" className="btn-primary" style={{ display: 'inline-flex' }}>
            <PlusCircle size={18} />
            <span>Register Your Vehicle First</span>
          </Link>
        </div>
      ) : (
        /* Commute Form */
        <div className="card vehicle-form-card" style={{ maxWidth: '720px' }}>
          {/* Linked Vehicle Info Strip */}
          <div className="linked-vehicle-banner">
            <Car size={18} color="var(--primary)" />
            <span>
              Publishing with your linked <strong>{vehicle.vehicle_model}</strong> ({vehicle.vehicle_type}) &bull; <code>{vehicle.registration_number}</code>
            </span>
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

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Origin & Destination row */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="commute-origin">
                  Origin (Starting Point) *
                </label>
                <div className="input-icon-wrapper">
                  <MapPin size={18} className="input-icon" />
                  <input
                    id="commute-origin"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Sector 62, Noida"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="commute-destination">
                  Destination (Drop Point) *
                </label>
                <div className="input-icon-wrapper">
                  <Route size={18} className="input-icon" />
                  <input
                    id="commute-destination"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Cyber City, Gurugram"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Departure Datetime */}
            <div className="form-group">
              <label className="form-label" htmlFor="commute-datetime">
                Departure Date & Time *
              </label>
              <div className="input-icon-wrapper">
                <Calendar size={18} className="input-icon" />
                <input
                  id="commute-datetime"
                  type="datetime-local"
                  className="form-input"
                  min={getMinDatetime()}
                  value={departureDatetime}
                  onChange={(e) => setDepartureDatetime(e.target.value)}
                  required
                />
              </div>
              <span className="field-hint">Must be scheduled at least 15 minutes in advance.</span>
            </div>

            {/* Seats and Price Row */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="commute-seats">
                  Available Seats to Share *
                </label>
                <div className="input-icon-wrapper">
                  <Users size={18} className="input-icon" />
                  <input
                    id="commute-seats"
                    type="number"
                    min="1"
                    max="8"
                    className="form-input"
                    value={totalSeats}
                    onChange={(e) => setTotalSeats(e.target.value)}
                    required
                  />
                </div>
                <span className="field-hint">Between 1 and 8 empty seats</span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="commute-price">
                  Fuel Contribution (₹ per seat) *
                </label>
                <div className="input-icon-wrapper">
                  <IndianRupee size={18} className="input-icon" />
                  <input
                    id="commute-price"
                    type="number"
                    min="0"
                    step="5"
                    className="form-input"
                    value={pricePerSeat}
                    onChange={(e) => setPricePerSeat(e.target.value)}
                    required
                  />
                </div>
                <span className="field-hint">Fair cost sharing for co-riders</span>
              </div>
            </div>

            {/* Route description / pickup notes */}
            <div className="form-group">
              <label className="form-label" htmlFor="commute-description">
                Route Notes / Pickup Details (Optional)
              </label>
              <textarea
                id="commute-description"
                rows="3"
                className="form-input textarea-input"
                placeholder="e.g. Leaving via Ring Road. Can stop near Metro Gate 2. AC on, please be on time!"
                value={routeDescription}
                onChange={(e) => setRouteDescription(e.target.value)}
              />
            </div>

            {/* Submit Actions */}
            <div className="form-actions-row">
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                <PlusCircle size={18} />
                <span>{isSubmitting ? 'Publishing Commute...' : 'Publish Commute'}</span>
              </button>

              <Link to="/driver/dashboard" className="btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
