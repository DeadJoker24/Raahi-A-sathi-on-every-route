import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService, vehicleService } from '../services/api';
import { 
  User, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  Car, 
  RefreshCw, 
  CheckCircle2,
  ArrowRight,
  PlusCircle
} from 'lucide-react';

export const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(authUser);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchProfileData = async () => {
    setLoading(true);
    setError('');
    try {
      const userRes = await userService.getCurrentUser();
      setProfile(userRes.data.user);

      // If user is driver, fetch their vehicle details as well
      if (userRes.data.user?.role === 'DRIVER') {
        const vehicleRes = await vehicleService.getMyVehicle();
        if (vehicleRes.data?.vehicle) {
          setVehicle(vehicleRes.data.vehicle);
        } else {
          setVehicle(null);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div>
          <h2>User Profile</h2>
          <p>Manage your verified commuter account credentials and preferences.</p>
        </div>
        <button onClick={fetchProfileData} className="btn-refresh" disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="profile-grid-layout">
        {/* Main User Profile Card */}
        <div className="profile-card">
          <div className="profile-avatar-row">
            <div className="avatar-circle">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="avatar-details">
              <h3>{profile?.name}</h3>
              <div className="profile-badge-row">
                <span className={`role-badge ${profile?.role === 'DRIVER' ? 'badge-driver' : 'badge-passenger'}`}>
                  {profile?.role}
                </span>
                <span className="verified-badge">
                  <ShieldCheck size={14} />
                  <span>Verified Commuter</span>
                </span>
              </div>
            </div>
          </div>

          <div className="profile-details-grid">
            <div className="detail-item">
              <div className="detail-label">
                <Mail size={16} />
                <span>Email Address</span>
              </div>
              <div className="detail-value">{profile?.email}</div>
            </div>

            <div className="detail-item">
              <div className="detail-label">
                <ShieldCheck size={16} />
                <span>Role Type</span>
              </div>
              <div className="detail-value">{profile?.role}</div>
            </div>

            <div className="detail-item">
              <div className="detail-label">
                <Calendar size={16} />
                <span>Account Created</span>
              </div>
              <div className="detail-value">{formatDate(profile?.createdAt)}</div>
            </div>
          </div>
        </div>

        {/* Driver Vehicle Snapshot Card (Only for DRIVER) */}
        {profile?.role === 'DRIVER' && (
          <div className="card vehicle-profile-card">
            <div className="stat-header">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Car size={16} color="var(--primary)" />
                <strong>Linked Vehicle</strong>
              </span>
              <span className="role-badge badge-driver">DRIVER ASSET</span>
            </div>

            {vehicle ? (
              <div className="vehicle-profile-content">
                <h4 className="vehicle-profile-name">{vehicle.vehicle_model}</h4>
                <div className="vehicle-profile-tags">
                  <span className="type-tag">{vehicle.vehicle_type}</span>
                  <span className="plate-tag">{vehicle.registration_number}</span>
                </div>
                <div style={{ marginTop: '1.25rem' }}>
                  <Link to="/driver/vehicle" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                    <span>Manage Vehicle</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="no-vehicle-box">
                <p>No vehicle registered yet.</p>
                <Link to="/driver/vehicle" className="btn-primary" style={{ marginTop: '0.75rem', width: '100%', justifyContent: 'center' }}>
                  <PlusCircle size={16} />
                  <span>Register Vehicle</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
