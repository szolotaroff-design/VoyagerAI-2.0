
import React from 'react';
import { Trip, Activity } from '../types';
import { useTripEditor } from '../hooks/useTripEditor';

interface ItineraryViewProps {
  trip: Trip;
  onBack: () => void;
  onUpdateTrip: (updatedTrip: Trip) => void;
  onPaymentRequired: (amount: string, callback: () => void) => void;
}

const ActivityIcon = ({ type }: { type: Activity['type'] }) => {
  switch (type) {
    case 'FLIGHT': return <i className="fas fa-plane text-blue-500"></i>;
    case 'HOTEL': return <i className="fas fa-hotel text-indigo-500"></i>;
    case 'RESTAURANT': return <i className="fas fa-utensils text-orange-500"></i>;
    case 'SIGHTSEEING': return <i className="fas fa-camera text-green-500"></i>;
    case 'TRANSPORT': return <i className="fas fa-train text-slate-500"></i>;
    default: return <i className="fas fa-star text-yellow-500"></i>;
  }
};

const ItineraryView: React.FC<ItineraryViewProps> = ({ trip, onBack, onUpdateTrip, onPaymentRequired }) => {
  const {
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
  } = useTripEditor(trip, onUpdateTrip, onPaymentRequired);

  // Swipe handlers for mobile navigation
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);
  const minSwipeDistance = 50;

  // Sync scroll refs
  const topNavRef = React.useRef<HTMLDivElement>(null);
  const bottomNavRef = React.useRef<HTMLDivElement>(null);
  const isScrollingRef = React.useRef<boolean>(false);

  const handleScroll = (source: 'top' | 'bottom') => {
    if (isScrollingRef.current) return;

    // Set lock
    isScrollingRef.current = true;

    const sourceRef = source === 'top' ? topNavRef : bottomNavRef;
    const targetRef = source === 'top' ? bottomNavRef : topNavRef;

    if (sourceRef.current && targetRef.current) {
      targetRef.current.scrollLeft = sourceRef.current.scrollLeft;
    }

    // Release lock on next frame
    requestAnimationFrame(() => {
      isScrollingRef.current = false;
    });
  };

  // Auto-scroll to selected day
  React.useEffect(() => {
    if (topNavRef.current && bottomNavRef.current) {
      const buttonWidth = 100; // Approx width of day button + margin
      const scrollPos = Math.max(0, (selectedDayIdx * buttonWidth) - (window.innerWidth / 2) + (buttonWidth / 2));

      topNavRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
      bottomNavRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
    }
  }, [selectedDayIdx]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Reset
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && selectedDayIdx < trip.itinerary.length - 1) {
      // Next Day
      setSelectedDayIdx(selectedDayIdx + 1);
    } else if (isRightSwipe && selectedDayIdx > 0) {
      // Previous Day
      setSelectedDayIdx(selectedDayIdx - 1);
    }
  };

  const getGoogleMapsRouteUrl = (location: string) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`;
  };

  const getBookingLink = (activity: Activity) => {
    const checkin = trip.startDate;
    const checkout = trip.endDate;

    // If AI provided a deep link already, use it
    if (activity.bookingUrl && activity.bookingUrl.trim() !== '' && !activity.bookingUrl.includes('google.com/search') && activity.bookingUrl.length > 15) {
      return activity.bookingUrl;
    }

    const highIntentTypes = ['FLIGHT', 'HOTEL', 'TRANSPORT'];
    if (highIntentTypes.includes(activity.type)) {
      if (activity.type === 'FLIGHT') {
        return `https://www.skyscanner.com/transport/flights/search?q=${encodeURIComponent(activity.title)}&departure_date=${checkin}`;
      }
      if (activity.type === 'HOTEL') {
        return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(activity.title + ' ' + (activity.location || ''))}&checkin=${checkin}&checkout=${checkout}`;
      }
      if (activity.type === 'TRANSPORT') {
        return `https://www.thetrainline.com/search/${encodeURIComponent(activity.location || '')}?departureDate=${checkin}`;
      }
    }
    return null;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      dayMonth: date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
    };
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 px-2 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center text-slate-600 hover:text-blue-600 transition-colors font-medium group">
          <i className="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i> Back to list
        </button>
        <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50 transition-all shadow-sm">
          <i className="fas fa-pen-to-square text-blue-500"></i> Edit Plan {isFreeEdit && <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-green-100 text-green-600 rounded-md uppercase">Free</span>}
        </button>
      </div>

      {/* Manual Add Activity Modal */}
      {isAddingActivity && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl animate-fadeIn border border-slate-100">
            <h3 className="text-2xl font-black text-slate-800 mb-6">Add New Activity</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Time</label>
                  <input
                    type="time"
                    value={newActivity.time}
                    onChange={(e) => setNewActivity({ ...newActivity, time: e.target.value })}
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                  <select
                    value={newActivity.type}
                    onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value as any })}
                    className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none font-bold text-slate-700"
                  >
                    <option value="FLIGHT">Flight</option>
                    <option value="HOTEL">Hotel</option>
                    <option value="RESTAURANT">Restaurant</option>
                    <option value="SIGHTSEEING">Sightseeing</option>
                    <option value="TRANSPORT">Transport</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Dinner at Skyline"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Location</label>
                <input
                  type="text"
                  placeholder="Address or name"
                  value={newActivity.location}
                  onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                  className="w-full p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                <textarea
                  placeholder="Any notes..."
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                  className="w-full h-24 p-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button onClick={() => setIsAddingActivity(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-600 hover:bg-slate-200">Cancel</button>
              <button onClick={handleAddManualActivity} className="flex-[2] py-4 bg-blue-600 rounded-2xl font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-200">Save Activity</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trip Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 max-w-lg w-full shadow-2xl animate-fadeIn">
            <h3 className="text-2xl font-black text-slate-800 mb-2">Adjust your trip</h3>
            <p className="text-slate-500 text-sm mb-6">{isFreeEdit ? `You have ${2 - currentEditCount} free edits left.` : 'Free edits exhausted. Further adjustments cost $0.99 each.'}</p>
            <textarea className="w-full h-32 p-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 outline-none transition-all resize-none mb-6" placeholder="E.g. Add one more day..." value={editPrompt} onChange={(e) => setEditPrompt(e.target.value)} />
            <div className="flex gap-4">
              <button onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-bold text-slate-600 hover:bg-slate-200">Cancel</button>
              <button onClick={handleEditTrip} disabled={isUpdating || !editPrompt.trim()} className="flex-[2] py-4 bg-blue-600 rounded-2xl font-bold text-white hover:bg-blue-700 disabled:bg-slate-200">{isUpdating ? 'Updating...' : `Update Plan`}</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-slate-100 mb-8">
        <div className="relative h-64 md:h-80">

          <img
            src={trip.imageUrl}
            alt={trip.destination}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80';
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end px-4 py-8">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 drop-shadow-md">{trip.name}</h1>
            <p className="text-white/90 text-lg flex items-center drop-shadow-sm"><i className="fas fa-map-marker-alt mr-2 text-blue-400"></i> {trip.destination}</p>
          </div>
        </div>

        <div className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
          <div
            ref={topNavRef}
            onScroll={() => handleScroll('top')}
            className="max-w-5xl mx-auto overflow-x-auto scrollbar-hide"
          >
            <div className="flex space-x-2 min-w-max px-4 py-2">
              {trip.itinerary.map((day, idx) => {
                const { dayMonth, weekday } = formatDate(day.date);
                const isSelected = selectedDayIdx === idx;
                return (
                  <button
                    key={day.day}
                    onClick={() => setSelectedDayIdx(idx)}
                    className={`px-4 py-2 rounded-xl transition-all flex flex-col items-center min-w-[70px] ${isSelected ? 'bg-blue-600 text-white shadow-md transform scale-105' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    <span className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>Day {day.day}</span>
                    <span className="text-xs font-bold capitalize">{weekday}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div
          className="px-4 py-8 min-h-[50vh]"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >

          <div className="space-y-8 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-50">
            {trip.itinerary[selectedDayIdx].activities.map((activity, aIdx) => {
              const bookingLink = getBookingLink(activity);
              const hasMap = activity.location && activity.location.trim().length > 3;
              return (
                <div key={aIdx} className="relative pl-12 group/item">
                  <div className="absolute left-0 top-1 w-10 h-10 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center z-10 shadow-sm"><ActivityIcon type={activity.type} /></div>
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">{activity.time}</span>
                      {activity.costEstimate && <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">{activity.costEstimate}</span>}
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">{activity.title}</h4>
                    <p className="text-slate-600 text-sm mb-4 leading-relaxed">{activity.description}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">{activity.location && <div className="flex items-center text-xs text-slate-400"><i className="fas fa-location-dot mr-1 text-slate-300"></i> {activity.location}</div>}</div>
                      <div className="flex flex-wrap gap-2">
                        {hasMap && <a href={getGoogleMapsRouteUrl(activity.location!)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all gap-2"><i className="fas fa-map-marked-alt"></i>Map</a>}
                        {bookingLink && <a href={bookingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-md gap-2"><i className="fas fa-external-link-alt"></i>{activity.type === 'HOTEL' ? 'Book Stay' : 'Book Online'}</a>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Manual Add Trigger */}
            <div className="relative pl-12 pt-4">
              <button
                onClick={() => setIsAddingActivity(true)}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold flex items-center justify-center gap-2 hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50/30 transition-all"
              >
                <i className="fas fa-plus-circle"></i> Add your own activity to Day {selectedDayIdx + 1}
              </button>
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 z-30 bg-white border-t border-slate-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] mt-8">
          <div
            ref={bottomNavRef}
            onScroll={() => handleScroll('bottom')}
            className="max-w-5xl mx-auto overflow-x-auto scrollbar-hide"
          >
            <div className="flex space-x-2 min-w-max px-4 py-3">
              {trip.itinerary.map((day, idx) => {
                const isSelected = selectedDayIdx === idx;
                return (
                  <button
                    key={day.day}
                    onClick={() => setSelectedDayIdx(idx)}
                    className={`px-4 py-2 rounded-xl transition-all flex flex-col items-center min-w-[70px] ${isSelected ? 'bg-blue-600 text-white shadow-md transform scale-105' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    <span className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>Day {day.day}</span>
                    <span className="text-xs font-bold capitalize">{formatDate(day.date).weekday}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div >
    </div >
  );
};

export default ItineraryView;
