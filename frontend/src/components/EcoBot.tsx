import React, { useState } from 'react';
import { Bot } from 'lucide-react';
import { api } from '../services/api';

export const EcoBot: React.FC = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot', text: string }>>([
    { sender: 'bot', text: 'Hello! I am EcoBot, your sustainability AI advisor. Ask me anything about reducing emissions or your EcoTrack achievements!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;
    
    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setChatInput('');
    setChatLoading(true);
    
    try {
      const res = await api.carbon.chat(userMsg);
      setChatMessages(prev => [...prev, { sender: 'bot', text: res.reply }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I had trouble connecting to the advisory model. Please try again!' }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <>
      {/* Floating AI Chatbot Advisor Button */}
      <button 
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-eco-600 text-white shadow-xl shadow-eco-600/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center z-50 border border-white/10"
        title="EcoBot Advisory AI"
      >
        <Bot className="w-6 h-6" />
      </button>

      {chatOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 max-h-[500px] h-[450px] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-50 overflow-hidden text-left">
          {/* Header */}
          <div className="bg-eco-600 text-white px-5 py-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 fill-current" />
              <div>
                <h4 className="font-extrabold text-sm leading-tight">EcoBot AI Advisor</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping" />
                  <span className="text-3xs font-black opacity-80 uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setChatOpen(false)} 
              className="text-white hover:opacity-85 text-xs font-bold px-1.5 py-0.5 rounded border border-white/20"
            >
              Close
            </button>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 font-semibold text-xs leading-normal">
            {chatMessages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  msg.sender === 'user'
                    ? 'self-end bg-eco-600 text-white rounded-br-none'
                    : 'self-start bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                }`}
              >
                {msg.text}
              </div>
            ))}
            {chatLoading && (
              <div className="self-start bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl rounded-bl-none px-4 py-2.5 italic">
                EcoBot is drafting advice...
              </div>
            )}
          </div>

          {/* Send Input */}
          <form onSubmit={handleSendChat} className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/60 flex gap-2 shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about your emissions or tips..."
              className="flex-1 px-4 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-eco-500 transition-colors"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 bg-eco-600 text-white rounded-xl shadow-md shadow-eco-600/10 hover:bg-eco-700 disabled:opacity-40 text-xs font-bold"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default EcoBot;
