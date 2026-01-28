
import React from 'react';
import { Trip } from '../types';

interface TripCardProps {
  trip: Trip;
  onClick: (trip: Trip) => void;
  onDelete: (id: string) => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onClick, onDelete }) => {
  return (
    <div
      className="group relative glass-card rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 cursor-pointer ring-1 ring-slate-100/50"
      onClick={() => onClick(trip)}
    >
      <div className="h-48 overflow-hidden">
        <img
          src={trip.imageUrl}
          alt={trip.destination}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-slate-800 line-clamp-2 group-hover:underline decoration-2 underline-offset-2">{trip.name}</h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(trip.id);
            }}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          >
            <i className="fas fa-trash-alt"></i>
          </button>
        </div>
        <p className="text-sm font-medium text-blue-600 mb-2">
          <i className="fas fa-map-marker-alt mr-2"></i>{trip.destination}
        </p>
        <div className="flex items-center text-xs text-slate-500 gap-4">
          <span><i className="far fa-calendar-alt mr-1"></i> {new Date(trip.startDate).toLocaleDateString()}</span>
          <span><i className="fas fa-clock mr-1"></i> {trip.itinerary.length} Days</span>
        </div>
      </div>
    </div>
  );
};

export default TripCard;
