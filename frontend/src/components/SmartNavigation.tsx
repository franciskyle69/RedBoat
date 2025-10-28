import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { routingManager } from '../utils/routeUtils';
import { allRoutes } from '../config/routes';
import NotificationBell from './NotificationBell';
import { useNavigation } from '../contexts/NavigationContext';
import { RouteBreadcrumbs } from './RouteBreadcrumbs';

interface SmartNavigationProps {
  className?: string;
  showBreadcrumbs?: boolean;
  showSearch?: boolean;
  showUserMenu?: boolean;
}

export function SmartNavigation({ 
  className = '',
  showBreadcrumbs = true,
  showSearch = true,
  showUserMenu = true
}: SmartNavigationProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [userContext, setUserContext] = useState<any>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const navigationRoutes = allRoutes.filter(r => !r.isHidden);
  const breadcrumbs = [] as any[];
  const { clearAuthState } = useNavigation();

  useEffect(() => {
    const checkUserContext = async () => {
      try {
        const response = await fetch('http://localhost:5000/me', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setUserContext(data.data);
          routingManager.setUserContext({
            isAuthenticated: true,
            role: data.data?.role || 'user'
          });
        }
      } catch (error) {
        console.error('Failed to get user context:', error);
      }
    };

    checkUserContext();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const results = navigationRoutes.filter((route: any) => 
      route.title.toLowerCase().includes(query.toLowerCase()) ||
      route.description?.toLowerCase().includes(query.toLowerCase())
    );

    setSearchResults(results);
    setShowSearchResults(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:5000/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear all authentication state using context method
      clearAuthState();
      
      // Navigate to landing page
      navigate('/');
      
      // Force a clean reload to clear any cached state
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, clear local state
      clearAuthState();
      navigate('/');
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className={`smart-navigation ${className}`}>
      {/* Top Navigation Bar */}
      <nav className="nav-header">
        <div className="nav-brand">
          <Link to="/" className="brand-link">
            <span className="brand-icon">🏨</span>
            <span className="brand-text">Hotel Management</span>
          </Link>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="nav-search">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => setShowSearchResults(true)}
                className="search-input"
              />
              <span className="search-icon">🔍</span>
              
              {showSearchResults && searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((route) => (
                    <Link
                      key={route.path}
                      to={route.path}
                      className="search-result-item"
                      onClick={() => {
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                    >
                      <span className="result-icon">{getIcon(route.icon)}</span>
                      <div className="result-content">
                        <div className="result-title">{route.title}</div>
                        <div className="result-description">{route.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notification Bell - visible on every page */}
        <div className="nav-user" style={{ marginRight: '12px' }}>
          <NotificationBell />
        </div>

        {/* User Menu */}
        {showUserMenu && userContext && (
          <div className="nav-user">
            <div className="user-menu">
              <button
                className="user-button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
              >
                <span className="user-avatar">
                  {userContext.firstName?.[0] || userContext.username?.[0] || '👤'}
                </span>
                <span className="user-name">
                  {userContext.firstName || userContext.username}
                </span>
                <span className="dropdown-arrow">▼</span>
              </button>

              {showUserDropdown && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <div className="user-full-name">
                      {userContext.firstName} {userContext.lastName}
                    </div>
                    <div className="user-email">{userContext.email}</div>
                    <div className="user-role">
                      {userContext.role === 'admin' ? 'Administrator' : 'User'}
                    </div>
                  </div>
                  
                  <div className="user-actions">
                    <Link to="/user/profile" className="dropdown-item">
                      <span className="item-icon">👤</span>
                      Profile
                    </Link>
                    <Link to="/user/settings" className="dropdown-item">
                      <span className="item-icon">⚙️</span>
                      Settings
                    </Link>
                    <button onClick={handleLogout} className="dropdown-item logout">
                      <span className="item-icon">🚪</span>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Navigation */}
      <div className="nav-main">
        <div className="nav-sidebar">
          <nav className="nav-menu">
            {navigationRoutes.map((route: any) => (
              <Link
                key={route.path}
                to={route.path}
                className={`nav-item ${isActiveRoute(route.path) ? 'active' : ''}`}
                title={route.description}
              >
                <span className="nav-icon">{getIcon(route.icon)}</span>
                <span className="nav-text">{route.title}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Breadcrumbs */}
        {showBreadcrumbs && breadcrumbs.length > 0 && (
          <div className="nav-breadcrumbs">
            <RouteBreadcrumbs />
          </div>
        )}
      </div>
    </div>
  );
}

// Icon mapping function
function getIcon(iconName?: string): string {
  const iconMap: Record<string, string> = {
    dashboard: '📊',
    user: '👤',
    users: '👥',
    home: '🏠',
    calendar: '📅',
    message: '💬',
    settings: '⚙️',
    chart: '📈',
    cleaning: '🧹',
    login: '🔐',
    signup: '📝',
    password: '🔑',
    email: '📧',
    phone: '📞',
    location: '📍',
    star: '⭐',
    heart: '❤️',
    bell: '🔔',
    search: '🔍',
    filter: '🔽',
    sort: '🔄',
    edit: '✏️',
    delete: '🗑️',
    add: '➕',
    remove: '➖',
    check: '✅',
    cross: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    question: '❓',
    exclamation: '❗'
  };

  return iconName ? iconMap[iconName] || '📄' : '📄';
}

// Navigation styles
export const navigationStyles = `
.smart-navigation {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #f3f4f6;
}

.nav-brand {
  display: flex;
  align-items: center;
}

.brand-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #111827;
  font-weight: 600;
  font-size: 1.125rem;
}

.brand-icon {
  font-size: 1.5rem;
}

.nav-search {
  flex: 1;
  max-width: 400px;
  margin: 0 2rem;
  position: relative;
}

.search-container {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.5rem 2.5rem 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  background: #f9fafb;
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-icon {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 50;
  max-height: 300px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  color: #374151;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s ease;
}

.search-result-item:hover {
  background-color: #f9fafb;
}

.result-icon {
  font-size: 1rem;
}

.result-title {
  font-weight: 500;
  font-size: 0.875rem;
}

.result-description {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.125rem;
}

.nav-user {
  position: relative;
}

.user-menu {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-button:hover {
  background-color: #f9fafb;
}

.user-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.user-name {
  font-weight: 500;
  color: #374151;
}

.dropdown-arrow {
  font-size: 0.75rem;
  color: #6b7280;
  transition: transform 0.2s ease;
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 50;
  min-width: 200px;
  margin-top: 0.5rem;
}

.user-info {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.user-full-name {
  font-weight: 600;
  color: #111827;
}

.user-email {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.user-role {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.user-actions {
  padding: 0.5rem 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  text-decoration: none;
  color: #374151;
  transition: background-color 0.2s ease;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.dropdown-item:hover {
  background-color: #f9fafb;
}

.dropdown-item.logout {
  color: #dc2626;
}

.item-icon {
  font-size: 1rem;
}

.nav-main {
  display: flex;
}

.nav-sidebar {
  width: 250px;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  padding: 1rem 0;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  text-decoration: none;
  color: #6b7280;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.nav-item.active {
  background-color: #eff6ff;
  color: #1d4ed8;
  border-left-color: #3b82f6;
}

.nav-icon {
  font-size: 1.125rem;
}

.nav-text {
  font-weight: 500;
  font-size: 0.875rem;
}

.nav-breadcrumbs {
  flex: 1;
  padding: 1rem 1.5rem;
  background: #fff;
}

@media (max-width: 768px) {
  .nav-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .nav-search {
    margin: 0;
    max-width: none;
  }
  
  .nav-main {
    flex-direction: column;
  }
  
  .nav-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .nav-menu {
    flex-direction: row;
    overflow-x: auto;
    padding: 0 1rem;
  }
  
  .nav-item {
    white-space: nowrap;
    min-width: fit-content;
  }
}
`;

// Auto-inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = navigationStyles;
  document.head.appendChild(styleElement);
}
