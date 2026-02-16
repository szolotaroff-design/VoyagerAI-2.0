
import { GoogleGenAI, Type } from "@google/genai";
import { Trip, ChatMessage, GroundingLink, TripRequest } from "../types";

const extractJson = (text: string) => {
  try {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse AI response as JSON:", text);
    return null;
  }
};

const tripSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    departureLocation: { type: Type.STRING },
    destination: { type: Type.STRING },
    startDate: { type: Type.STRING },
    endDate: { type: Type.STRING },
    summary: { type: Type.STRING },
    imageUrl: { type: Type.STRING, description: "REQUIRED: A valid, public, direct image URL (jpg/png) or a stable Wikimedia/Unsplash link. DO NOT use 'source.unsplash.com' as it is deprecated." },
    destinationImages: {
      type: Type.ARRAY,
      description: "List of unique high-quality image URLs representing each major destination in the itinerary. If the user request was vague (e.g. 'seaside cities'), these images must represent the specific cities chosen by the AI.",
      items: { type: Type.STRING }
    },
    itinerary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.INTEGER },
          date: { type: Type.STRING },
          theme: { type: Type.STRING },
          activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                location: { type: Type.STRING },
                type: {
                  type: Type.STRING,
                  enum: ['FLIGHT', 'HOTEL', 'RESTAURANT', 'SIGHTSEEING', 'TRANSPORT', 'OTHER']
                },
                costEstimate: { type: Type.STRING },
                bookingUrl: {
                  type: Type.STRING,
                  description: "REQUIRED: A verified link. For buses, use reliable carriers (RegioJet, Zeleni Slon 7, Ecolines) or aggregators (Omio, Busfor). Must include specific dates."
                }
              },
              required: ["time", "title", "description", "type", "bookingUrl", "location"]
            }
          }
        },
        required: ["day", "date", "theme", "activities"]
      }
    }
  },
  required: ["name", "departureLocation", "destination", "startDate", "endDate", "summary", "itinerary", "imageUrl"]
};

const SYSTEM_INSTRUCTION = `
  You are Voyager, a world-class travel agent. 
  
  STRICT BOOKING RULES:
  1. DATE & LOCATION SPECIFICITY: Every 'bookingUrl' MUST include the trip dates and cities.
  2. TRANSPORT RELIABILITY: For buses, if FlixBus links look unreliable, use alternatives like RegioJet, Omio, Zeleni Slon 7 (for Ukraine), or official state rail/bus websites. Verify the link structure via Google Search.
  3. NO HALLUCINATIONS: Do not guess URLs. If a specific deep link is not found, use a search result on a trusted aggregator site for those dates.

  PLANNING RULES:
  - ROUND TRIP: You MUST always end the journey by returning to the starting point (departureLocation). The last day should involve travel back home.
  - DESTINATION SEQUENCE: Follow the user's city sequence exactly before returning home.
  - VAGUE REQUESTS: If the user provides a vague destination (e.g., "3 cities near the sea"), YOU must select the best specific cities based on the description and populate the itinerary accordingly.
  - THEMATIC RELEVANCE: Match events to goals (Romantic, Nightlife, Sightseeing, etc.).
  - REALISM: Max 4-5 activities per day. Account for transit.
  - LANGUAGE: Respond in the language used by the user.
  - IMAGERY: Use Google Search to find high-quality, public URLs.
    - 'imageUrl': The cover image for the trip. DO NOT use 'source.unsplash.com'. Find a direct link to a high-quality image (e.g. from Wikimedia Commons, Pexels, or a direct Unsplash photo URL like 'images.unsplash.com/...').
    - 'destinationImages': If the trip involves multiple cities or vague "vibe" requests, find a distinct, high-quality photo for EACH major destination visited.
    - NON-LATIN NAMES: If search results are in Cyrillic, ensure the image URL itself is valid and accessible globally.
`;

