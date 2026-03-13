import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, X, Minimize2, Maximize2, Terminal } from 'lucide-react';
import { useChat } from './useChat';
import { clsx } from 'clsx';

const ChatInterface: React.FC = () => {
  const { messages, isTyping, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      // Use a small timeout to ensure the DOM has finished rendering
      const timer = setTimeout(() => {
        scrollToBottom('auto'); // Use 'auto' for immediate scroll when opening
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [messages, isOpen, isMinimized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg transition-all hover:scale-110 z-50 flex items-center gap-2 group"
      >
        <MessageSquare className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap">
          Circuit Agent
        </span>
      </button>
    );
  }

  return (
    <div
      className={clsx(
        "fixed bottom-6 right-6 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 transition-all duration-300 flex flex-col overflow-hidden",
        isMinimized ? "w-72 h-14" : "w-96 h-[600px] max-h-[80vh]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-slate-800 border-b border-slate-700 cursor-pointer" onClick={() => !isMinimized && setIsMinimized(true)}>
        <div className="flex items-center gap-2 text-slate-100 font-semibold" onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}>
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <span>Circuit Agent</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
            className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={clsx(
                  "flex flex-col max-w-[85%]",
                  msg.role === 'user' ? "ml-auto items-end" : "items-start"
                )}
              >
                 <div className="text-xs text-slate-500 mb-1 px-1 capitalize">{msg.role}</div>
                <div
                  className={clsx(
                    "p-3 rounded-lg text-sm whitespace-pre-wrap",
                    msg.role === 'user'
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2 text-slate-500 text-xs ml-2 animate-pulse">
                <Terminal className="w-3 h-3" />
                <span>Agent is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-3 bg-slate-800 border-t border-slate-700 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe a circuit..."
              className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatInterface;
