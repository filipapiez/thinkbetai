import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, CreditCard, CheckCircle } from 'lucide-react';

// Stripe publishable key (prefer env so it matches the backend Stripe secret key mode)
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  'pk_live_51Q2zNxQrqKHReEDtSKDxMWSWxgJNH3FDqAYdzMVHhmfupJu5N3qnFqfh5HESwkdQ0qSGKlJqZEofZP3O2CGEZ3qz001VvtsDuE';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface CheckoutFormProps {
  planId: string;
  planName: string;
  price: number;
  accessToken: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const CheckoutForm = ({ planId, planName, price, accessToken, onSuccess, onCancel }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      });

      if (result.error) {
        console.error('Stripe confirmPayment error:', result.error);
        toast.error(result.error.message || 'Payment failed');
        return;
      }

      const paymentIntent = result.paymentIntent;

      if (paymentIntent?.status === 'succeeded') {
        const { error: confirmError } = await supabase.functions.invoke('confirm-payment', {
          body: { paymentIntentId: paymentIntent.id },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (confirmError) {
          console.error('confirm-payment invoke error:', confirmError);
          toast.error('Payment succeeded but failed to activate. Please contact support.');
        } else {
          toast.success('Payment successful! Welcome to ThinkBetAI!');
          onSuccess();
        }
        return;
      }

      toast.error(`Payment not completed (status: ${paymentIntent?.status ?? 'unknown'})`);
    } catch (err) {
      console.error('Payment exception:', err);
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 bg-muted/50 rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">{planName}</span>
          <span className="text-lg font-bold">${price}/month</span>
        </div>
      </div>
      
      <PaymentElement 
        options={{
          layout: 'tabs',
        }}
        onReady={() => setIsReady(true)}
      />
      
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !isReady || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : !isReady ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay ${price}
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

interface StripePaymentFormProps {
  planId: string;
  planName: string;
  price: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const StripePaymentForm = ({ planId, planName, price, onSuccess, onCancel }: StripePaymentFormProps) => {
  const { session } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!session?.access_token) {
        setError('Please log in to continue');
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
          body: { planId },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) {
          throw error;
        }

        if (data?.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error('No client secret returned');
        }
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Failed to initialize payment. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [planId, session]);

  if (isLoading) {
    return (
      <Card variant="glass">
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="glass">
        <CardContent className="py-8 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={onCancel}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return null;
  }

  return (
    <Card variant="glass" className="border-primary/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Complete Payment
        </CardTitle>
        <CardDescription>
          Enter your payment details below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'night',
              variables: {
                colorPrimary: '#22c55e',
                colorBackground: '#09090b',
                colorText: '#fafafa',
                colorDanger: '#ef4444',
                fontFamily: 'system-ui, sans-serif',
                borderRadius: '8px',
              },
            },
          }}
        >
          <CheckoutForm
            planId={planId}
            planName={planName}
            price={price}
            accessToken={session!.access_token}
            onSuccess={onSuccess}
            onCancel={onCancel}
          />
        </Elements>
      </CardContent>
    </Card>
  );
};
