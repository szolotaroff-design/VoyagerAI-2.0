
import { useState, useRef } from 'react';
import { TripRequest } from '../types';

export const useTripPlanner = () => {
    const [step, setStep] = useState(1);
    const [showDestHint, setShowDestHint] = useState(false);

    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState<TripRequest>({
        departureLocation: '',
        destinations: [''],
        startDate: today,
        endDate: '',
        transportType: 'Cheapest available',
        totalBudget: '2000',
        goals: '',
        travelers: 1
    });

    const handleDestinationChange = (index: number, value: string) => {
        const newDests = [...formData.destinations];
        newDests[index] = value;
        setFormData({ ...formData, destinations: newDests });
    };

    const addDestination = () => {
        setFormData({ ...formData, destinations: [...formData.destinations, ''] });
    };

    const removeDestination = (index: number) => {
        if (formData.destinations.length <= 1) return;
        const newDests = formData.destinations.filter((_, i) => i !== index);
        setFormData({ ...formData, destinations: newDests });
    };

    const handleStartDateChange = (val: string) => {
        const newEndDate = formData.endDate && formData.endDate < val ? val : formData.endDate;
        setFormData({ ...formData, startDate: val, endDate: newEndDate });
    };

    const isStep1Valid = formData.departureLocation.trim() !== '' && formData.destinations.some(d => d.trim() !== '') && formData.endDate !== '';

    return {
        step,
        setStep,
        formData,
        setFormData,
        showDestHint,
        setShowDestHint,
        today,
        handleDestinationChange,
        addDestination,
        removeDestination,
        handleStartDateChange,
        isStep1Valid
    };
};
