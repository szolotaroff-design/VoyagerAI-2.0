
const ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY || 'nNJRN8_NMlIY9putj5JDqwu9H7opITEAlw61_x1uWVU';

export const UnsplashService = {
    async searchPhoto(query: string): Promise<string | null> {
        try {
            console.log(`Searching Unsplash for: ${query}`);
            const response = await fetch(
                `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1`,
                {
                    headers: {
                        Authorization: `Client-ID ${ACCESS_KEY}`
                    }
                }
            );

            if (!response.ok) {
                console.error(`Unsplash API Error: ${response.status} ${response.statusText}`);
                return null;
            }

            const data = await response.json();

            if (data.results && data.results.length > 0) {
                return data.results[0].urls.regular;
            }

            console.warn('[Unsplash] No images found for:', query);
            return null;
        } catch (error) {
            console.error('Unsplash API Error:', error);
            return null;
        }
    }
};
