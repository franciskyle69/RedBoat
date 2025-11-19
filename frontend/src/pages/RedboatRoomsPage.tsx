import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing.css';

const RedboatRoomsPage: React.FC = () => {
  const rooms = [
    {
      name: 'Balcony Room',
      price: '₱1,800',
      size: '45 m2',
      beds: '1',
      image: '/redboat/images/balcony.jpg',
    },
    {
      name: 'Captain Room',
      price: '₱1,800',
      size: '45 m2',
      beds: '1',
      image: '/redboat/images/captain.jpg',
    },
    {
      name: 'Chief Mate Room',
      price: '₱1,500',
      size: '45 m2',
      beds: '2',
      image: '/redboat/images/chief.jpg',
    },
    {
      name: 'Second Mate Room',
      price: '₱1,500',
      size: '45 m2',
      beds: '2',
      image: '/redboat/images/second.jpg',
    },
    {
      name: 'Quartermaster Room',
      price: '₱1,000',
      size: '45 m2',
      beds: '3',
      image: '/redboat/images/quarter.jpg',
    },
    {
      name: 'Bosun Room',
      price: '₱1,000',
      size: '45 m2',
      beds: '2',
      image: '/redboat/images/bosun.jpg',
    },
    {
      name: 'AB Master Room',
      price: '₱1,000',
      size: '45 m2',
      beds: '2',
      image: '/redboat/images/ab.jpg',
    },
    {
      name: 'OS Room',
      price: '₱1,000',
      size: '45 m2',
      beds: '2',
      image: '/redboat/images/os.jpg',
    },
  ];

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
                  <Link className="nav-link active" to="/rooms">Rooms</Link>
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

      <div className="page-banner change-name">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 offset-lg-3">
              <div className="header-text">
                <h2>
                  <em>Our</em> Rooms & Rates
                </h2>
                <p>Discover our comfortable and well-appointed rooms for every traveler.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="rooms-section">
        <div className="container">
          <div className="row">
            {rooms.map(room => (
              <div key={room.name} className="col-lg-4 col-md-6">
                <div className="room">
                  <div
                    className="img"
                    style={{ backgroundImage: `url('${room.image}')` }}
                  />
                  <div className="text p-3 text-center">
                    <h3 className="mb-3">{room.name}</h3>
                    <hr />
                    <p>
                      <span className="price mr-2">{room.price}</span>{' '}
                      <span className="per">per night</span>
                    </p>
                    <ul className="list">
                      <li>
                        <span>Size:</span> {room.size}
                      </li>
                      <li>
                        <span>Bed:</span> {room.beds}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ))}
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
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RedboatRoomsPage;
