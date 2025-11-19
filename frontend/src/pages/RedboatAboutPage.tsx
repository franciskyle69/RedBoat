import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing.css';
import whiteLogo from '../assets/white-logo.png';
import aboutImage from '../assets/about.jpg';

type Testimonial = {
  name: string;
  role: string;
  text: string;
  rating: number;
};

const RedboatAboutPage: React.FC = () => {
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);

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
  const accordionItems = [
    {
      id: 'room-services',
      title: 'Room Services',
      content:
        'Experience 24/7 room service with a wide selection of local and international dishes prepared by our in-house chefs. We are committed to bringing comfort right to your door.',
    },
    {
      id: 'hotel-amenities',
      title: 'Hotel Amenities',
      content:
        'RedBoat Hotel offers a range of amenities — including a relaxing spa, secure parking, and high-speed Wi-Fi — ensuring your stay is as enjoyable as possible.',
    },
    {
      id: 'events-functions',
      title: 'Events & Functions',
      content:
        'Host your meetings, celebrations, and gatherings in our elegant function rooms. Our team ensures every detail — from catering to decoration — is perfectly arranged.',
    },
  ];

  const [activeAccordion, setActiveAccordion] = useState<string | null>(accordionItems[0].id);

  const testimonials: Testimonial[] = [
    {
      name: 'Catherine Rose',
      role: 'Guest',
      text: 'I stayed at RedBoat Hotel for a business trip and the experience was excellent! The staff were attentive, the rooms were spotless, and I loved the cozy ambiance.',
      rating: 5,
    },
    {
      name: 'Sophia Loren',
      role: 'Guest',
      text: 'Our family weekend getaway was perfect! The kids loved the pool and the breakfast buffet was delicious. We will definitely come back!',
      rating: 5,
    },
    {
      name: 'Isabella Marbel',
      role: 'Guest',
      text: 'The atmosphere was romantic and peaceful. The front desk helped us plan our city tour and the room view was stunning. Highly recommend RedBoat Hotel!',
      rating: 4,
    },
  ];

  const slides: Testimonial[][] = [];
  for (let i = 0; i < testimonials.length; i += 2) {
    slides.push(testimonials.slice(i, i + 2));
  }

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const visibleTestimonials: Testimonial[] = slides[currentSlide] ?? testimonials;

  const handleAccordionClick = (id: string) => {
    setActiveAccordion((prev) => (prev === id ? null : id));
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
                  <Link className="nav-link" to="/">Home</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link active" to="/about">About</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/rooms">Rooms</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/contact">Contact Us</Link>
                </li>
                <li className="nav-item">
                  <div className="white-button">
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
                  <em>About</em> RedBoat
                </h2>
                <p>Where every stay sets sail for comfort and luxury.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="services">
        <div className="container">
          <div className="row">
            <div className="col-lg-4">
              <div className="service-item">
                <h4>Comfortable Room Booking</h4>
                <p>Book from a variety of cozy, air-conditioned rooms.</p>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="service-item">
                <h4>In-House Restaurant</h4>
                <p>
                  Enjoy local and international cuisines served fresh at our restaurant
                  and bar.
                </p>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="service-item">
                <h4>24/7 Front Desk Support</h4>
                <p>
                  Our friendly staff is always ready to assist you anytime, day or
                  night.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>


      <section className="interior-design">
        <div className="container expanded">
          <div className="row">
            <div className="col-lg-6">
              <div className="section-heading">
                <h2>
                  A Hotel that Specializes
                  <br />
                  <em>In Comfort &amp; Luxury</em>.
                </h2>
              </div>
              <div className="left-image">
                <img src={aboutImage} alt="RedBoat interior" />
              </div>
            </div>
            <div className="col-lg-6 align-self-center">
              <div className="right-content">
                <p>
                  RedBoat Hotel is your gateway to comfort, convenience, and
                  relaxation. We take pride in offering first-class services that make
                  every stay unforgettable.
                  <br />
                  <br />
                  Enjoy modern, air-conditioned rooms, an in-house restaurant and bar,
                  free Wi-Fi, and 24-hour front desk assistance — all designed to meet
                  your every need during your stay.
                </p>

                <div className="accordion" id="accordionExample">
                  <h4>How We Serve You</h4>
                  {accordionItems.map((item) => (
                    <div key={item.id} className="accordion-item">
                      <h2 className="accordion-header" id={`heading-${item.id}`}>
                        <button
                          className={`accordion-button ${
                            activeAccordion === item.id ? '' : 'collapsed'
                          }`}
                          type="button"
                          onClick={() => handleAccordionClick(item.id)}
                          aria-expanded={activeAccordion === item.id}
                          aria-controls={`collapse-${item.id}`}
                        >
                          {item.title}
                        </button>
                      </h2>
                      <div
                        id={`collapse-${item.id}`}
                        className={`accordion-collapse collapse ${
                          activeAccordion === item.id ? 'show' : ''
                        }`}
                        aria-labelledby={`heading-${item.id}`}
                      >
                        <div className="accordion-body">
                          <p>{item.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="what-they-say">
        <div className="container expanded">
          <div className="row">
            <div className="col-lg-12">
              <div className="testimonials">
                <div className="row">
                  <div className="col-lg-7">
                    <div className="carousel">
                      {visibleTestimonials.map((t, index) => (
                        <div key={t.name + index} className="item testimonial-item">
                          <div className="icon">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="44"
                              height="44"
                              fill="currentColor"
                              className="bi bi-chat-quote"
                              viewBox="0 0 16 16"
                            >
                              <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z" />
                              <path d="M7.066 6.76A1.665 1.665 0 0 0 4 7.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 0 0 .6.58c1.486-1.54 1.293-3.214.682-4.112zm4 0A1.665 1.665 0 0 0 8 7.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 0 0 .6.58c1.486-1.54 1.293-3.214.682-4.112z" />
                            </svg>
                          </div>
                          <h4>{t.name}</h4>
                          <span>{t.role}</span>
                          <ul>
                            {Array.from({ length: t.rating }).map((_, starIndex) => (
                              <li key={starIndex}>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  fill="#ff565b"
                                  className="bi bi-star-fill"
                                  viewBox="0 0 16 16"
                                >
                                  <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                </svg>
                              </li>
                            ))}
                          </ul>
                          <p>{t.text}</p>
                        </div>
                      ))}
                      {slides.length > 1 && (
                        <div className="carousel-indicators">
                          {slides.map((_, index) => (
                            <button
                              key={index}
                              type="button"
                              className={index === currentSlide ? 'active' : ''}
                              onClick={() => setCurrentSlide(index)}
                              aria-label={`Show testimonials slide ${index + 1}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
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
                <p><a href="tel:+639366910133">+63 936 691 0133</a></p>
                <p><a href="tel:+639386745358">+63 938 674 5358</a></p>
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

export default RedboatAboutPage;
