import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bed, UtensilsCrossed, Headphones, ChevronDown, Star, MapPin, Phone, Facebook } from 'lucide-react';
import '../styles/landing.css';
import whiteLogo from '../assets/white-logo.png';
import amenitiesImage from '../assets/amenities.jpg';
import aboutImage from '../assets/about.jpg';
import footerLogo from '../assets/footer-logo.png';
import StarRating from '../components/StarRating';
import ThemeToggle from '../components/ThemeToggle';

interface LandingRoom {
  _id: string;
  roomNumber: string;
  roomType: string;
  price: number;
  capacity: number;
  images?: string[];
  description?: string;
  amenities?: string[];
  averageRating?: number;
  reviewCount?: number;
}

type Testimonial = {
  name: string;
  role: string;
  text: string;
  rating: number;
};

const RedboatLandingPage: React.FC = () => {
  const location = useLocation();
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  
  // Rooms state
  const [rooms, setRooms] = useState<LandingRoom[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState<string | null>(null);

  // About accordion state
  const accordionItems = [
    {
      id: 'room-services',
      title: 'Room Services',
      content: 'Experience 24/7 room service with a wide selection of local and international dishes prepared by our in-house chefs.',
    },
    {
      id: 'hotel-amenities',
      title: 'Hotel Amenities',
      content: 'RedBoat Hotel offers a range of amenities — including a relaxing spa, secure parking, and high-speed Wi-Fi.',
    },
    {
      id: 'events-functions',
      title: 'Events & Functions',
      content: 'Host your meetings, celebrations, and gatherings in our elegant function rooms with full catering support.',
    },
  ];
  const [activeAccordion, setActiveAccordion] = useState<string | null>(accordionItems[0].id);

  // Testimonials
  const testimonials: Testimonial[] = [
    {
      name: 'Catherine Rose',
      role: 'Guest',
      text: 'I stayed at RedBoat Hotel for a business trip and the experience was excellent! The staff were attentive and rooms were spotless.',
      rating: 5,
    },
    {
      name: 'Sophia Loren',
      role: 'Guest',
      text: 'Our family weekend getaway was perfect! The kids loved the pool and the breakfast buffet was delicious.',
      rating: 5,
    },
    {
      name: 'Isabella Marbel',
      role: 'Guest',
      text: 'The atmosphere was romantic and peaceful. The front desk helped us plan our city tour. Highly recommend!',
      rating: 4,
    },
  ];

  // Auto-scroll to section based on route path
  useEffect(() => {
    const pathToSection: Record<string, string> = {
      '/about': 'about',
      '/rooms': 'rooms',
      '/contact': 'contact',
    };
    
    const targetSection = pathToSection[location.pathname];
    if (targetSection) {
      setTimeout(() => {
        const element = document.getElementById(targetSection);
        if (element) {
          const headerOffset = 80;
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [location.pathname]);

  // Scroll handling
  useEffect(() => {
    const handleScroll = () => {
      setNavScrolled(window.scrollY > 80);

      const sections = ['home', 'about', 'rooms', 'contact'];
      for (const section of sections.reverse()) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load rooms
  useEffect(() => {
    const loadRooms = async () => {
      try {
        setRoomsError(null);
        const res = await fetch('http://localhost:5000/rooms');
        if (!res.ok) throw new Error('Failed to load rooms');
        const json = await res.json();
        setRooms(json.data || []);
      } catch (err) {
        console.error('Error loading rooms:', err);
        setRoomsError('Unable to load rooms right now.');
      } finally {
        setLoadingRooms(false);
      }
    };
    loadRooms();
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    setNavbarOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const getRoomImage = (room: LandingRoom) => {
    const src = room.images && room.images[0];
    if (!src) return '/room-placeholder.jpg';
    if (src.startsWith('http://') || src.startsWith('https://')) return src;
    if (src.startsWith('/uploads') || src.startsWith('uploads/')) {
      const normalized = src.startsWith('/') ? src : `/${src}`;
      return `http://localhost:5000${normalized}`;
    }
    return src;
  };

  const getRoomTypeColor = (roomType: string) => {
    switch (roomType) {
      case 'Standard': return '#10b981';
      case 'Deluxe': return '#3b82f6';
      case 'Suite': return '#8b5cf6';
      case 'Presidential': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  // Format price with comma separators for consistency
  const formatPrice = (price: number) => {
    return price.toLocaleString('en-PH');
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <header id="top" className={navScrolled ? 'nav-scrolled' : ''}>
        <nav className="main-navigation navbar navbar-expand-lg navbar-light">
          <div className="container">
            <a className="navbar-brand" href="#home" onClick={(e) => scrollToSection(e, 'home')}>
              <img src={whiteLogo} alt="RedBoat" />
            </a>
            <button
              className="navbar-toggler"
              type="button"
              onClick={() => setNavbarOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className={`collapse navbar-collapse ${navbarOpen ? 'show' : ''}`}>
              <ul className="navbar-nav">
                <li className="nav-item">
                  <a 
                    className={`nav-link ${activeSection === 'home' ? 'active' : ''}`} 
                    href="#home"
                    onClick={(e) => scrollToSection(e, 'home')}
                  >
                    Home
                  </a>
                </li>
                <li className="nav-item">
                  <a 
                    className={`nav-link ${activeSection === 'about' ? 'active' : ''}`} 
                    href="#about"
                    onClick={(e) => scrollToSection(e, 'about')}
                  >
                    About
                  </a>
                </li>
                <li className="nav-item">
                  <a 
                    className={`nav-link ${activeSection === 'rooms' ? 'active' : ''}`} 
                    href="#rooms"
                    onClick={(e) => scrollToSection(e, 'rooms')}
                  >
                    Rooms
                  </a>
                </li>
                <li className="nav-item">
                  <a 
                    className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`} 
                    href="#contact"
                    onClick={(e) => scrollToSection(e, 'contact')}
                  >
                    Contact Us
                  </a>
                </li>
                <li className="nav-item">
                  <div style={{ marginTop: 5 }} className="white-button">
                    <Link to="/login">Login</Link>
                  </div>
                </li>
                <li className="nav-item" style={{ marginLeft: 8 }}>
                  <ThemeToggle />
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="home" className="main-banner change-name">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="header-text">
                <h6>✨ Premium Hotel Experience</h6>
                <h2>
                  Welcome to <em>RedBoat</em>
                </h2>
                <p style={{ maxWidth: 650, margin: '0 auto 30px', fontSize: 18, lineHeight: 1.7, color: 'rgba(255,255,255,0.85)' }}>
                  Where luxury meets comfort. Experience world-class hospitality 
                  with stunning views, exceptional service, and unforgettable memories.
                </p>
                <div style={{ marginTop: 30, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <div className="white-button">
                    <Link to="/login">Book Your Stay</Link>
                  </div>
                  <a 
                    href="#rooms" 
                    onClick={(e) => scrollToSection(e, 'rooms')}
                    style={{
                      padding: '16px 40px',
                      fontSize: 16,
                      fontWeight: 600,
                      borderRadius: 50,
                      background: 'transparent',
                      border: '2px solid rgba(255,255,255,0.5)',
                      color: '#fff',
                      textDecoration: 'none',
                      transition: 'all 0.3s ease',
                      display: 'inline-block'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                      e.currentTarget.style.borderColor = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)';
                    }}
                  >
                    Explore Rooms
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Scroll Indicator */}
        <div className="scroll-indicator" onClick={(e) => scrollToSection(e as any, 'about')}>
          <ChevronDown size={32} style={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }} />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about" style={{ paddingTop: 80 }}>
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
                spa and facial services.
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="container" style={{ marginTop: 80 }}>
          <div className="section-heading" style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2>
              Thoughtfully Curated <em>Hotel Experience</em>
            </h2>
            <p style={{ maxWidth: 600, margin: '15px auto 0' }}>
              Every detail is designed to make your stay exceptional
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="icon">
                <Bed size={48} strokeWidth={1.5} />
              </div>
              <h3>Comfortable Room Booking</h3>
              <p>Choose from a variety of modern, air-conditioned rooms tailored for solo travelers, couples, and families.</p>
            </div>
            <div className="feature-card">
              <div className="icon">
                <UtensilsCrossed size={48} strokeWidth={1.5} />
              </div>
              <h3>In-House Restaurant & Bar</h3>
              <p>Enjoy freshly prepared local and international dishes without leaving the hotel, any time of the day.</p>
            </div>
            <div className="feature-card">
              <div className="icon">
                <Headphones size={48} strokeWidth={1.5} />
              </div>
              <h3>24/7 Front Desk Support</h3>
              <p>Our friendly team is always available to assist with check-ins, inquiries, and personalized recommendations.</p>
            </div>
          </div>
        </div>

        {/* Interior Design Section */}
        <div className="container expanded" style={{ marginTop: 80 }}>
          <div className="row">
            <div className="col-lg-6">
              <div className="section-heading">
                <h2>
                  A Hotel that Specializes<br />
                  <em>In Comfort & Luxury</em>.
                </h2>
              </div>
              <div className="left-image">
                <img src={aboutImage} alt="RedBoat interior" />
              </div>
            </div>
            <div className="col-lg-6 align-self-center">
              <div className="right-content">
                <p>
                  RedBoat Hotel is your gateway to comfort, convenience, and relaxation.
                  We take pride in offering first-class services that make every stay unforgettable.
                </p>
                <div className="accordion" id="accordionExample">
                  <h4>How We Serve You</h4>
                  {accordionItems.map((item) => (
                    <div key={item.id} className="accordion-item">
                      <h2 className="accordion-header">
                        <button
                          className={`accordion-button ${activeAccordion === item.id ? '' : 'collapsed'}`}
                          type="button"
                          onClick={() => setActiveAccordion(prev => prev === item.id ? null : item.id)}
                        >
                          {item.title}
                        </button>
                      </h2>
                      <div className={`accordion-collapse collapse ${activeAccordion === item.id ? 'show' : ''}`}>
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

        {/* Testimonials */}
        <div className="container expanded" style={{ marginTop: 80 }}>
          <div className="section-heading" style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2>What Our <em>Guests Say</em></h2>
          </div>
          <div className="testimonials">
            <div className="carousel" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
              {testimonials.map((t, index) => (
                <div key={t.name + index} className="item testimonial-item" style={{ flex: '1 1 300px', maxWidth: 400 }}>
                  <div className="icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z" />
                    </svg>
                  </div>
                  <h4>{t.name}</h4>
                  <span>{t.role}</span>
                  <ul style={{ display: 'flex', gap: 4, listStyle: 'none', padding: 0, margin: '8px 0' }}>
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <li key={i}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="#ff565b" viewBox="0 0 16 16">
                          <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                        </svg>
                      </li>
                    ))}
                  </ul>
                  <p>{t.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Rooms Section */}
      <section id="rooms" className="rooms-section" style={{ paddingTop: 80, paddingBottom: 60 }}>
        <div className="container">
          <div className="section-heading" style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2><em>Our</em> Rooms & Rates</h2>
            <p>Discover our comfortable and well-appointed rooms for every traveler.</p>
          </div>

          {loadingRooms ? (
            <div className="text-center py-5">
              <p>Loading rooms...</p>
            </div>
          ) : roomsError ? (
            <div className="text-center py-5">
              <p>{roomsError}</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-5">
              <p>No rooms are available at the moment.</p>
            </div>
          ) : (
            <div className="rooms-grid">
              {rooms.map((room) => (
                <div key={room._id} className="room-card">
                  <div className="room-header">
                    <div className="room-number">Room {room.roomNumber}</div>
                    <div
                      className="room-type-badge"
                      style={{ backgroundColor: getRoomTypeColor(room.roomType) }}
                    >
                      {room.roomType}
                    </div>
                  </div>

                  <div className="room-images-strip" style={{ width: '100%', marginBottom: '12px' }}>
                    <img
                      src={getRoomImage(room)}
                      alt={`Room ${room.roomNumber}`}
                      style={{
                        width: '100%',
                        height: 220,
                        borderRadius: '10px 10px 0 0',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>

                  <div className="room-details">
                    <div className="room-price">₱{formatPrice(room.price)}/night</div>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: 4, marginBottom: 4 }}>
                      <StarRating rating={room.averageRating ?? 0} readonly size="small" />
                      <span style={{ marginLeft: 8, fontSize: 14, color: '#6b7280' }}>
                        {room.reviewCount ?? 0} review{(room.reviewCount ?? 0) === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="room-capacity">Up to {room.capacity} guests</div>
                    {room.description && (
                      <div className="room-description">{room.description}</div>
                    )}
                    {room.amenities && room.amenities.length > 0 && (
                      <div className="room-amenities">
                        <h4>Amenities:</h4>
                        <div className="amenities-list">
                          {room.amenities.map((amenity, index) => (
                            <span key={index} className="amenity-tag">{amenity}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link to="/login" className="book-room-btn">
                    Book This Room
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-us" style={{ paddingTop: 80 }}>
        <div className="container">
          <div className="contact-card">
            <div className="row">
              <div className="col-lg-6 left-form">
                <form id="contact-form" onSubmit={(e) => e.preventDefault()}>
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="section-heading">
                        <h2>
                          Don't be Hesitated<br />
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
                      <textarea name="message" className="form-control" placeholder="Message" />
                    </div>
                    <div className="col-lg-12">
                      <button type="submit" className="main-button">Send Message</button>
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

      {/* Footer */}
      <footer style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)', paddingTop: 80 }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-4">
              <div className="about-widget">
                <img src={footerLogo} alt="RedBoat" style={{ marginBottom: 20 }} />
                <p style={{ fontSize: 16, lineHeight: 1.7 }}>Where Every Stay Sets Sail for Luxury.</p>
                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <a 
                    href="https://www.facebook.com/share/1A18vuAmdU/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #ff565b 0%, #ff8f94 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(255, 86, 91, 0.3)'
                    }}
                  >
                    <Facebook size={20} />
                  </a>
                </div>
              </div>
            </div>
            <div className="col-lg-2 offset-lg-2">
              <div className="location-widget">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MapPin size={18} style={{ color: '#ff565b' }} />
                  Our Location
                </h4>
                <p>Moreno St. Barangay 4 Yabo BLDG, Malaybalay City</p>
              </div>
            </div>
            <div className="col-lg-2">
              <div className="contact-widget">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={18} style={{ color: '#ff565b' }} />
                  Contact Us
                </h4>
                <p><a href="tel:+639366910133">+63 936 691 0133</a></p>
                <p><a href="tel:+639386745358">+63 938 674 5358</a></p>
              </div>
            </div>
            <div className="col-lg-2">
              <div className="follow-us">
                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Star size={18} style={{ color: '#ff565b' }} />
                  Experience
                </h4>
                <ul className="social-links" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ marginBottom: 8 }}>
                    <span style={{ color: '#64748b' }}>⭐ 4.9 Rating</span>
                  </li>
                  <li style={{ marginBottom: 8 }}>
                    <span style={{ color: '#64748b' }}>🏆 Top Rated</span>
                  </li>
                </ul>
              </div>
            </div>
            <div className="col-lg-12">
              <div className="sub-footer" style={{ borderTop: '1px solid #e2e8f0', marginTop: 40, paddingTop: 30 }}>
                <div className="row" style={{ alignItems: 'center' }}>
                  <div className="col-lg-6">
                    <p style={{ color: '#64748b' }}>© 2025 RedBoat Hotel. Crafted with ❤️ by Alt+4F</p>
                  </div>
                  <div className="col-lg-6">
                    <a 
                      href="#home" 
                      className="scroll-to-top" 
                      onClick={(e) => scrollToSection(e, 'home')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #ff565b 0%, #ff8f94 100%)',
                        color: '#fff',
                        borderRadius: 25,
                        textDecoration: 'none',
                        fontSize: 14,
                        fontWeight: 500,
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(255, 86, 91, 0.3)'
                      }}
                    >
                      Back to Top ↑
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

export default RedboatLandingPage;
