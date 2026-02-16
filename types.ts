
export interface GroundingLink {
  uri: string;
  title: string;
}

export interface Activity {
  time: string;
  title: string;
  description: string;
  location?: string;
  type: 'FLIGHT' | 'HOTEL' | 'RESTAURANT' | 'SIGHTSEEING' | 'TRANSPORT' | 'OTHER';
  costEstimate?: string;
  bookingUrl?: string;
  groundingUrls?: GroundingLink[];
}

export interface DailyPlan {
  day: number;
  date: string;
  theme: string;
  activities: Activity[];
}

export interface Trip {
  id: string;
  name: string;
  departureLocation: string;
  destination: string;
  startDate: string;
  endDate: string;
  summary: string;
  itinerary: DailyPlan[];
  imageUrl: string;
  destinationImages?: string[]; // Array of images for multi-city trips or collages
  sources: GroundingLink[];
  originalRequest?: any;
  editCount: number; // Track how many times the trip has been edited
  totalBudget?: string;
  currency?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isSystem?: boolean;
}

export type AppView = 'DASHBOARD' | 'CHAT' | 'PLANNER' | 'TRIP_DETAILS';

export interface TripRequest {
  departureLocation: string;
  departureGeo?: {
    lat: number;
    lng: number;
    resolvedAddress: string;
  };
  destinations: string[];
  startDate: string;
  endDate: string;
  transportType: string;
  transportMode: 'car' | 'public' | null;
  carOption?: 'own' | 'rental';
  publicClass?: 'economy' | 'standard' | 'first';
  totalBudget: string;
  goals: string;
  travelers: number;
}
