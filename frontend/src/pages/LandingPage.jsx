import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Car, Users, Route, ShieldCheck, ArrowRight, Compass } from 'lucide-react';

export const LandingPage = () => {
  const { isAuthenticated, user } = useAuth();
  const dashboardUrl = user?.role === 'DRIVER' ? '/driver/dashboard' : '/passenger/dashboard';

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-badge">
          <Route size={16} />
          <span>Route-Based Commute Sharing</span>
        </div>
        
        <h1 className="hero-title">
          A <span className="highlight-text">Saathi</span> on Every Route
        </h1>
        
        <p className="hero-description">
          Raahi isn't an on-demand cab service. We connect everyday commuters who are 
          <strong> already travelling</strong> from Point A to Point B with co-travellers along the same route, 
          making daily travel affordable, sustainable, and communal.
        </p>

        <div className="hero-cta">
          {isAuthenticated ? (
            <Link to={dashboardUrl} className="btn-cta-primary">
              Go to Your Dashboard <ArrowRight size={18} />
            </Link>
          ) : (
            <div className="cta-group">
              <Link to="/register" className="btn-cta-primary">
                Get Started Now <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-cta-secondary">
                Sign In
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Core Concept Grid */}
      <section className="features-grid">
        <div className="feature-card">
          <div className="feature-icon bg-blue">
            <Car size={24} />
          </div>
          <h3>For Drivers</h3>
          <p>
            Already driving to work, college, or hometown with empty seats? Offer your route, 
            cover fuel costs, and make your daily commute collaborative.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon bg-emerald">
            <Users size={24} />
          </div>
          <h3>For Passengers</h3>
          <p>
            Travelling along the same corridor? Skip expensive surge pricing and crowded transit 
            by sharing a comfortable seat with a verified commuter.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon bg-purple">
            <ShieldCheck size={24} />
          </div>
          <h3>Verified & Safe</h3>
          <p>
            Role-based verification, secure credential management with bcrypt & JWT, and 
            future proximity-based route matching.
          </p>
        </div>
      </section>

      {/* Sprint 1 Scope Banner */}
      <div className="sprint-banner">
        <strong>Sprint 1 Foundation:</strong> Secure user authentication, role management (Driver vs Passenger), and driver vehicle registration.
      </div>
    </div>
  );
};
