import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing.css';

function LandingPage() {
  const [currentFeature, setCurrentFeature] = useState(0);
  
  // Debug log to confirm component is loading
  console.log('LandingPage component loaded successfully!');
  
  const features = [
    {
      title: "Smart Room Management",
      description: "Efficiently manage room availability, pricing, and amenities with our intuitive dashboard.",
      icon: "🏨"
    },
    {
      title: "Real-time Booking System",
      description: "Handle reservations seamlessly with our advanced booking management system.",
      icon: "📅"
    },
    {
      title: "Analytics & Reports",
      description: "Get insights into occupancy rates, revenue, and guest preferences with detailed analytics.",
      icon: "📊"
    },
    {
      title: "Guest Experience",
      description: "Provide exceptional service with guest management tools and communication features.",
      icon: "👥"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Welcome to <span className="brand-name">WebProj</span>
            </h1>
            <p className="hero-subtitle">
              The ultimate hotel management system designed to streamline your operations 
              and enhance guest experiences.
            </p>
            <div className="hero-buttons">
              <Link to="/login" className="btn btn-primary">
                Get Started
              </Link>
              <Link to="/signup" className="btn btn-secondary">
                Create Account
              </Link>
            </div>
          </div>
          <div className="hero-visual">
            <div className="dashboard-preview">
              <div className="preview-header">
                <div className="preview-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="preview-title">WebProj Dashboard</div>
              </div>
              <div className="preview-content">
                <div className="preview-sidebar">
                  <div className="sidebar-item active"></div>
                  <div className="sidebar-item"></div>
                  <div className="sidebar-item"></div>
                  <div className="sidebar-item"></div>
                </div>
                <div className="preview-main">
                  <div className="preview-cards">
                    <div className="preview-card"></div>
                    <div className="preview-card"></div>
                    <div className="preview-card"></div>
                  </div>
                  <div className="preview-chart"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2>Powerful Features</h2>
            <p>Everything you need to manage your hotel efficiently</p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`feature-card ${currentFeature === index ? 'active' : ''}`}
                onMouseEnter={() => setCurrentFeature(index)}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits">
        <div className="container">
          <div className="benefits-content">
            <div className="benefits-text">
              <h2>Why Choose WebProj?</h2>
              <div className="benefit-list">
                <div className="benefit-item">
                  <div className="benefit-icon">⚡</div>
                  <div>
                    <h4>Lightning Fast</h4>
                    <p>Optimized performance for quick operations and real-time updates</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">🔒</div>
                  <div>
                    <h4>Secure & Reliable</h4>
                    <p>Enterprise-grade security with 99.9% uptime guarantee</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">📱</div>
                  <div>
                    <h4>Mobile Ready</h4>
                    <p>Access your hotel management system from anywhere, anytime</p>
                  </div>
                </div>
                <div className="benefit-item">
                  <div className="benefit-icon">🎯</div>
                  <div>
                    <h4>User Friendly</h4>
                    <p>Intuitive interface designed for hotel staff of all technical levels</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="benefits-visual">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">99.9%</div>
                  <div className="stat-label">Uptime</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">24/7</div>
                  <div className="stat-label">Support</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">1000+</div>
                  <div className="stat-label">Hotels</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">50+</div>
                  <div className="stat-label">Features</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Your Hotel Management?</h2>
            <p>Join thousands of hotels already using WebProj to streamline their operations</p>
            <div className="cta-buttons">
              <Link to="/signup" className="btn btn-primary btn-large">
                Start Free Trial
              </Link>
              <Link to="/login" className="btn btn-outline btn-large">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>WebProj</h3>
              <p>Modern hotel management made simple</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#demo">Demo</a>
              </div>
              <div className="footer-column">
                <h4>Support</h4>
                <a href="#help">Help Center</a>
                <a href="#contact">Contact</a>
                <a href="#docs">Documentation</a>
              </div>
              <div className="footer-column">
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#careers">Careers</a>
                <a href="#privacy">Privacy</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 WebProj. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
