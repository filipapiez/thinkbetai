import type { ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';

interface AuthBoundaryProps {
  children: ReactNode;
}

/**
 * Route-level boundary for pages that actually need account state.
 * Keeping this lazy prevents the Supabase auth client from joining every
 * public marketing page's critical JavaScript path.
 */
const AuthBoundary = ({ children }: AuthBoundaryProps) => (
  <AuthProvider>{children}</AuthProvider>
);

export default AuthBoundary;
