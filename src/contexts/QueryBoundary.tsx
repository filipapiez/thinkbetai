import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

interface QueryBoundaryProps {
  children: ReactNode;
}

/** Loads React Query only on routes that execute query-backed hooks. */
const QueryBoundary = ({ children }: QueryBoundaryProps) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

export default QueryBoundary;
