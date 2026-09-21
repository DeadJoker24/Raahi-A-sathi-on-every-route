import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Search, 
  Inbox, 
  ShieldCheck, 
  MapPin, 
  Clock, 
  Compass, 
  User,
  Info
} from 'lucide-react';

export const PassengerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-content">
          <div className="hero-role-pill passenger-pill">
            <Users size={16} />
            <span>Passenger Mode</span>
          </div>
          <h1>Passenger Hub</h1>
          <p>
            Welcome back, <strong>{user?.name}</strong>. Find everyday commuters already travelling 
            in your direction and share comfortable, cost-effective rides.
          </p>
        </div>

        <div className="dashboard-quick-actions">
          <Link to="/profile" className="btn-secondary">
            <User size={16} />
            <span>My Profile</span>
          </Link>
        </div>
      </div>

      {/* Info notice about platform philosophy */}
      <div className="platform-notice">
        <Info size={20} className="notice-icon" />
        <div className="notice-text">
          <strong>Route-Based Commute Sharing:</strong> Raahi connects you with verified drivers who are 
          already making the journey. No surge pricing, no commercial taxi dispatch — just shared seats and split costs.
        </div>
      </div>

      {/* Overview & Placeholder Grid */}
      <div className="dashboard-grid">
        {/* Status Card: Passenger Role */}
        <div className="card stat-card">
          <div className="stat-header">
            <span>Role Verification</span>
            <span className="role-badge badge-passenger">PASSENGER</span>
          </div>
          <h3>Verified Passenger Account</h3>
          <p>
            Your account is set up to explore shared routes and request empty seats along your route.
          </p>
          <div className="stat-footer">
            <ShieldCheck size={16} color="var(--passenger-color)" />
            <span>Account Active & Secured</span>
          </div>
        </div>

        {/* Placeholder: Find Commute (Future Sprint) */}
        <div className="card placeholder-card">
          <div className="placeholder-top">
            <div className="card-icon">
              <Search size={24} />
            </div>
            <span className="placeholder-tag">Coming in Sprint 2</span>
          </div>
          <h3>Find Commute</h3>
          <p>
            Search for drivers travelling along your specific corridor. Filter by start & destination points, 
            departure time windows, and nearby pickup points.
          </p>
          <div className="placeholder-note">
            <MapPin size={14} />
            <span>Route search and map matching will be introduced in Sprint 2.</span>
          </div>
        </div>

        {/* Placeholder: My Requests (Future Sprint) */}
        <div className="card placeholder-card">
          <div className="placeholder-top">
            <div className="card-icon">
              <Inbox size={24} />
            </div>
            <span className="placeholder-tag">Coming in Sprint 2</span>
          </div>
          <h3>My Requests</h3>
          <p>
            Track your ride requests, view driver acceptance statuses, seat reservation confirmations, 
            and commute details.
          </p>
          <div className="placeholder-note">
            <Clock size={14} />
            <span>Seat booking and request management will be unlocked in Sprint 2.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
