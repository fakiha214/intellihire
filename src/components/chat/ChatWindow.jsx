'use client';

import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import MessageStatus from './MessageStatus';

/**
 * ChatWindow Component
 * Displays chat message history in a scrollable container
 */
const ChatWindow = ({ messages = [], isLoading = false, error = null }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0 && !isLoading && !error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-center bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-xs">
          <div className="text-5xl mb-4 animate-bounce">💬</div>
          <p className="text-gray-600 text-sm font-medium">Start a conversation by sending a message</p>
          <p className="text-gray-500 text-xs mt-2">Ask anything about this job, your skills, or career growth!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 via-white to-gray-50 scroll-smooth">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-5xl mb-3 animate-spin" style={{ animationDuration: '3s' }}>🤖</div>
            <p className="text-gray-600 font-medium text-sm">Loading messages...</p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700 font-medium">AI is typing</span>
                  <div className="flex space-x-1">
                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {error && <MessageStatus type="error" message={error} />}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatWindow;
