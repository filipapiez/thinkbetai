import type { ReactNode } from 'react';
import { NoIndexContext } from '@/contexts/NoIndexContext';

interface NoIndexBoundaryProps {
  children: ReactNode;
}

/** Keeps account, application, and retired programmatic routes out of search. */
export const NoIndexBoundary = ({ children }: NoIndexBoundaryProps) => (
  <NoIndexContext.Provider value>{children}</NoIndexContext.Provider>
);
