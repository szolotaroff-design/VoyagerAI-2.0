import React, { useState, useEffect } from 'react';
import { AppView, Trip } from './types';
import TripCard from './components/TripCard';
import ItineraryView from './components/ItineraryView';
import TripPlanner from './components/TripPlanner';
import FeedbackModal from './components/FeedbackModal';
import { useTripManager } from './hooks/useTripManager';
import { supabase } from './services/supabase';
import { Auth } from './components/Auth';
import { PasswordReset } from './components/PasswordReset';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('DASHBOARD');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  useEffect(() => {
    // Check for recovery flow in URL
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setIsPasswordReset(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordReset(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Use the new hook for data management
  const {
    trips,
    selectedTrip,
    setSelectedTrip,
    freeTrialUsed,
    addTrip,
    updateTrip,
    deleteTrip,
    paymentModal,
    requirePayment,
    closePaymentModal
  } = useTripManager(session);

  // Watch for trip selection to auto-switch view (e.g. after generation)
  // Only switch if we are not already there, to avoid loops or overriding 'DASHBOARD' on initial load?
  // Initial load: selectedTrip is null.
  // After generation: selectedTrip becomes populated.
  // We need to be careful not to switch if user just clicks 'Back'.
  // Let's handle explicit view switching in handlers instead of useEffect where possible, 
  // but for the payment callback case, the hook controls the flow.
  // Solution: The hook updates 'selectedTrip'. We can trust that if selectedTrip changes and is not null, we probably want to see it?
  // Actually, 'handleTripClick' sets selectedTrip. 'addTrip' sets selectedTrip.
  // So yes, usually updates to selectedTrip mean we want to view it.
  useEffect(() => {
    if (selectedTrip) {
      setView('TRIP_DETAILS');
    }
  }, [selectedTrip]);

  const handleTripGenerated = (newTrip: Trip) => {
    addTrip(newTrip);
    // View switch happens in useEffect when selectedTrip updates
  };

  const handleTripClick = (trip: Trip) => {
    setSelectedTrip(trip);
    // View switch happens in useEffect
  };

  const handleBackToDashboard = () => {
    setSelectedTrip(null);
    setView('DASHBOARD');
  };

  const processPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      paymentModal?.callback();
    }, 1500);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setSession(null); // Force state update for reliable redirect
    }
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  if (isPasswordReset) {
    return <PasswordReset onSuccess={() => {
      setIsPasswordReset(false);
      setSession(null); // Explicitly ensure we show Auth screen
    }} />;
  }

  return (
    <div className="min-h-screen aurora-bg-light">
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

      {/* Payment Modal */}
      {paymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-sm w-full shadow-2xl text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
              <i className="fas fa-credit-card text-2xl"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Unlock Journey</h2>
            <p className="text-slate-500 mb-8">You've reached the limit of free plans. Pay once to unlock this full itinerary forever.</p>
            <div className="bg-slate-50 rounded-2xl p-6 mb-8 flex justify-between items-center">
              <span className="font-bold text-slate-400 uppercase tracking-widest text-xs">Total</span>
              <span className="text-3xl font-black text-slate-800">{paymentModal.amount}</span>
            </div>
            <button
              onClick={processPayment}
              disabled={isProcessingPayment}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-3"
            >
              {isProcessingPayment ? <i className="fas fa-circle-notch animate-spin"></i> : "Pay Now"}
            </button>
            <button onClick={closePaymentModal} className="mt-4 text-slate-400 hover:text-slate-600 font-bold text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 glass shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleBackToDashboard}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
              <i className="fas fa-globe-americas text-white text-lg"></i>
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-slate-800">Voyager<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">AI</span></span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">

            <button
              onClick={handleLogout}
              className="p-3 text-slate-400 hover:text-red-600 transition-colors"
              title="Sign Out"
            >
              <i className="fas fa-sign-out-alt text-xl"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'DASHBOARD' && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-10">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">My Adventures</h1>
                <p className="text-slate-500 text-xs sm:text-base">Your AI-curated travel experiences.</p>
              </div>
              {trips.length > 0 && (
                <button
                  onClick={() => setView('PLANNER')}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-slate-200 shrink-0"
                >
                  <i className="fas fa-plus"></i> <span className="hidden xs:inline">Plan Trip</span>
                </button>
              )}
            </div>
            {trips.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {trips.map(trip => (
                  <TripCard key={trip.id} trip={trip} onClick={handleTripClick} onDelete={deleteTrip} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-200">
                <i className="fas fa-map-marked-alt text-4xl text-slate-200 mb-6"></i>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">No trips yet</h2>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button onClick={() => setView('PLANNER')} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-xl">Create New Plan</button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'PLANNER' && (
          <TripPlanner
            onTripGenerated={handleTripGenerated}
            onCancel={handleBackToDashboard}
            isPayable={freeTrialUsed}
          />
        )}

        {view === 'TRIP_DETAILS' && selectedTrip && (
          <ItineraryView
            trip={selectedTrip}
            onBack={handleBackToDashboard}
            onUpdateTrip={updateTrip}
            onPaymentRequired={requirePayment}
          />
        )}
      </main>

      {/* Floating feedback button (Mobile First - Intercom Style) */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsFeedbackOpen(true)}
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-300 flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
        >
          <i className="fas fa-comment-dots text-2xl"></i>
        </button>
      </div>
    </div>
  );
};

export default App;
