import { Navigate } from 'react-router-dom';

interface RouteRedirectProps {
  to: string;
}

export function RouteRedirect({ to }: RouteRedirectProps) {
  return <Navigate to={to} replace />;
}
