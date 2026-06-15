/**
 * Chat API Service
 * Handles all API calls to the backend chat endpoints
 */

const API_BASE = '/api/chat';

export const chatAPI = {
  /**
   * Send a chat message and get AI response
   */
  async sendMessage(message, contextType = '', contextData = {}, conversationId = null) {
    try {
      const response = await fetch(`${API_BASE}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          contextType,
          contextData,
          conversationId,
        }),
      });

      // The server may return a non-JSON page (e.g. an nginx 502/504 HTML page
      // while the backend is restarting). Guard against parsing that as JSON.
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('The assistant is temporarily unavailable. Please try again in a moment.');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to send message');
      }

      return data;
    } catch (error) {
      console.error('Chat API error:', error);
      throw error;
    }
  },

  /**
   * Get chat history for current user
   */
  async getHistory(conversationId = null, contextType = null, limit = 50) {
    try {
      const params = new URLSearchParams();
      if (conversationId) params.append('conversation_id', conversationId);
      if (contextType) params.append('context_type', contextType);
      if (limit) params.append('limit', limit);

      const response = await fetch(
        `${API_BASE}/history?${params.toString()}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch chat history');
      }

      return await response.json();
    } catch (error) {
      console.error('History fetch error:', error);
      throw error;
    }
  },

  /**
   * Delete a specific chat message
   */
  async deleteMessage(chatId) {
    try {
      const response = await fetch(`${API_BASE}/history/${chatId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete message');
      }

      return await response.json();
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  },

  /**
   * Get chat service status and rate limit
   */
  async getStatus() {
    try {
      const response = await fetch(`${API_BASE}/status`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      return await response.json();
    } catch (error) {
      console.error('Status fetch error:', error);
      throw error;
    }
  },

  /**
   * Clear all chat history for current user
   */
  async clearHistory() {
    try {
      const response = await fetch(`${API_BASE}/clear-history`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to clear history');
      }

      return await response.json();
    } catch (error) {
      console.error('Clear history error:', error);
      throw error;
    }
  },
};
