import { useState, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// Stripe publishable key
const STRIPE_PUBLISHABLE_KEY: string =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  'pk_live_51Q2zNxQrqKHReEDtSKDxMWSWxgJNH3FDqAYdzMVHhmfupJu5N3qnFqfh5HESwkdQ0qSGKlJqZEofZP3O2CGEZ3qz001VvtsDuE';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface EmbeddedCheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  priceId: string;
  planName: string;
}

export const EmbeddedCheckoutDialog = ({
  isOpen,
  onClose,
  priceId,
  planName,
}: EmbeddedCheckoutDialogProps) => {
  const { session } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const fetchClientSecret = useCallback(async () => {
    if (!session?.access_token) {
      throw new Error('Please log in to continue');
    }

    const { data, error } = await supabase.functions.invoke('create-embedded-checkout', {
      body: { priceId },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('Error creating checkout session:', error);
      setError('Failed to initialize checkout. Please try again.');
      throw error;
    }

    if (!data?.clientSecret) {
      setError('No checkout session returned');
      throw new Error('No client secret returned');
    }

    return data.clientSecret;
  }, [priceId, session]);

  const options = { fetchClientSecret };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Subscribe to {planName}</DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-6">
          {error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <button 
                onClick={() => { setError(null); onClose(); }}
                className="text-primary hover:underline"
              >
                Go Back
              </button>
            </div>
          ) : !session?.access_token ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Please log in to continue</p>
            </div>
          ) : (
            <div id="checkout" className="min-h-[400px]">
              <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
