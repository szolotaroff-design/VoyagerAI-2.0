
interface GeoPosition {
    lat: number;
    lng: number;
}

interface GeoLocationResult {
    coordinates: GeoPosition;
    city: string;
    country: string;
    fullAddress: string;
}

export const LocationService = {
    // 1. Get current coordinates from browser/device
    getCurrentPosition: (): Promise<GeoPosition> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        });
    },

    // 2. Convert coordinates to city name (Reverse Geocoding via Nominatim)
    getCityFromCoordinates: async (lat: number, lng: number): Promise<GeoLocationResult> => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'VoyagerAI/1.0' // Nominatim requires a User-Agent
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch address');
            }

            const data = await response.json();
            const address = data.address;

            // Extract meaningful city name
            const city = address.city || address.town || address.village || address.hamlet || address.municipality || 'Unknown Location';
            const country = address.country || '';

            return {
                coordinates: { lat, lng },
                city,
                country,
                fullAddress: `${city}, ${country}`.replace(/^, /, '').replace(/, $/, '') // Clean up commas
            };
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            throw error;
        }
    }
};
