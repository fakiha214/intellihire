/**
 * useChat Hook
 * Custom React hook for managing chat state and logic
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { chatAPI } from '../services/chatAPI';

/**
 * Simple UUID v4 generator
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const useChat = (contextType = '', contextData = {}, initialMessages = []) => {
  const [messages, setMessages] = useState(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(null);
  const conversationIdRef = useRef(generateUUID());

  // Fetch chat status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const statusData = await chatAPI.getStatus();
        setStatus(statusData);
      } catch (err) {
        console.error('Failed to fetch chat status:', err);
      }
    };

    fetchStatus();
  }, []);

  /**
   * Load conversation history
   */
  const loadHistory = useCallback(async (conversationId = null) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await chatAPI.getHistory(
        conversationId || conversationIdRef.current,
        contextType,
        50
      );
      setMessages(data.messages || []);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [contextType]);

  /**
   * Send a message and get AI response
   */
  const sendMessage = useCallback(
    async (userMessage) => {
      if (!userMessage.trim()) {
        setError('Message cannot be empty');
        return null;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Add user message immediately to UI
        const userMessageId = `user_${Date.now()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: userMessageId,
            role: 'user',
            content: userMessage,
            timestamp: new Date(),
          },
        ]);

        const response = await chatAPI.sendMessage(
          userMessage,
          contextType,
          contextData,
          conversationIdRef.current
        );

        // Replace user message with saved version and add AI response
        setMessages((prev) => [
          ...prev.filter((msg) => msg.id !== userMessageId),
          {
            id: response.id,
            role: 'user',
            content: userMessage,
            timestamp: new Date(response.timestamp),
          },
          {
            id: response.id + '_response',
            role: 'assistant',
            content: response.response,
            timestamp: new Date(response.timestamp),
          },
        ]);

        // Update status (remaining requests)
        setStatus((prev) => ({
          ...prev,
          remaining_requests: response.remaining,
        }));

        return response;
      } catch (err) {
        const errorMessage = err.message || 'Failed to send message';
        setError(errorMessage);
        console.error('Send message error:', err);

        // Check if rate limit exceeded
        if (err.message.includes('429') || err.message.includes('rate limit')) {
          setError('Rate limit exceeded. Please try again in a moment.');
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [contextType, contextData]
  );

  /**
   * Delete a specific message
   */
  const deleteMessage = useCallback(async (messageId) => {
    try {
      setError(null);
      await chatAPI.deleteMessage(messageId);
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    } catch (err) {
      setError(err.message);
      console.error('Delete message error:', err);
    }
  }, []);

  /**
   * Clear all history
   */
  const clearHistory = useCallback(async () => {
    try {
      setError(null);
      await chatAPI.clearHistory();
      setMessages([]);
      conversationIdRef.current = generateUUID(); // Start new conversation
    } catch (err) {
      setError(err.message);
      console.error('Clear history error:', err);
    }
  }, []);

  /**
   * Start new conversation
   */
  const startNewConversation = useCallback(() => {
    conversationIdRef.current = generateUUID();
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    status,
    sendMessage,
    deleteMessage,
    clearHistory,
    loadHistory,
    startNewConversation,
    conversationId: conversationIdRef.current,
  };
};
