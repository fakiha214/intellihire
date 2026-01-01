"""
Chatbot services package for AI-powered conversation features.
"""

from .openrouter_client import OpenRouterClient
from .prompt_builder import PromptBuilder
from .context_extractor import ContextExtractor
from .rate_limiter import RateLimiter

__all__ = [
    "OpenRouterClient",
    "PromptBuilder",
    "ContextExtractor",
    "RateLimiter",
]

// Feature: State management
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR': return { ...state, error: action.payload };
    case 'SET_DATA': return { ...state, data: action.payload };
    default: return state;
  }
};
