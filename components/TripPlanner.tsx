
import React, { useState, useRef } from 'react';
import { generateTripPlan } from '../services/geminiService';
import { TripRequest, Trip } from '../types';
import { LocationService } from '../services/locationService';
import { useTripPlanner } from '../hooks/useTripPlanner';

interface TripPlannerProps {
  onTripGenerated: (trip: Trip) => void;
  onCancel: () => void;
  isPayable: boolean;
}

const TripPlanner: React.FC<TripPlannerProps> = ({ onTripGenerated, onCancel, isPayable }) => {
  const {
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
  } = useTripPlanner();

  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLocationSuggestion, setShowLocationSuggestion] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Smart Suggestions Data
  const POPULAR_DESTINATIONS = [
    { city: "Paris, France", type: "Romance" },
    { city: "Tokyo, Japan", type: "Culture" },
    { city: "Rome, Italy", type: "History" },
    { city: "Bali, Indonesia", type: "Nature" },
    { city: "New York, USA", type: "City Life" },
    { city: "Santorini, Greece", type: "Views" },
    { city: "Dubai, UAE", type: "Luxury" },
    { city: "Kyoto, Japan", type: "Tradition" },
    { city: "Barcelona, Spain", type: "Food" },
    { city: "London, UK", type: "History" }
  ];

  const TRIP_GOALS = [
    { id: "Relaxation", icon: "fa-umbrella-beach", label: "Chill & Relaxation" },
    { id: "Adventure", icon: "fa-hiking", label: "Outdoor Adventure" },
    { id: "Culture", icon: "fa-landmark", label: "Culture & History" },
    { id: "Food", icon: "fa-utensils", label: "Food & Drink" },
    { id: "Family", icon: "fa-child", label: "Family Fun" },
    { id: "Romance", icon: "fa-heart", label: "Romantic Escape" },
    { id: "Nature", icon: "fa-tree", label: "Nature & Wildlife" },
    { id: "Shopping", icon: "fa-shopping-bag", label: "Shopping Spree" },
    { id: "Custom", icon: "fa-wand-magic-sparkles", label: "Create your own" }
  ];



  const [showCustomGoal, setShowCustomGoal] = useState(false);
  const [customPlaceholder, setCustomPlaceholder] = useState("");
  const [showVibeInfo, setShowVibeInfo] = useState(false);

  // Typewriter effect for custom placeholder
  React.useEffect(() => {
    if (!showCustomGoal) return;

    const phrases = [
      "A Harry Potter style journey through majestic castles and hidden alleys...",
      "Tracing the footsteps of ancient samurais in rural Japan...",
      "A cyber-punk photographic adventure in neon-lit cities...",
      "A romantic escape to a glass cabin under the Northern Lights...",
      "Living like a local: pottery workshops and hidden jazz bars..."
    ];

    let currentPhraseIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let timeoutId: any;

    const type = () => {
      const currentPhrase = phrases[currentPhraseIndex];

      if (isDeleting) {
        setCustomPlaceholder(prev => prev.slice(0, -1));
        currentCharIndex--;
      } else {
        setCustomPlaceholder(currentPhrase.slice(0, currentCharIndex + 1));
        currentCharIndex++;
      }

      let typeSpeed = isDeleting ? 30 : 50;

      if (!isDeleting && currentCharIndex === currentPhrase.length) {
        typeSpeed = 2000; // Pause at end
        isDeleting = true;
      } else if (isDeleting && currentCharIndex === 0) {
        isDeleting = false;
        currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
        typeSpeed = 500; // Pause before new phrase
      }

      timeoutId = setTimeout(type, typeSpeed);
    };

    type();
    return () => clearTimeout(timeoutId);
  }, [showCustomGoal]);

  const handleGoalToggle = (goalLabel: string) => {
    if (goalLabel === "Create your own") {
      setShowCustomGoal(true);
      setFormData({ ...formData, goals: "" });
    } else {
      setShowCustomGoal(false);
      setFormData({ ...formData, goals: goalLabel });
    }
  };

  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);

  const handlePlanTrip = async () => {
    setIsPlanning(true);
    setError(null);
    try {
      const trip = await generateTripPlan(formData);
      onTripGenerated(trip);
    } catch (err: any) {
      setError(err.message || 'Error planning your trip. Please try again.');
      setIsPlanning(false);
    }
  };


  if (isPlanning) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[40px] p-12 max-w-lg w-full shadow-2xl text-center border border-white/20">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-8 border-blue-50 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-t-8 border-blue-600 animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-globe-europe text-4xl text-blue-600"></i>
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4">Voyager is working...</h2>
          <p className="text-slate-500 mb-8 italic">"Finding the best flights and hotels for your route to {formData.destinations.filter((d: string) => d).join(', ')}"</p>
          <div className="space-y-4 max-w-xs mx-auto text-left">
            <div className="flex items-center text-slate-600 animate-bounce delay-75">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3"><i className="fas fa-check text-xs text-green-600"></i></div>
              <span className="text-sm font-bold">Mapping route...</span>
            </div>
            <div className="flex items-center text-slate-600 animate-bounce delay-150">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3"><i className="fas fa-search text-xs text-blue-600"></i></div>
              <span className="text-sm font-bold">Fetching live booking links...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="bg-white rounded-[40px] shadow-2xl p-6 md:p-10 border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -z-10 opacity-50"></div>

        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">New Adventure</h2>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${step >= s ? 'w-8 bg-blue-600' : 'w-4 bg-slate-200'}`}></div>
              ))}
            </div>
          </div>
          <button onClick={onCancel} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {isPayable && step === 1 && (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
              <i className="fas fa-credit-card"></i>
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">Premium Plan: $2.99</p>
              <p className="text-xs text-blue-600">Free trial used. Payment required to unlock your next plan.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-start border border-red-100">
            <i className="fas fa-exclamation-circle mt-1 mr-2"></i>
            {error}
          </div>
        )}

        {/* Step 1: Where and When */}
        {step === 1 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Starting Point</label>
              <div className="relative">
                <i className="fas fa-house absolute left-5 top-1/2 -translate-y-1/2 text-blue-500"></i>
                <input
                  type="text"
                  value={formData.departureLocation}
                  onChange={(e) => {
                    setFormData({ ...formData, departureLocation: e.target.value });
                    if (e.target.value.length > 0) setShowLocationSuggestion(false);
                  }}
                  onFocus={() => {
                    if (formData.departureLocation === '') setShowLocationSuggestion(true);
                  }}
                  onBlur={() => {
                    // Don't hide if locating, otherwise small delay
                    if (!isLocating) {
                      setTimeout(() => setShowLocationSuggestion(false), 200);
                    }
                  }}
                  placeholder="E.g. New York, NY"
                  className="w-full p-5 pl-14 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all text-lg font-bold text-slate-800"
                />
                {showLocationSuggestion && formData.departureLocation === '' && (
                  <div
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-blue-100 z-10 overflow-hidden cursor-pointer hover:bg-blue-50 transition-colors animate-fadeIn"
                    onClick={async () => {
                      // Don't hide yet! Show spinner first.
                      // setShowLocationSuggestion(false);
                      setIsLocating(true);
                      try {
                        const position = await LocationService.getCurrentPosition();
                        const result = await LocationService.getCityFromCoordinates(position.lat, position.lng);

                        setFormData({
                          ...formData,
                          departureLocation: result.fullAddress,
                          departureGeo: {
                            lat: result.coordinates.lat,
                            lng: result.coordinates.lng,
                            resolvedAddress: result.fullAddress
                          }
                        });
                        // Now we can hide it
                        setShowLocationSuggestion(false);
                      } catch (err) {
                        console.error(err);
                        setError('Could not grab your location. Please check browser permissions.');
                        setTimeout(() => setError(null), 3000);
                      } finally {
                        setIsLocating(false);
                        // Ensure it closes even if error, but maybe give user time to read error?
                        // Actually if error, we probably want to keep it open or close it?
                        // Let's close it to avoid stuck UI, the Error Toast handles the message.
                        setShowLocationSuggestion(false);
                      }
                    }}
                  >
                    <div className="p-4 flex items-center gap-3">
                      {isLocating ? (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center animate-spin">
                          <i className="fas fa-circle-notch text-blue-600"></i>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <i className="fas fa-location-crosshairs"></i>
                        </div>
                      )}

                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{isLocating ? 'Locating you...' : 'Use Current Location'}</span>
                        {!isLocating && <span className="text-xs text-slate-400">Tap to use your GPS</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest">Destinations</label>
              </div>



              {showDestHint && (
                <div className="absolute left-0 right-0 top-10 z-20 p-5 bg-blue-600 text-white rounded-3xl shadow-2xl animate-fadeIn border border-blue-400">
                  <button
                    onClick={() => setShowDestHint(false)}
                    className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  >
                    <i className="fas fa-times text-[10px]"></i>
                  </button>
                  <p className="text-xs leading-relaxed">
                    <span className="font-black text-blue-100 block mb-1 uppercase tracking-wider text-[10px]">Voyager Advice</span>
                    You can enter specific city names (like <span className="font-bold underline">Paris</span>) or just describe what you're looking for, like <span className="font-bold">"Somewhere warm with nature"</span> or <span className="font-bold">"Best hiking spots in Europe"</span>. I'll research and build the route for you!
                  </p>
                  <div className="absolute -top-2 left-4 w-4 h-4 bg-blue-600 rotate-45 border-l border-t border-blue-400"></div>
                </div>
              )}

              <div className="space-y-4">
                {formData.destinations.map((dest: string, idx: number) => (
                  <div key={idx} className="relative group flex items-center gap-2">
                    <div className="relative flex-1">
                      <i className={`fas ${idx === 0 ? 'fa-map-pin' : 'fa-location-arrow'} absolute left-5 top-1/2 -translate-y-1/2 text-blue-500`}></i>
                      <input
                        type="text"
                        value={dest}
                        onChange={(e) => handleDestinationChange(idx, e.target.value)}
                        placeholder={idx === 0 ? "E.g. London, UK" : "Next city (e.g. Rome)"}
                        className="w-full p-5 pl-14 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all text-lg font-bold text-slate-800"
                        list="popularDestinations"
                      />
                      <datalist id="popularDestinations">
                        {POPULAR_DESTINATIONS.map((d, i) => (
                          <option key={i} value={d.city}>{d.type}</option>
                        ))}
                      </datalist>
                    </div>
                    {formData.destinations.length > 1 && (
                      <button
                        onClick={() => removeDestination(idx)}
                        className="p-4 text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <i className="fas fa-trash-can"></i>
                      </button>
                    )}
                  </div>
                ))}

                <button
                  onClick={addDestination}
                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold flex items-center justify-center gap-2 hover:border-blue-300 hover:text-blue-500 transition-all"
                >
                  <i className="fas fa-plus-circle"></i> Add city (multi-city tour)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Departure Date</label>
                <div
                  className="relative p-5 rounded-2xl bg-slate-50 border-2 border-transparent hover:bg-blue-50 hover:border-blue-100 transition-all cursor-pointer group"
                  onClick={() => startRef.current?.showPicker()}
                >
                  <input
                    ref={startRef}
                    type="date"
                    min={today}
                    value={formData.startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full bg-transparent outline-none font-bold text-slate-800 cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Return Date</label>
                <div
                  className="relative p-5 rounded-2xl bg-slate-50 border-2 border-transparent hover:bg-blue-50 hover:border-blue-100 transition-all cursor-pointer group"
                  onClick={() => endRef.current?.showPicker()}
                >
                  <input
                    ref={endRef}
                    type="date"
                    min={formData.startDate || today}
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full bg-transparent outline-none font-bold text-slate-800 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => isStep1Valid && setStep(2)}
              disabled={!isStep1Valid}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-2xl font-black shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 group"
            >
              Next <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </button>
          </div>
        )}

        {/* Step 2: Goals */}
        {step === 2 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <div className="flex items-center gap-2 mb-6 relative">
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest">Curate Your Vibe</label>
                <button
                  onMouseEnter={() => setShowVibeInfo(true)}
                  onMouseLeave={() => setShowVibeInfo(false)}
                  onClick={() => setShowVibeInfo(!showVibeInfo)}
                  className="w-5 h-5 rounded-full bg-slate-100 text-slate-400 hover:text-blue-500 hover:bg-blue-50 flex items-center justify-center transition-all"
                >
                  <i className="fas fa-info text-[10px]"></i>
                </button>

                {showVibeInfo && (
                  <div className="absolute left-0 top-8 z-10 w-64 p-4 bg-slate-900 text-white text-xs rounded-xl shadow-xl animate-fadeIn">
                    <div className="absolute -top-1 left-3 w-3 h-3 bg-slate-900 rotate-45"></div>
                    <p className="leading-relaxed font-medium">
                      We use this to personalize your entire itinerary.
                      <span className="block mt-2 text-slate-400">Example: If you pick "Romantic Escape", AI will prioritize candlelit dinners and scenic sunset spots.</span>
                    </p>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {TRIP_GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => handleGoalToggle(goal.label)}
                    className={`aspect-square rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 p-2 ${(formData.goals === goal.label && !showCustomGoal) || (goal.label === "Create your own" && showCustomGoal)
                      ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-blue-200 hover:bg-white'
                      }`}
                  >
                    <i className={`fas ${goal.icon} text-lg mb-0.5`}></i>
                    <span className="text-[10px] font-bold text-center leading-tight">{goal.label}</span>
                  </button>
                ))}
              </div>

              {showCustomGoal && (
                <div className="mt-4 animate-fadeIn">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Describe your perfect trip</label>
                  <textarea
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                    placeholder={customPlaceholder}
                    className="w-full h-24 p-4 rounded-2xl bg-slate-50 border-2 border-blue-200 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 text-sm resize-none"
                    autoFocus
                  ></textarea>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all">Back</button>
              <button
                onClick={() => setStep(3)}
                disabled={!formData.goals || (showCustomGoal && formData.goals.trim().length < 3)}
                className="flex-[2] py-5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white rounded-2xl font-black shadow-xl shadow-blue-200 transition-all"
              >
                Looks good, next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Transport & Budget */}
        {step === 3 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              {/* Travelers Counter - Moved here */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <i className="fas fa-users"></i>
                  </div>
                  <div>
                    <span className="block text-sm font-black text-slate-800 uppercase tracking-wide">Travelers</span>
                    <span className="text-xs text-slate-400 font-medium">How many people going?</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-100 w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    onClick={() => setFormData({ ...formData, travelers: Math.max(1, (formData.travelers || 1) - 1) })}
                    className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors"
                  ><i className="fas fa-minus text-xs"></i></button>
                  <span className="font-black text-slate-800 w-6 text-center text-lg">{formData.travelers || 1}</span>
                  <button
                    onClick={() => setFormData({ ...formData, travelers: (formData.travelers || 1) + 1 })}
                    className="w-10 h-10 sm:w-8 sm:h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors"
                  ><i className="fas fa-plus text-xs"></i></button>
                </div>
              </div>
            </div>


            <div>
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Preferred Transport</label>

              {/* Main Transport Type Selection */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setFormData({
                    ...formData,
                    transportMode: 'car',
                    transportType: 'Car',
                    publicClass: undefined
                  })}
                  className={`relative p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-4 group overflow-hidden ${formData.transportMode === 'car'
                    ? 'border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-200 scale-[1.02]'
                    : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-white hover:border-blue-200 hover:shadow-lg'
                    }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${formData.transportMode === 'car' ? 'bg-white/20 text-white' : 'bg-white text-slate-300 group-hover:text-blue-500'}`}>
                    <i className="fas fa-car"></i>
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest">Car</span>
                  {/* Decorative */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                </button>

                <button
                  onClick={() => setFormData({
                    ...formData,
                    transportMode: 'public',
                    transportType: 'Public',
                    carOption: undefined
                  })}
                  className={`relative p-6 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-4 group overflow-hidden ${formData.transportMode === 'public'
                    ? 'border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-200 scale-[1.02]'
                    : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-white hover:border-blue-200 hover:shadow-lg'
                    }`}
                >
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${formData.transportMode === 'public' ? 'bg-white/20 text-white' : 'bg-white text-slate-300 group-hover:text-blue-500'}`}>
                    <i className="fas fa-plane-departure"></i>
                  </div>
                  <span className="text-sm font-black uppercase tracking-widest">Public</span>
                  {/* Decorative */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                </button>
              </div>

              {/* Sub-options for Car */}
              {formData.transportMode === 'car' && (
                <div className="animate-fadeIn mt-6 p-1 bg-slate-100/50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-1">
                  <button
                    onClick={() => setFormData({ ...formData, carOption: 'own', transportType: 'Own car' })}
                    className={`py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3 ${formData.carOption === 'own'
                      ? 'bg-white text-blue-600 shadow-sm font-bold'
                      : 'text-slate-400 font-medium hover:text-slate-600'
                      }`}
                  >
                    <i className="fas fa-key"></i>
                    <span className="text-xs uppercase tracking-wider">Own Car</span>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, carOption: 'rental', transportType: 'Rental car' })}
                    className={`py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3 ${formData.carOption === 'rental'
                      ? 'bg-white text-blue-600 shadow-sm font-bold'
                      : 'text-slate-400 font-medium hover:text-slate-600'
                      }`}
                  >
                    <i className="fas fa-car-side"></i>
                    <span className="text-xs uppercase tracking-wider">Rental</span>
                  </button>
                  {formData.carOption === 'own' && (
                    <div className="col-span-2 mt-2 mx-2 p-3 bg-amber-50 text-amber-700 text-[10px] rounded-xl flex items-start gap-2 leading-tight">
                      <i className="fas fa-triangle-exclamation mt-0.5"></i>
                      <span>We'll only plan routes reachable by land. No ocean crossings.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-options for Public Transport */}
              {formData.transportMode === 'public' && (
                <div className="animate-fadeIn mt-6 p-1 bg-slate-100/50 rounded-2xl border border-slate-100 grid grid-cols-3 gap-1">
                  <button
                    onClick={() => setFormData({ ...formData, publicClass: 'economy', transportType: 'Budget' })}
                    className={`py-3 px-2 rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${formData.publicClass === 'economy'
                      ? 'bg-white text-blue-600 shadow-sm font-bold'
                      : 'text-slate-400 font-medium hover:text-slate-600'
                      }`}
                  >
                    <span className="text-[10px] uppercase tracking-wider">Economy</span>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, publicClass: 'standard', transportType: 'Public transport' })}
                    className={`py-3 px-2 rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${formData.publicClass === 'standard'
                      ? 'bg-white text-blue-600 shadow-sm font-bold'
                      : 'text-slate-400 font-medium hover:text-slate-600'
                      }`}
                  >
                    <span className="text-[10px] uppercase tracking-wider">Standard</span>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, publicClass: 'first', transportType: 'Comfort' })}
                    className={`py-3 px-2 rounded-xl transition-all flex flex-col items-center justify-center gap-1 ${formData.publicClass === 'first'
                      ? 'bg-white text-blue-600 shadow-sm font-bold'
                      : 'text-slate-400 font-medium hover:text-slate-600'
                      }`}
                  >
                    <span className="text-[10px] uppercase tracking-wider">First Class</span>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">


              <div className="flex items-center gap-3">
                <i className="fas fa-dollar-sign text-blue-600 text-xl"></i>
                <label className="text-xl font-bold text-slate-800">Total Budget</label>
              </div>

              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  value={formData.totalBudget}
                  onChange={(e) => setFormData({ ...formData, totalBudget: e.target.value })}
                  placeholder="2000"
                  className="w-full p-5 pl-10 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all text-2xl font-black text-slate-800"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {['500', '1000', '2000', '5000', '10000'].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setFormData({ ...formData, totalBudget: amount })}
                    className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    ${amount}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all">Back</button>
              <button onClick={handlePlanTrip} className="flex-[2] py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2">
                <i className="fas fa-wand-magic-sparkles"></i> Create Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div >
  );
};

export default TripPlanner;
