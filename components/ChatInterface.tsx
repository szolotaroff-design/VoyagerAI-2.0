
import React, { useState, useEffect, useRef } from 'react';
import { startVoyagerChat, finalizeTripFromChat } from '../services/geminiService';
import { ChatMessage, Trip } from '../types';

interface ChatInterfaceProps {
  onTripGenerated: (trip: Trip) => void;
  onCancel: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onTripGenerated, onCancel }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const chatSessionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      chatSessionRef.current = startVoyagerChat();
      setIsTyping(true);
      const initialMessage = "Hey! Ready for an adventure? \n\nTell me where you're thinking of heading, or if you need a recommendation for your next dates.";
      setMessages([{ role: 'model', text: initialMessage }]);
      setIsTyping(false);
    };
    initChat();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping || isFinalizing) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    
    setIsTyping(true);
    try {
      const result = await chatSessionRef.current.sendMessage({ message: userMsg });
      let responseText = result.text;
      
      if (responseText.includes('[INTENT: GENERATE_TRIP_PLAN]')) {
        const cleanText = responseText.replace('[INTENT: GENERATE_TRIP_PLAN]', '').trim();
        setMessages(prev => [...prev, { role: 'model', text: cleanText || "Perfect. Building your itinerary now..." }]);
        handleFinalize([...messages, { role: 'user', text: userMsg }, { role: 'model', text: cleanText }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: responseText }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', text: "Snagged an error. Can you say that again?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFinalize = async (history: ChatMessage[]) => {
    setIsFinalizing(true);
    try {
      const trip = await finalizeTripFromChat(history);
      if (trip) {
        onTripGenerated(trip);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: "Problem building the plan. Let's try again." }]);
        setIsFinalizing(false);
      }
    } catch (err) {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto h-[75vh] flex flex-col bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden animate-fadeIn">
      {/* Header */}
      <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-white text-slate-800 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <i className="fas fa-paper-plane text-sm"></i>
          </div>
          <div>
            <h2 className="font-bold text-base leading-tight">Voyager</h2>
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Concierge
            </div>
          </div>
        </div>
        <button onClick={onCancel} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
          <i className="fas fa-times text-sm"></i>
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4 scroll-smooth bg-slate-50/30">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideInUp`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
            }`}>
              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
        )}
        {isFinalizing && (
          <div className="text-center py-8 bg-blue-600 rounded-2xl text-white mx-2 shadow-xl animate-pulse">
            <i className="fas fa-wand-magic-sparkles text-xl mb-2"></i>
            <p className="font-bold text-sm">Building your itinerary...</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-50">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isFinalizing}
            placeholder="Type here..."
            className="flex-1 p-4 pr-12 rounded-xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all text-sm font-medium text-slate-800"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping || isFinalizing}
            className="absolute right-1.5 w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:bg-blue-700 disabled:bg-slate-200 transition-all shadow-lg shadow-blue-50"
          >
            <i className="fas fa-arrow-up text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
