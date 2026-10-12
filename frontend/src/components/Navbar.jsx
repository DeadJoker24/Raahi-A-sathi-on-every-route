import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navigation, LogOut, User, Car, Compass, Route } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const dashboardUrl = user?.role === 'DRIVER' ? '/driver/dashboard' : '/passenger/dashboard';

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <Compass size={22} color="#ffffff" />
          </div>
          <div className="brand-text">
            <span className="brand-title">Raahi</span>
            <span className="brand-subtitle">A saathi on every route</span>
          </div>
        </Link>

        <nav className="navbar-links">
          {isAuthenticated ? (
            <>
              <Link to={dashboardUrl} className="nav-link">
                Dashboard
              </Link>

              {user?.role === 'DRIVER' && (
                <>
                  <Link to="/driver/commutes" className="nav-link">
                    <Route size={16} />
                    <span>My Commutes</span>
                  </Link>
                  <Link to="/driver/vehicle" className="nav-link">
                    <Car size={16} />
                    <span>My Vehicle</span>
                  </Link>
                </>
              )}
              
              <Link to="/profile" className="nav-link">
                <User size={16} />
                <span>Profile</span>
              </Link>

              <div className="user-badge-container">
                <span className={`role-badge ${user?.role === 'DRIVER' ? 'badge-driver' : 'badge-passenger'}`}>
                  {user?.role}
                </span>
                <span className="user-name">{user?.name}</span>
              </div>

              <button onClick={handleLogout} className="btn-logout" title="Log Out">
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-secondary">
                Log In
              </Link>
              <Link to="/register" className="btn-primary">
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
