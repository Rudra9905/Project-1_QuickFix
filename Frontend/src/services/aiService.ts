import { apiClient } from './apiClient';

export interface ProviderProfile {
    id: number;
    user: {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        city: string;
    };
    serviceType: string;
    rating: number;
    description: string;
    profilePhotoUrl: string;
    isAvailable: boolean;
    basePrice: number;
}

export interface ProblemAnalysisResponse {
    issueDescription: string;
    detectedServiceType: string;
    recommendedProviders: ProviderProfile[];
}

export const analyzeProblem = async (imageFile: File): Promise<ProblemAnalysisResponse> => {
    const formData = new FormData();
    formData.append('image', imageFile);

    // Get current location
    try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        formData.append('lat', position.coords.latitude.toString());
        formData.append('lng', position.coords.longitude.toString());
    } catch (error) {
        console.warn('Geolocation failed or permission denied, proceeding without location.', error);
    }

    const response = await apiClient.post<ProblemAnalysisResponse>('/ai/analyze-problem', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