export const generateTripPlan = async (request: TripRequest): Promise<Trip> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Plan a trip starting from ${request.departureLocation}. 
    STRICT ROUTE SEQUENCE: ${request.destinations.filter(d => d).join(' -> ')}. 
    DATES: from ${request.startDate} to ${request.endDate}. 
    Preferred transport: ${request.transportType}. 
    Budget: ${request.totalBudget}.
    Travelers: ${request.travelers}.
    USER GOALS: ${request.goals}
    
    CRITICAL IMAGE INSTRUCTION:
    Since Unsplash direct links are unreliable, you MUST use the following dynamic image generator for 'imageUrl' and 'destinationImages'.
    Format: "https://image.pollinations.ai/prompt/cinematic%20travel%20photo%20of%20[DESTINATION_ENGLISH_NAME]%20landmark,%20sunny%20day?width=1200&height=800&nologo=true"
    
    1. Identify the MAIN destination.
    2. Translate it to ENGLISH (e.g. 'Львів' -> 'Lviv').
    3. Insert the English name into the URL template above.
    
    Examples:
    ACTION: Ensure the trip ends with a return to ${request.departureLocation}. Generate the full JSON plan.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [],
      responseMimeType: "application/json",
      responseSchema: tripSchema
    }
  });
  const tripData = extractJson(response.text);
  if (!tripData) throw new Error("Failed to generate trip plan.");

  // FORCE DYNAMIC IMAGE GENERATION IN CODE (reliable fallback)
  const mainDestination = tripData.destination || request.destinations[0] || "Travel";

  // Try to extract English-like characters to help image generation (some models struggle with Cyrillic prompts in URLs)
  // If the result is too short (e.g. was purely Cyrillic), revert to the original string.
  const englishOnly = mainDestination.replace(/[^a-zA-Z\s-]/g, '').trim();
  const safeQuery = englishOnly.length > 2 ? englishOnly : mainDestination;

  const generateImageUrl = (query: string) => {
    // Determine safe query for this specific call
    const cleanQ = query.replace(/[^a-zA-Z\s-]/g, '').trim();
    const finalQ = cleanQ.length > 2 ? cleanQ : query;
    return `https://image.pollinations.ai/prompt/travel%20photo%20of%20${encodeURIComponent(finalQ)}%20landmark,%20sunny%20day?width=1200&height=800&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
  };

  // 1. Primary Image
  let finalImage = tripData.imageUrl;
  // If invalid, missing, or Unsplash (unreliable), replace it.
  if (!finalImage || !finalImage.includes('http') || finalImage.includes('unsplash.com')) {
    finalImage = generateImageUrl(safeQuery);
  }

  // 2. Destination Images (Gallery)
  let finalDestImages = tripData.destinationImages || [];
  if (finalDestImages.length === 0 || !finalDestImages[0].includes('http') || finalDestImages.some(img => img.includes('unsplash.com'))) {
    const destinationsToUse = request.destinations.length > 0 ? request.destinations : [mainDestination];
    finalDestImages = destinationsToUse.map(d => generateImageUrl(d));
  }

  return { ...tripData, imageUrl: finalImage, destinationImages: finalDestImages, id: crypto.randomUUID(), sources: [], editCount: 0 };
};

export const editTripPlan = async (currentTrip: Trip, editPrompt: string): Promise<Trip> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Update this trip: "${editPrompt}". Current trip data: ${JSON.stringify(currentTrip)}.
    Ensure the return to ${currentTrip.departureLocation} is maintained.`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: tripSchema
    }
  });
  const tripData = extractJson(response.text);
  if (!tripData) throw new Error("Failed to update trip plan.");
  return { ...currentTrip, ...tripData, id: currentTrip.id };
};

export const startVoyagerChat = () => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });
};

export const finalizeTripFromChat = async (history: ChatMessage[]): Promise<Trip | null> => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
  const historyText = history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Based on the conversation, generate a full JSON itinerary.
    
    CRITICAL IMAGE INSTRUCTION:
    Use the dynamic image generator for 'imageUrl':
    Format: "https://image.pollinations.ai/prompt/cinematic%20travel%20photo%20of%20[DESTINATION_ENGLISH_NAME]%20landmark,%20sunny%20day?width=1200&height=800&nologo=true"
    
    Ensure the user returns home at the end.\n\nCONVERSATION:\n${historyText}`,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [],
      responseMimeType: "application/json",
      responseSchema: tripSchema,
    }
  });
  const tripData = extractJson(response.text);
  if (!tripData) return null;

  // FORCE GENERATION:
  const mainDestination = tripData.destination || "Travel";

  // Try to extract English-like characters to help image generation (some models struggle with Cyrillic prompts in URLs)
  // If the result is too short (e.g. was purely Cyrillic), revert to the original string.
  const englishOnly = mainDestination.replace(/[^a-zA-Z\s-]/g, '').trim();
  const safeQuery = englishOnly.length > 2 ? englishOnly : mainDestination;

  const generateImageUrl = (query: string) => {
    const cleanQ = query.replace(/[^a-zA-Z\s-]/g, '').trim();
    const finalQ = cleanQ.length > 2 ? cleanQ : query;
    return `https://image.pollinations.ai/prompt/travel%20photo%20of%20${encodeURIComponent(finalQ)}%20landmark,%20sunny%20day?width=1200&height=800&nologo=true&seed=${Math.floor(Math.random() * 1000)}`;
  };

  let finalImage = tripData.imageUrl;
  if (!finalImage || !finalImage.includes('http') || finalImage.includes('unsplash.com')) {
    finalImage = generateImageUrl(safeQuery);
  }

  return {
    ...tripData,
    id: crypto.randomUUID(),
    imageUrl: finalImage,
    sources: [],
    editCount: 0
  };
};
