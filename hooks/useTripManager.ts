import { useState, useEffect } from 'react';
import { Trip } from '../types';
import { TripService } from '../services/tripService';
import { supabase } from '../services/supabase';

export const useTripManager = (session: any) => {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [freeTrialUsed, setFreeTrialUsed] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);

    // Payment modal state
    const [paymentModal, setPaymentModal] = useState<{ amount: string; callback: () => void } | null>(null);

    const loadTrips = async () => {
        if (!session) {
            setTrips([]);
            return;
        }
        try {
            setLoading(true);
            const data = await TripService.fetchTrips();
            setTrips(data);
        } catch (error) {
            console.error("Failed to load trips", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial Load & Realtime Subscription
    useEffect(() => {
        if (!session) return;

        // 1. Initial Fetch
        loadTrips();

        // 2. Realtime Subscription
        const channel = TripService.subscribeToTrips(() => {
            loadTrips();
        });

        // 3. Local Trial Check (Legacy)
        const trialStatus = localStorage.getItem('voyager_free_trial_used');
        if (trialStatus === 'true') {
            setFreeTrialUsed(true);
        }

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.user?.id]); // Re-subscribe when user changes

    const addTrip = async (newTrip: Trip) => {
        if (!freeTrialUsed) {
            await finalizeAddTrip(newTrip);
            setFreeTrialUsed(true);
            localStorage.setItem('voyager_free_trial_used', 'true');
        } else {
            setPaymentModal({
                amount: '$2.99',
                callback: () => finalizeAddTrip(newTrip)
            });
        }
    };

    const finalizeAddTrip = async (newTrip: Trip) => {
        try {
            await TripService.saveTrip(newTrip);
            // State update will happen via Realtime or manual fetch
            loadTrips();
            setSelectedTrip(newTrip);
            setPaymentModal(null);
        } catch (e) {
            alert('Failed to save trip to cloud.');
        }
    };

    const updateTrip = (updatedTrip: Trip) => {
        // Implement if needed via DB update
        setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
        setSelectedTrip(updatedTrip);
    };

    const deleteTrip = async (id: string) => {
        try {
            // Optimistic update
            setTrips(prev => prev.filter(t => t.id !== id));
            if (selectedTrip?.id === id) {
                setSelectedTrip(null);
            }
            // DB Update
            await TripService.deleteTrip(id);
            // Realtime will confirm
        } catch (e) {
            console.error('Delete failed', e);
            loadTrips(); // Revert on error
        }
    };

    const requirePayment = (amount: string, callback: () => void) => {
        setPaymentModal({ amount, callback });
    };

    const closePaymentModal = () => setPaymentModal(null);

    return {
        trips,
        selectedTrip,
        setSelectedTrip,
        freeTrialUsed,
        addTrip,
        updateTrip,
        deleteTrip,
        paymentModal,
        requirePayment,
        closePaymentModal,
        loading
    };
};
