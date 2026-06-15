'use client';

import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { validateMessage, CHAT_CONFIG } from '../../utils/chatConstants';

/**
 * ChatInput Component
 * Input field for chat messages with send button
 */
const ChatInput = ({ onSend, isLoading = false, disabled = false, placeholder = '' }) => {
  const [message, setMessage] = useState('');
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleInputChange = (e) => {
    const text = e.target.value;
    setMessage(text);
    setCharCount(text.length);
  };

  const handleSend = async () => {
    const validation = validateMessage(message);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    await onSend(message);
    setMessage('');
    setCharCount(0);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    // Send on Enter, but allow Shift+Enter for newlines
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isOverLimit = charCount > CHAT_CONFIG.MAX_MESSAGE_LENGTH;
  const isSendDisabled = isLoading || disabled || !message.trim() || isOverLimit;

  return (
    <div className="border-t border-gray-200 p-4 bg-gradient-to-t from-white to-gray-50 shadow-lg">
      <div className="flex items-end gap-3">
        {/* Message input container */}
        <div className="flex-1">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || '💬 Ask about this job, your skills, or career...'}
              disabled={disabled || isLoading}
              className={`w-full resize-none rounded-xl border-2 transition-all duration-200 ${
                isOverLimit
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500'
              } px-4 py-3 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 disabled:bg-gray-100 disabled:text-gray-500 disabled:border-gray-300 placeholder-gray-400 font-medium`}
              rows="1"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />

            {/* Character count */}
            <div className="absolute bottom-2 right-3 text-xs font-semibold">
              <span className={`${
                isOverLimit ? 'text-red-600 bg-red-100' : 'text-gray-500 bg-gray-100'
              } px-2 py-1 rounded-full transition-all`}>
                {charCount}/{CHAT_CONFIG.MAX_MESSAGE_LENGTH}
              </span>
            </div>
          </div>
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={isSendDisabled}
          className={`flex-shrink-0 p-3 rounded-full transition-all duration-200 transform hover:scale-110 active:scale-95 ${
            isSendDisabled
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
          }`}
          title={isLoading ? 'Sending...' : 'Send message (Enter)'}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send size={22} />
          )}
        </button>
      </div>

      {/* Help text */}
      <div className="mt-2.5 text-xs text-gray-600 flex items-center justify-between">
        <span>
          <kbd className="px-2 py-1 bg-gray-200 rounded-md text-xs font-semibold text-gray-700 mr-1">Enter</kbd>
          to send •
          <kbd className="px-2 py-1 bg-gray-200 rounded-md text-xs font-semibold text-gray-700 ml-1 mr-1">Shift+Enter</kbd>
          for new line
        </span>
      </div>
    </div>
  );
};

export default ChatInput;
