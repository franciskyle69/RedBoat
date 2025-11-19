import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing.css';
import whiteLogo from '../assets/white-logo.png';
import amenitiesImage from '../assets/amenities.jpg';
import footerLogo from '../assets/footer-logo.png';

const RedboatLandingIndex: React.FC = () => {
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setCheckIn(today);
    setCheckOut(today);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 80);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
  };

  const handleScrollTop = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="landing-page">
      <header id="top" className={navScrolled ? 'nav-scrolled' : ''}>
        <nav className="main-navigation navbar navbar-expand-lg navbar-light">
          <div className="container">
            <Link className="navbar-brand" to="/">
              <img src={whiteLogo} alt="RedBoat" />
            </Link>
            <button
              className="navbar-toggler"
              type="button"
              onClick={() => setNavbarOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div
              className={`collapse navbar-collapse ${navbarOpen ? 'show' : ''}`}
              id="navbarNav"
            >
              <ul className="navbar-nav">
                <li className="nav-item">
                  <Link className="nav-link active" to="/">Home</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/about">About</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/rooms">Rooms</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/contact">Contact Us</Link>
                </li>
                <li className="nav-item">
                  <div style={{ marginTop: 5 }} className="white-button">
                    <Link to="/login">Login</Link>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </header>

      <div className="main-banner change-name">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="header-text">
                <h2>
                  Welcome to <em style={{ color: '#ff565b' }}>RedBoat</em>
                </h2>
                <h6 style={{ marginBottom: 10 }}>
                  The ultimate management system designed to streamline your
                  operations and enhance guest experiences.
                </h6>
                <div style={{ marginTop: 20 }} className="white-button">
                  <Link to="/login">Get Started</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="search-form">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <form id="search-form" role="search" onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-lg-3">
                    <label className="form-label">Choose Category</label>
                    <select className="form-select">
                      <option>Rooms</option>
                      <option>Captain Room</option>
                      <option>Chief Mate Room</option>
                      <option>Second Mate Room</option>
                      <option>Quartermaster Room</option>
                      <option>Bosun Room</option>
                      <option>AB Master Room</option>
                      <option>OS Room</option>
                    </select>
                  </div>
                  <div className="col-lg-3">
                    <label className="form-label">Extra Bed</label>
                    <select className="form-select">
                      <option>Choose category</option>
                      <option>Yes</option>
                      <option>No</option>
                    </select>
                  </div>
                  <div className="col-lg-3">
                    <label className="form-label">Check In</label>
                    <input
                      type="date"
                      value={checkIn}
                      min={checkIn}
                      onChange={e => {
                        setCheckIn(e.target.value);
                        if (checkOut < e.target.value) {
                          setCheckOut(e.target.value);
                        }
                      }}
                    />
                  </div>
                  <div className="col-lg-3">
                    <label className="form-label">Check Out</label>
                    <input
                      type="date"
                      value={checkOut}
                      min={checkIn}
                      onChange={e => setCheckOut(e.target.value)}
                    />
                  </div>
                  <div className="col-lg-12">
                    <button className="main-button">Check Availability</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <section className="about">
        <div className="container">
          <div className="row">
            <div className="col-md-5 img d-flex justify-content-center align-items-center">
              <img src={amenitiesImage} alt="RedBoat amenities" />
            </div>
            <div className="col-md-7 py-5 wrap-about pb-md-5">
              <div className="heading-section mb-4">
                <div className="section-heading">
                  <h2>WELCOME TO REDBOAT</h2>
                </div>
              </div>
              <p>
                Welcome to RedBoat Hotel, where comfort meets elegance and every stay
                feels like a getaway. Our hotel offers a range of modern amenities
                designed to make your visit relaxing and memorable.
              </p>
              <p>
                Enjoy air-conditioned rooms, hot and cold showers, and free Wi-Fi to
                stay connected. Unwind in front of your TV or treat yourself at our
                spa and facial services. Savor delicious meals at our restaurant and
                bar, or explore unique items at our gift shop and boutique.
              </p>
              <p>
                With a 24-hour front desk and dedicated security, your safety and
                convenience are always our priority. At RedBoat Hotel, we don’t just
                provide a room — we create an experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-us" id="contact">
        <div className="container">
          <div className="contact-card">
            <div className="row">
              <div className="col-lg-6 left-form">
              <form id="contact" onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-lg-12">
                    <div className="section-heading">
                      <h2>
                        Don't be Hesitated
                        <br />
                        <em>Talk to us</em> now!
                      </h2>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <input name="name" type="text" placeholder="First Name" />
                  </div>
                  <div className="col-lg-6">
                    <input name="last-name" type="text" placeholder="Last Name" />
                  </div>
                  <div className="col-lg-6">
                    <input name="email" type="email" placeholder="Your Email" />
                  </div>
                  <div className="col-lg-6">
                    <input name="subject" type="text" placeholder="Subject" />
                  </div>
                  <div className="col-lg-12">
                    <textarea
                      name="message"
                      className="form-control"
                      placeholder="Message"
                    />
                  </div>
                  <div className="col-lg-12">
                    <button type="submit" className="main-button">
                      Send Message
                    </button>
                  </div>
                </div>
              </form>
              </div>
              <div className="col-lg-6 right-map">
                <div id="map">
                  <iframe
                  title="RedBoat Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d246.84209051274445!2d125.12722954383311!3d8.154960957227201!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32ffab68687a2807%3A0x76be9ffdffe7594e!2sTeresa&#39;s%20Red%20Boat!5e0!3m2!1sen!2sph!4v1762873256523!5m2!1sen!2sph"
                  width="100%"
                  height="542"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="row">
            <div className="col-lg-4">
              <div className="about-widget">
                <img src={footerLogo} alt="RedBoat" />
                <p>Where Every Stay Sets Sail for Luxury.</p>
              </div>
            </div>
            <div className="col-lg-2 offset-lg-2">
              <div className="location-widget">
                <h4>Our Location</h4>
                <p>Moreno St. Barangay 4 Yabo BLDG, Malaybalay City</p>
              </div>
            </div>
            <div className="col-lg-2">
              <div className="contact-widget">
                <h4>Contact Us</h4>
                <p>
                  <a href="tel:+639366910133">+63 936 691 0133</a>
                </p>
                <p>
                  <a href="tel:+639386745358">+63 938 674 5358</a>
                </p>
              </div>
            </div>
            <div className="col-lg-2">
              <div className="follow-us">
                <h4>Follow Us</h4>
                <ul className="social-links">
                  <li>
                    <a href="https://www.facebook.com/share/1A18vuAmdU/">Facebook</a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-lg-12">
              <div className="sub-footer">
                <div className="row">
                  <div className="col-lg-6">
                    <p>Copyright by ©Alt+4F 2025.</p>
                  </div>
                  <div className="col-lg-6">
                    <a href="#top" className="scroll-to-top" onClick={handleScrollTop}>
                      Go to Top
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RedboatLandingIndex;
