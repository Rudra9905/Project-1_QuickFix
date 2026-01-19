import { api } from '../api';

export interface PaymentRequest {
    token: string;
    amount: number; // in smallest currency unit
    description?: string;
}

export interface PaymentResponse {
    success: boolean;
    chargeId: string;
    message: string;
}

export const paymentService = {
    charge: async (data: PaymentRequest): Promise<PaymentResponse> => {
        const response = await api<PaymentResponse>('/payments/charge', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return response;
    }
};
