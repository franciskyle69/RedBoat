# Dynamic Routing System

This document explains how to use the dynamic routing system implemented in the WebProj application.

## Overview

The dynamic routing system provides:
- **Route Configuration**: Centralized route definitions
- **Role-based Access Control**: Automatic permission handling
- **Lazy Loading**: Performance optimization with code splitting
- **Navigation Context**: Global navigation state management
- **Dynamic Components**: Reusable navigation and breadcrumb components

## File Structure

```
frontend/src/
├── config/
│   └── routes.ts              # Route configurations
├── components/
│   ├── DynamicRoute.tsx       # Route guards and protection
│   └── DynamicNavigation.tsx  # Navigation components
├── contexts/
│   └── NavigationContext.tsx  # Navigation state management
├── utils/
│   └── routeGenerator.tsx     # Route generation utilities
└── docs/
    └── DynamicRouting.md      # This documentation
```

## Route Configuration

Routes are defined in `config/routes.ts` with the following structure:

```typescript
interface RouteConfig {
  path: string;                    // Route path
  component: React.ComponentType;  // Lazy-loaded component
  title: string;                   // Display title
  description?: string;            // Route description
  icon?: string;                   // Icon identifier
  requiresAuth?: boolean;         // Requires authentication
  requiredRole?: 'user' | 'admin'; // Required user role
  isPublic?: boolean;             // Public route (no auth)
  isHidden?: boolean;             // Hidden from navigation
}
```

### Example Route Definition

```typescript
{
  path: '/user/profile',
  component: UserProfile,
  title: 'Profile',
  description: 'Manage your personal information',
  icon: 'user',
  requiresAuth: true,
  requiredRole: 'user',
}
```

## Usage Examples

### 1. Basic Navigation Component

```tsx
import { DynamicNavigation } from '../components/DynamicNavigation';

function MyPage() {
  return (
    <div>
      <DynamicNavigation 
        showIcons={true}
        showDescriptions={false}
      />
    </div>
  );
}
```

### 2. Using Navigation Context

```tsx
import { useNavigation } from '../contexts/NavigationContext';

function MyComponent() {
  const { userRole, navigationRoutes, isRouteAccessible } = useNavigation();
  
  return (
    <div>
      <p>Current role: {userRole}</p>
      <p>Available routes: {navigationRoutes.length}</p>
    </div>
  );
}
```

### 3. Route Access Control

```tsx
import { useRouteAccess } from '../contexts/NavigationContext';

function ConditionalComponent() {
  const canAccessAdmin = useRouteAccess('/admin');
  const canAccessProfile = useRouteAccess('/user/profile');
  
  return (
    <div>
      {canAccessAdmin && <AdminButton />}
      {canAccessProfile && <ProfileButton />}
    </div>
  );
}
```

### 4. Breadcrumb Navigation

```tsx
import { DynamicBreadcrumb } from '../components/DynamicNavigation';

function MyPage() {
  return (
    <div>
      <DynamicBreadcrumb />
      <h1>Page Content</h1>
    </div>
  );
}
```

### 5. Page Title Component

```tsx
import { DynamicPageTitle } from '../components/DynamicNavigation';

function MyPage() {
  return (
    <div>
      <DynamicPageTitle />
      <p>Page content here...</p>
    </div>
  );
}
```

## Route Guards

The system includes three main route guards:

### 1. ProtectedRoute
- Requires authentication
- Redirects to login if not authenticated

### 2. UserRoute
- Requires authentication + user role
- Redirects to appropriate dashboard based on role

### 3. AdminRoute
- Requires authentication + admin role
- Redirects to user dashboard if not admin

## Adding New Routes

### 1. Define the Route

Add to `config/routes.ts`:

```typescript
{
  path: '/user/new-feature',
  component: NewFeature,
  title: 'New Feature',
  description: 'Description of the new feature',
  icon: 'feature',
  requiresAuth: true,
  requiredRole: 'user',
}
```

### 2. Create the Component

```tsx
// pages/User/NewFeature.tsx
import React from 'react';
import { DynamicPageTitle } from '../../components/DynamicNavigation';

function NewFeature() {
  return (
    <div>
      <DynamicPageTitle />
      <p>New feature content...</p>
    </div>
  );
}

export default NewFeature;
```

### 3. Lazy Load the Component

Update the import in `config/routes.ts`:

```typescript
const NewFeature = lazy(() => import('../pages/User/NewFeature'));
```

## Backend Dynamic Routing

The backend also supports dynamic routing through `backend/config/routes.ts`:

```typescript
{
  path: '/api/new-endpoint',
  method: 'GET',
  handler: async (req, res) => {
    // Implementation
  },
  requiresAuth: true,
  requiredRole: 'admin',
  description: 'New API endpoint',
  tags: ['admin', 'api']
}
```

## Best Practices

### 1. Route Organization
- Group related routes together
- Use consistent naming conventions
- Keep route paths simple and intuitive

### 2. Component Structure
- Use lazy loading for all route components
- Implement proper error boundaries
- Keep components focused and single-purpose

### 3. Navigation Design
- Use consistent icons and descriptions
- Implement proper loading states
- Handle authentication state changes

### 4. Performance
- Lazy load all route components
- Use React.Suspense for loading states
- Minimize bundle size with code splitting

## Troubleshooting

### Common Issues

1. **Route not found**: Check route configuration and path spelling
2. **Access denied**: Verify user role and authentication status
3. **Component not loading**: Check lazy import and Suspense wrapper
4. **Navigation not updating**: Ensure NavigationProvider is wrapping the app

### Debug Tips

1. Use browser dev tools to inspect route state
2. Check console for authentication errors
3. Verify route configuration matches component paths
4. Test with different user roles

## Migration Guide

To migrate from static routing to dynamic routing:

1. **Move route definitions** to `config/routes.ts`
2. **Update App.tsx** to use dynamic routing
3. **Add NavigationProvider** to wrap the application
4. **Replace static navigation** with DynamicNavigation components
5. **Test all routes** with different user roles

## API Reference

### NavigationContext

```typescript
interface NavigationContextType {
  userRole: 'user' | 'admin' | null;
  navigationRoutes: RouteConfig[];
  currentRoute: RouteConfig | null;
  setUserRole: (role: 'user' | 'admin' | null) => void;
  getRouteByPath: (path: string) => RouteConfig | undefined;
  isRouteAccessible: (path: string) => boolean;
}
```

### DynamicNavigation Props

```typescript
interface DynamicNavigationProps {
  className?: string;
  style?: React.CSSProperties;
  showIcons?: boolean;
  showDescriptions?: boolean;
}
```

This dynamic routing system provides a scalable, maintainable solution for managing application navigation and access control.
