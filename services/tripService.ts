import { supabase } from './supabase';
import { Trip } from '../types';

export const TripService = {
    async fetchTrips(): Promise<Trip[]> {
        const { data, error } = await supabase
            .from('trips')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching trips:', error);
            throw error;
        }

        if (!data) return [];

        return (data as any[]).map((item) => ({
            id: item.id,
            name: item.name || item.destination,
            destination: item.destination,
            startDate: item.start_date,
            endDate: item.end_date,
            summary: item.summary || '',
            imageUrl: item.image_url,
            itinerary: item.itinerary || [],
            totalBudget: item.total_budget,
            currency: item.currency || 'USD',
            sources: [],
            departureLocation: 'Home',
            editCount: 0
        }));
    },

    async saveTrip(trip: Trip): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
            .from('trips')
            .insert({
                user_id: user.id,
                name: trip.name,
                destination: trip.destination,
                start_date: trip.startDate,
                end_date: trip.endDate,
                image_url: trip.imageUrl,
                itinerary: trip.itinerary,
                total_budget: (trip.totalBudget || '0').toString(),
                currency: trip.currency,
                summary: trip.summary
            });

        if (error) {
            console.error('Error saving trip:', error);
            throw error;
        }
    },

    async deleteTrip(id: string): Promise<void> {
        const { error } = await supabase
            .from('trips')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    subscribeToTrips(onUpdate: () => void) {
        return supabase
            .channel('web_trips_realtime')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public' },
                () => onUpdate()
            )
            .subscribe();
    }
};
