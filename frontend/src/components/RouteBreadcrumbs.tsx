import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { routingManager } from '../utils/routeUtils';

interface BreadcrumbProps {
  className?: string;
  separator?: string;
  showHome?: boolean;
}

export function RouteBreadcrumbs({ 
  className = '', 
  separator = '/',
  showHome = true 
}: BreadcrumbProps) {
  const location = useLocation();
  const breadcrumbs = routingManager.getBreadcrumbs(location.pathname);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className={`breadcrumbs ${className}`} aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {showHome && (
          <li className="breadcrumb-item">
            <Link to="/" className="breadcrumb-link">
              <span className="breadcrumb-icon">🏠</span>
              Home
            </Link>
          </li>
        )}
        
        {breadcrumbs.map((route, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isCurrentPage = location.pathname === route.path;
          
          return (
            <li key={route.path} className="breadcrumb-item">
              {index > 0 && (
                <span className="breadcrumb-separator" aria-hidden="true">
                  {separator}
                </span>
              )}
              
              {isCurrentPage ? (
                <span className="breadcrumb-current" aria-current="page">
                  {route.icon && <span className="breadcrumb-icon">{getIcon(route.icon)}</span>}
                  {route.title}
                </span>
              ) : (
                <Link to={route.path} className="breadcrumb-link">
                  {route.icon && <span className="breadcrumb-icon">{getIcon(route.icon)}</span>}
                  {route.title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// Icon mapping function
function getIcon(iconName: string): string {
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

  return iconMap[iconName] || '📄';
}

// Breadcrumb styles
export const breadcrumbStyles = `
.breadcrumbs {
  padding: 0.5rem 0;
  margin-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.breadcrumb-list {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
}

.breadcrumb-link {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #6b7280;
  text-decoration: none;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
}

.breadcrumb-link:hover {
  color: #374151;
  background-color: #f3f4f6;
}

.breadcrumb-current {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #111827;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  background-color: #f9fafb;
}

.breadcrumb-separator {
  color: #9ca3af;
  margin: 0 0.5rem;
  font-weight: 400;
}

.breadcrumb-icon {
  font-size: 0.875rem;
  margin-right: 0.25rem;
}

@media (max-width: 640px) {
  .breadcrumb-list {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .breadcrumb-item {
    width: 100%;
  }
  
  .breadcrumb-separator {
    display: none;
  }
}
`;

// Auto-inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = breadcrumbStyles;
  document.head.appendChild(styleElement);
}
