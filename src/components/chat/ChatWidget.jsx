'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle, X, Menu } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import ChatWindow from './ChatWindow';
import ChatInput from './ChatInput';
import MessageStatus from './MessageStatus';
import { getHelpPrompt } from '../../utils/chatConstants';

/**
 * ChatWidget Component
 * Floating chat widget for conversational AI assistance
 * Can be embedded anywhere in the application
 */
const ChatWidget = ({
  contextType = '',
  contextData = {},
  position = 'bottom-right',
  defaultOpen = false,
  showHeader = true,
  compact = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showHistory, setShowHistory] = useState(false);
  const loadedRef = useRef(false);
  const { messages, isLoading, error, status, sendMessage, loadHistory, clearHistory } = useChat(
    contextType,
    contextData
  );

  // Load history on first open
  useEffect(() => {
    if (isOpen && !loadedRef.current) {
      loadedRef.current = true;
      loadHistory();
    } else if (!isOpen) {
      loadedRef.current = false;
    }
  }, [isOpen, loadHistory]);

  const handleSendMessage = useCallback(
    async (message) => {
      await sendMessage(message);
    },
    [sendMessage]
  );

  const handleClearHistory = useCallback(async () => {
    if (window.confirm('Clear all chat history? This cannot be undone.')) {
      await clearHistory();
    }
  }, [clearHistory]);

  // Position styles
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'center': 'fixed inset-0 flex items-center justify-center',
  };

  // Render compact button
  if (compact && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed ${positionClasses[position]} p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all hover:scale-110 z-40`}
        title="Open Chat"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  // Render full widget
  return (
    <div
      className={`${position === 'center' ? '' : `fixed ${positionClasses[position]}`} w-96 h-96 flex flex-col bg-white rounded-lg shadow-2xl z-50 overflow-hidden transition-all ${
        isOpen ? 'scale-100 opacity-100' : 'scale-75 opacity-0 pointer-events-none'
      }`}
    >
      {/* Header */}
      {showHeader && (
        <div className="bg-blue-500 text-white p-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <MessageCircle size={20} />
            <div>
              <h3 className="font-semibold text-sm">CareerConnect AI</h3>
              <p className="text-xs text-blue-100">
                {status?.service_available ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOpen && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="hover:bg-blue-600 p-2 rounded transition-colors"
                title="Toggle history"
              >
                <Menu size={18} />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-600 p-2 rounded transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Help text */}
      {messages.length === 0 && !isLoading && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700">
          {getHelpPrompt(contextType)}
        </div>
      )}

      {/* Status indicator */}
      {status && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-600 flex items-center justify-between">
          <span>Requests remaining: {status.remaining_requests || 'N/A'}</span>
          {status.remaining_requests === 0 && (
            <span className="text-red-600 font-medium">Limit reached</span>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="px-4 py-2">
          <MessageStatus
            type="error"
            message={error}
            dismissible={true}
            onDismiss={() => {}}
          />
        </div>
      )}

      {/* Chat window */}
      <ChatWindow messages={messages} isLoading={isLoading} error={error} />

      {/* Chat input */}
      <ChatInput
        onSend={handleSendMessage}
        isLoading={isLoading}
        disabled={!status?.service_available || status?.remaining_requests === 0}
        placeholder={getHelpPrompt(contextType)}
      />

      {/* Action buttons */}
      {isOpen && messages.length > 0 && (
        <div className="border-t border-gray-200 px-4 py-2 flex gap-2 bg-gray-50">
          <button
            onClick={handleClearHistory}
            className="flex-1 text-xs py-1 px-2 text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            Clear history
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
