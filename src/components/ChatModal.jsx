'use client';

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X } from 'lucide-react';
import ChatWindow from './chat/ChatWindow';
import ChatInput from './chat/ChatInput';
import { useChat } from '../hooks/useChat';
import { getHelpPrompt } from '../utils/chatConstants';

/**
 * ChatModal Component
 * Side drawer modal for ChatWidget accessible from Header
 * Automatically detects context based on current page/route
 */
const ChatModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [contextType, setContextType] = useState('');
  const [contextData, setContextData] = useState({});
  const location = useLocation();

  const { messages, isLoading, error, status, sendMessage, clearHistory } = useChat(contextType, contextData);

  // Detect context based on current page
  useEffect(() => {
    const detectContext = async () => {
      const pathname = location.pathname;

      // Job Applications page (Employer): /jobs/:id/applications
      if (pathname.match(/^\/jobs\/\d+\/applications$/)) {
        const jobId = pathname.split('/')[2]; // Extract job id from /jobs/:id/applications
        setContextType('applications');
        setContextData({
          job_id: parseInt(jobId),
        });
      }
      // Job detail page: /jobs/:id
      else if (pathname.match(/^\/jobs\/\d+$/)) {
        const jobId = pathname.split('/').pop();
        setContextType('job');
        setContextData({
          job_id: parseInt(jobId),
        });
      }
      // General Applications page (Job Seeker): /applications
      else if (pathname === '/applications') {
        setContextType('applications');
        setContextData({});
      }
      // Profile/Resume page
      else if (pathname.includes('/profile')) {
        setContextType('profile');
        setContextData({});
      }
      // Event pages
      else if (pathname.includes('/events')) {
        setContextType('event');
        setContextData({});
      }
      // Default: generic context
      else {
        setContextType('');
        setContextData({});
      }
    };

    if (isOpen) {
      detectContext();
    }
  }, [location.pathname, isOpen]);

  const handleSendMessage = async (message) => {
    await sendMessage(message);
  };

  const handleClearHistory = async () => {
    if (window.confirm('Clear all chat history? This cannot be undone.')) {
      await clearHistory();
    }
  };

  return (
    <>
      {/* Chat Button in Header */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
        title="Open AI Chat"
      >
        <MessageCircle size={20} className="animate-pulse" />
        <span>AI Chat</span>
      </button>

      {/* Side Drawer Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 transition-opacity duration-300 backdrop-blur-sm fade-in"
          onClick={() => setIsOpen(false)}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}
        />
      )}

      {/* Side Drawer Panel - Complete Hidden When Closed */}
      <div
        className={`fixed right-0 top-0 h-screen w-[480px] bg-gradient-to-b from-white to-gray-50 shadow-2xl z-50 flex flex-col transition-all duration-300 ease-in-out border-l border-gray-200 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none'
          }`}
      >
        {/* Header - Integrated with Navbar Style */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-lg border-b border-blue-700">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 rounded-full opacity-20 animate-pulse"></div>
              <MessageCircle size={26} className="relative z-10" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-lg leading-tight">IntelliHire AI</h3>
              <p className="text-xs text-blue-100 flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${status?.service_available ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                <span>{status?.service_available ? 'Online & Ready' : 'Offline'}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="flex-shrink-0 hover:bg-white hover:bg-opacity-20 p-2.5 rounded-full transition-all duration-200 hover:scale-110 active:scale-95"
            title="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Status Bar */}
        {status && (
          <div className="px-6 py-3 bg-white border-b border-gray-150 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">
                <span className="text-blue-600 font-bold text-base">{status.remaining_requests || 0}</span>
                <span className="text-gray-500 ml-1">requests left</span>
              </span>
            </div>
            {status.remaining_requests === 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-full font-bold">Limit reached</span>
            )}
          </div>
        )}

        {/* Help text */}
        {messages.length === 0 && !isLoading && (
          <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-150 text-sm text-gray-700 leading-relaxed space-y-2">
            <p className="font-bold text-blue-700 flex items-center gap-2">
              <span>💡</span>
              <span>Quick Tips</span>
            </p>
            <p className="text-gray-700 text-xs leading-relaxed">{getHelpPrompt('')}</p>
          </div>
        )}

        {/* Chat Window */}
        <ChatWindow messages={messages} isLoading={isLoading} error={error} />

        {/* Chat Input */}
        <ChatInput
          onSend={handleSendMessage}
          isLoading={isLoading}
          disabled={!status?.service_available || status?.remaining_requests === 0}
          placeholder={getHelpPrompt('')}
        />

        {/* Action Buttons */}
        {messages.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-3 flex gap-3 bg-white hover:bg-gray-50 transition-colors">
            <button
              onClick={handleClearHistory}
              className="flex-1 text-sm py-2.5 px-4 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 font-bold hover:scale-105 active:scale-95 border border-red-200 hover:border-red-300"
            >
              🗑️ Clear history
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatModal;
