import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { vehicleService } from '../services/api';
import { 
  Car, 
  User, 
  Route, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  AlertCircle,
  PlusCircle,
  Sparkles
} from 'lucide-react';

export const DriverDashboard = () => {
  const { user } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if driver has a vehicle registered
  useEffect(() => {
    const fetchVehicleStatus = async () => {
      try {
        const res = await vehicleService.getMyVehicle();
        if (res.data?.vehicle) {
          setVehicle(res.data.vehicle);
        }
      } catch (err) {
        console.warn('Vehicle check note:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleStatus();
  }, []);

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
          <Link to="/driver/vehicle" className="btn-primary">
            <Car size={16} />
            <span>{vehicle ? 'Update Vehicle' : 'Register Vehicle'}</span>
          </Link>
          <Link to="/profile" className="btn-secondary">
            <User size={16} />
            <span>My Profile</span>
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
              <p>Add your car, bike, or SUV details so passengers know what vehicle to look for.</p>
              <div className="stat-footer">
                <Link to="/driver/vehicle" className="text-link">
                  <PlusCircle size={15} />
                  <span>Add vehicle now</span>
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Placeholder: My Commutes (Future Sprint) */}
        <div className="card placeholder-card">
          <div className="placeholder-top">
            <div className="card-icon">
              <Route size={24} />
            </div>
            <span className="placeholder-tag">Coming in Sprint 2</span>
          </div>
          <h3>My Commutes</h3>
          <p>
            Publish your daily scheduled commutes (e.g. Home &harr; College/Office). 
            Specify departure times, empty seat count, and estimated fuel contributions.
          </p>
          <div className="placeholder-note">
            <Clock size={14} />
            <span>Route creation & seat availability will be unlocked in Sprint 2.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
