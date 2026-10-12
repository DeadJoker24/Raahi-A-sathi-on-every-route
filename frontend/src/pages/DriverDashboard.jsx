import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { vehicleService, commuteService } from '../services/api';
import { 
  Car, 
  User, 
  Route, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  AlertCircle,
  PlusCircle,
  Calendar,
  IndianRupee,
  Users
} from 'lucide-react';

export const DriverDashboard = () => {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [upcomingCommutes, setUpcomingCommutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch vehicle status
        const vRes = await vehicleService.getMyVehicle();
        if (vRes.data?.vehicle) {
          setVehicle(vRes.data.vehicle);
        }

        // Fetch driver's scheduled commutes
        const cRes = await commuteService.getMyCommutes('SCHEDULED');
        if (cRes.data?.commutes) {
          // Filter to only future departures
          const futureOnes = cRes.data.commutes.filter(
            c => new Date(c.departure_datetime) > new Date()
          );
          setUpcomingCommutes(futureOnes);
        }
      } catch (err) {
        console.warn('Dashboard data fetch note:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const nextCommute = upcomingCommutes.length > 0 ? upcomingCommutes[0] : null;

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-content">
          <div className="hero-role-pill driver-pill">
            <Car size={16} />
            <span>Driver Mode</span>
          </div>
          <h1>Driver Hub</h1>
          <p>
            Welcome back, <strong>{user?.name}</strong>. Share empty seats along your regular commute 
            and offset travel expenses with co-passengers.
          </p>
        </div>

        <div className="dashboard-quick-actions">
          <Link to="/driver/commutes/new" className="btn-primary">
            <PlusCircle size={16} />
            <span>Publish Commute</span>
          </Link>
          <Link to="/driver/commutes" className="btn-secondary">
            <Route size={16} />
            <span>My Commutes</span>
          </Link>
          <Link to="/driver/vehicle" className="btn-secondary">
            <Car size={16} />
            <span>{vehicle ? 'My Vehicle' : 'Add Vehicle'}</span>
          </Link>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div className="dashboard-grid">
        {/* Status Card: Driver Role */}
        <div className="card stat-card">
          <div className="stat-header">
            <span>Role Verification</span>
            <span className="role-badge badge-driver">DRIVER</span>
          </div>
          <h3>Verified Driver Account</h3>
          <p>
            Your account is authorized to offer rides and list vehicle details.
          </p>
          <div className="stat-footer">
            <ShieldCheck size={16} color="var(--primary)" />
            <span>Account Active & Secured</span>
          </div>
        </div>

        {/* Status Card: Vehicle Overview */}
        <div className="card stat-card">
          <div className="stat-header">
            <span>Vehicle Status</span>
            <span className="role-badge badge-driver">
              {vehicle ? 'REGISTERED' : 'ACTION REQUIRED'}
            </span>
          </div>
          {vehicle ? (
            <>
              <h3>{vehicle.vehicle_model}</h3>
              <p>Type: <strong>{vehicle.vehicle_type}</strong> | Plate: <code>{vehicle.registration_number}</code></p>
              <div className="stat-footer">
                <Link to="/driver/vehicle" className="text-link">Manage details &rarr;</Link>
              </div>
            </>
          ) : (
            <>
              <h3>No Vehicle Linked Yet</h3>
              <p>Add your vehicle details so you can start publishing commutes.</p>
              <div className="stat-footer">
                <Link to="/driver/vehicle" className="text-link">
                  <PlusCircle size={15} />
                  <span>Add vehicle now</span>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Active Commutes Overview Card (Sprint 2 Live Component) */}
        <div className="card stat-card" style={{ gridColumn: 'span 1' }}>
          <div className="stat-header">
            <span>Active Commutes</span>
            <span className="role-badge badge-driver">
              {upcomingCommutes.length} SCHEDULED
            </span>
          </div>

          {nextCommute ? (
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Next Upcoming Journey
              </span>
              <h3 style={{ fontSize: '1.15rem', marginTop: '0.2rem', marginBottom: '0.5rem' }}>
                {nextCommute.origin} &rarr; {nextCommute.destination}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={14} />
                  <span>{formatDate(nextCommute.departure_datetime)}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={14} />
                  <span>{nextCommute.available_seats} of {nextCommute.total_seats} seats free</span>
                  <span>&bull;</span>
                  <span>₹{parseFloat(nextCommute.price_per_seat).toFixed(0)} / seat</span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h3>No Upcoming Commutes</h3>
              <p>
                Heading somewhere today or this week? Publish your route to share seats and split fuel costs.
              </p>
            </div>
          )}

          <div className="stat-footer" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Link to="/driver/commutes" className="text-link">
              View all ({upcomingCommutes.length}) &rarr;
            </Link>
            <Link to="/driver/commutes/new" className="text-link">
              + Publish new
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
