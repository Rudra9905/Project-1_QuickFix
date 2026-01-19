import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from './ui/Button';
import toast from 'react-hot-toast';

interface PaymentFormProps {
    amount: number;
    onSuccess: (paymentIntentId: string) => void;
    onCancel: () => void;
    currency?: string;
}

export const PaymentForm = ({ amount, onSuccess, onCancel }: PaymentFormProps) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage(null);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Return URL is required, but we can handle it or use a redirect
                // For a modal flow, we might want to handle it without redirect if possible,
                // but PaymentElement usually requires a return_url unless we use redirect: 'if_required'
                return_url: window.location.origin + '/payment-success', // Placeholder
            },
            redirect: 'if_required',
        });

        if (error) {
            setErrorMessage(error.message || 'An unexpected error occurred.');
            setIsProcessing(false);
            toast.error(error.message || 'Payment failed');
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            toast.success('Payment successful!');
            onSuccess(paymentIntent.id);
            // isProcessing stays true until modal closes or parent handles it
        } else {
            // Case where it might need further action, but 'succeeded' is the happy path
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <PaymentElement />
            </div>
            {errorMessage && (
                <div className="text-red-500 text-sm">{errorMessage}</div>
            )}
            <div className="flex gap-3 mt-4">
                <Button variant="outline" className="flex-1" onClick={onCancel} type="button" disabled={isProcessing}>
                    Cancel
                </Button>
                <Button
                    className="flex-1"
                    type="submit"
                    disabled={!stripe || isProcessing}
                    isLoading={isProcessing}
                >
                    Pay ₹{amount}
                </Button>
            </div>
        </form>
    );
};
