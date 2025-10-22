import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useNavigation } from '../contexts/NavigationContext';
import { RouteConfig } from '../config/routes';

interface DynamicNavigationProps {
  className?: string;
  style?: React.CSSProperties;
  showIcons?: boolean;
  showDescriptions?: boolean;
}

export function DynamicNavigation({ 
  className = '', 
  style = {},
  showIcons = true,
  showDescriptions = false 
}: DynamicNavigationProps) {
  const { navigationRoutes, userRole } = useNavigation();
  const location = useLocation();

  if (!userRole || navigationRoutes.length === 0) {
    return null;
  }

  const getIcon = (iconName?: string) => {
    if (!showIcons || !iconName) return null;
    
    const iconMap: { [key: string]: string } = {
      dashboard: '📊',
      user: '👤',
      calendar: '📅',
      home: '🏠',
      message: '💬',
      settings: '⚙️',
      users: '👥',
      cleaning: '🧹',
      chart: '📈',
    };
    
    return iconMap[iconName] || '📄';
  };

  return (
    <nav className={className} style={style}>
      {navigationRoutes.map((route: RouteConfig) => {
        const isActive = location.pathname === route.path;
        
        return (
          <Link
            key={route.path}
            to={route.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              margin: '4px 0',
              borderRadius: '6px',
              textDecoration: 'none',
              color: isActive ? '#ffffff' : '#64748b',
              backgroundColor: isActive ? '#0ea5e9' : 'transparent',
              transition: 'all 0.2s ease',
              fontSize: '14px',
              fontWeight: isActive ? '500' : '400',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = '#f1f5f9';
                e.currentTarget.style.color = '#0ea5e9';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#64748b';
              }
            }}
          >
            {getIcon(route.icon)}
            <div>
              <div style={{ fontWeight: isActive ? '500' : '400' }}>
                {route.title}
              </div>
              {showDescriptions && route.description && (
                <div style={{ 
                  fontSize: '12px', 
                  color: isActive ? '#e0f2fe' : '#9ca3af',
                  marginTop: '2px'
                }}>
                  {route.description}
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}

// Breadcrumb component
export function DynamicBreadcrumb() {
  const { getRouteByPath } = useNavigation();
  const location = useLocation();
  
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const route = getRouteByPath(path);
    
    return {
      path,
      title: route?.title || segment,
      isLast: index === pathSegments.length - 1
    };
  });

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav style={{ 
      padding: '16px 0',
      borderBottom: '1px solid #e5e7eb',
      marginBottom: '24px'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        fontSize: '14px',
        color: '#6b7280'
      }}>
        <Link 
          to="/" 
          style={{ 
            color: '#0ea5e9', 
            textDecoration: 'none',
            fontWeight: '500'
          }}
        >
          Home
        </Link>
        {breadcrumbs.map((breadcrumb, index) => (
          <React.Fragment key={breadcrumb.path}>
            <span style={{ color: '#d1d5db' }}>/</span>
            {breadcrumb.isLast ? (
              <span style={{ color: '#374151', fontWeight: '500' }}>
                {breadcrumb.title}
              </span>
            ) : (
              <Link 
                to={breadcrumb.path}
                style={{ 
                  color: '#0ea5e9', 
                  textDecoration: 'none',
                  fontWeight: '500'
                }}
              >
                {breadcrumb.title}
              </Link>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
}

// Page title component
export function DynamicPageTitle() {
  const { getRouteByPath } = useNavigation();
  const location = useLocation();
  
  const route = getRouteByPath(location.pathname);
  
  if (!route) return null;

  return (
    <div style={{ marginBottom: '24px' }}>
      <h1 style={{ 
        fontSize: '24px', 
        fontWeight: '600', 
        color: '#1f2937',
        margin: '0 0 8px 0'
      }}>
        {route.title}
      </h1>
      {route.description && (
        <p style={{ 
          color: '#6b7280', 
          margin: '0',
          fontSize: '14px'
        }}>
          {route.description}
        </p>
      )}
    </div>
  );
}
