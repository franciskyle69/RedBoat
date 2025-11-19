import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing.css';

const RedboatContactPage: React.FC = () => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
  };

  const handleScrollTop = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="landing-page">
      <header id="top">
        <nav className="main-navigation navbar navbar-expand-lg navbar-light">
          <div className="container">
            <Link className="navbar-brand" to="/">
              <img src="/white-logo.png" alt="RedBoat" />
            </Link>
            <button
              className="navbar-toggler"
              type="button"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse show" id="navbarNav">
              <ul className="navbar-nav">
                <li className="nav-item">
                  <Link className="nav-link" to="/">Home</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/about">About</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/rooms">Rooms</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link active" to="/contact">Contact Us</Link>
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

      <div className="page-banner change-name">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 offset-lg-3">
              <div className="header-text">
                <h2>
                  <em>Contact</em> Us
                </h2>
                <p>
                  RedBoat Hotel, offering a comfortable and relaxing stay with exceptional
                  amenities and service for all our guests.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="contact-page-map">
        <div className="container expanded">
          <div className="row">
            <div className="col-lg-12">
              <div id="map">
                <iframe
                  title="RedBoat Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d246.84209051274445!2d125.12722954383311!3d8.154960957227201!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32ffab68687a2807%3A0x76be9ffdffe7594e!2sTeresa&#39;s%20Red%20Boat!5e0!3m2!1sen!2sph!4v1762873256523!5m2!1sen!2sph"
                  width="100%"
                  height="550"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: 15 }} className="contact-us-page">
        <div className="container">
          <div className="col-lg-12">
            <div className="contact-page-form">
              <div className="row">
                <div className="col-lg-6 align-self-center">
                  <form id="contact" onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-lg-12">
                        <div className="section-heading">
                          <h2>
                            Don't be Hesitated
                            <br />
                            <em>Send a message now</em>!
                          </h2>
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <input name="first-name" type="text" placeholder="First Name*" />
                      </div>
                      <div className="col-lg-6">
                        <input name="last-name" type="text" placeholder="Last Name*" />
                      </div>
                      <div className="col-lg-6">
                        <input name="email" type="email" placeholder="Your Email" />
                      </div>
                      <div className="col-lg-6">
                        <input name="subject" type="text" placeholder="Subject*" />
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
                <div className="col-lg-6">
                  <div className="right-info">
                    <ul>
                      <li>
                        <h6>Mailing Address</h6>
                        <span>Moreno St. Barangay 4 Yabo BLDG, Malaybalay City</span>
                      </li>
                      <li>
                        <h6>Email Address</h6>
                        <span>contact@company.com</span>
                      </li>
                      <li>
                        <h6>Chat With Us</h6>
                        <span>chat@company.com</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="call-to-action">
        <div className="container">
          <div className="row">
            <div className="col-lg-8">
              <h2>Ready to Book Your Stay?</h2>
            </div>
            <div className="col-lg-4">
              <div className="white-button">
                <Link to="/contact">Contact Us Now</Link>
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
                <img src="/redboat/images/footer-logo.png" alt="RedBoat" />
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
                    <p>COPYRIGHT BY ©Alt+4F 2025.</p>
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

export default RedboatContactPage;
