
import { useState } from 'react';
import { Trip, Activity } from '../types';
import { editTripPlan } from '../services/geminiService';

export const useTripEditor = (
    trip: Trip,
    onUpdateTrip: (updatedTrip: Trip) => void,
    onPaymentRequired: (amount: string, callback: () => void) => void
) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [editPrompt, setEditPrompt] = useState('');

    const [isAddingActivity, setIsAddingActivity] = useState(false);
    const [selectedDayIdx, setSelectedDayIdx] = useState(0);

    const [newActivity, setNewActivity] = useState<Partial<Activity>>({
        type: 'SIGHTSEEING',
        time: '12:00',
        title: '',
        description: '',
        location: ''
    });

    const currentEditCount = trip.editCount || 0;
    const isFreeEdit = currentEditCount < 2;

    const handleEditTrip = async () => {
        if (!editPrompt.trim()) return;

        const performUpdate = async () => {
            setIsUpdating(true);
            try {
                const updated = await editTripPlan(trip, editPrompt);
                onUpdateTrip({ ...updated, editCount: currentEditCount + 1 });
                setIsEditing(false);
                setEditPrompt('');
            } catch (err) {
                alert("Failed to update trip.");
            } finally {
                setIsUpdating(false);
            }
        };

        if (isFreeEdit) {
            performUpdate();
        } else {
            onPaymentRequired('$0.99', performUpdate);
        }
    };

    const handleAddManualActivity = () => {
        if (!newActivity.title || !newActivity.time) return;

        const updatedItinerary = [...trip.itinerary];
        const targetDay = updatedItinerary[selectedDayIdx]; // Use the state for selected day

        const activityToAdd: Activity = {
            title: newActivity.title!,
            time: newActivity.time!,
            description: newActivity.description || '',
            location: newActivity.location || '',
            type: (newActivity.type as Activity['type']) || 'OTHER',
            costEstimate: '',
            bookingUrl: ''
        };

        targetDay.activities = [...targetDay.activities, activityToAdd].sort((a, b) => a.time.localeCompare(b.time));

        onUpdateTrip({ ...trip, itinerary: updatedItinerary });
        setIsAddingActivity(false);
        setNewActivity({ type: 'SIGHTSEEING', time: '12:00', title: '', description: '', location: '' });
    };

    return {
        isEditing,
        setIsEditing,
        isUpdating,
        editPrompt,
        setEditPrompt,
        handleEditTrip,
        isFreeEdit,
        currentEditCount,
        isAddingActivity,
        setIsAddingActivity,
        newActivity,
        setNewActivity,
        handleAddManualActivity,
        selectedDayIdx,
        setSelectedDayIdx
    };
};
