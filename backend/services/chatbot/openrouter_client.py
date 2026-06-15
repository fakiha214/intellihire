"""
OpenRouter API client for AI chatbot integration.
Handles all communication with OpenRouter's free tier LLM models.
"""

import requests
import json
import os
from typing import Generator, Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


class OpenRouterClient:
    """Client for OpenRouter API with streaming support."""

    BASE_URL = "https://openrouter.ai/api/v1"
    DEFAULT_MODEL = "meta-llama/llama-3.3-70b-instruct"
    DEFAULT_TEMPERATURE = 0.7
    DEFAULT_MAX_TOKENS = 1000

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize OpenRouter client.

        Args:
            api_key: OpenRouter API key. If None, reads from OPENROUTER_API_KEY env var.
        """
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise ValueError(
                "OPENROUTER_API_KEY not found. Set it in environment variables or pass to constructor."
            )
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:5174",  # Frontend URL
            "X-Title": "CareerConnect",
        }

    def get_completion(
        self,
        messages: list,
        model: str = DEFAULT_MODEL,
        temperature: float = DEFAULT_TEMPERATURE,
        max_tokens: int = DEFAULT_MAX_TOKENS,
        timeout: int = 30,
    ) -> str:
        """
        Get a completion from OpenRouter API (non-streaming).

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model name to use
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens in response
            timeout: Request timeout in seconds

        Returns:
            Generated text response

        Raises:
            Exception: If API call fails
        """
        url = f"{self.BASE_URL}/chat/completions"

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "top_p": 1,
            "frequency_penalty": 0,
            "presence_penalty": 0,
        }

        try:
            response = requests.post(
                url, json=payload, headers=self.headers, timeout=timeout
            )
            response.raise_for_status()

            data = response.json()

            if "error" in data:
                error_msg = data.get("error", {}).get("message", "Unknown error")
                logger.error(f"OpenRouter API error: {error_msg}")
                raise Exception(f"OpenRouter API error: {error_msg}")

            return data["choices"][0]["message"]["content"]

        except requests.exceptions.Timeout:
            logger.error("OpenRouter API request timeout")
            raise Exception("Chat service timeout - please try again")
        except requests.exceptions.ConnectionError:
            logger.error("OpenRouter API connection error")
            raise Exception("Chat service connection error - please check your internet")
        except requests.exceptions.HTTPError as e:
            logger.error(f"OpenRouter API HTTP error: {e.response.status_code}")
            if e.response.status_code == 401:
                raise Exception("Invalid API key - chat service misconfigured")
            elif e.response.status_code == 429:
                raise Exception("OpenRouter rate limited - please try again later")
            else:
                raise Exception(f"Chat service error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"OpenRouter API error: {str(e)}")
            raise

    def get_completion_stream(
        self,
        messages: list,
        model: str = DEFAULT_MODEL,
        temperature: float = DEFAULT_TEMPERATURE,
        max_tokens: int = DEFAULT_MAX_TOKENS,
        timeout: int = 30,
    ) -> Generator[str, None, None]:
        """
        Get a streaming completion from OpenRouter API.

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model name to use
            temperature: Sampling temperature (0-2)
            max_tokens: Maximum tokens in response
            timeout: Request timeout in seconds

        Yields:
            Text chunks as they arrive from the API
        """
        url = f"{self.BASE_URL}/chat/completions"

        payload = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "top_p": 1,
            "frequency_penalty": 0,
            "presence_penalty": 0,
            "stream": True,
        }

        try:
            response = requests.post(
                url,
                json=payload,
                headers=self.headers,
                timeout=timeout,
                stream=True,
            )
            response.raise_for_status()

            for line in response.iter_lines():
                if not line:
                    continue

                line = line.decode("utf-8") if isinstance(line, bytes) else line

                if line.startswith("data: "):
                    line = line[6:]

                if line == "[DONE]":
                    break

                try:
                    data = json.loads(line)
                    if "error" in data:
                        error_msg = data.get("error", {}).get("message", "Unknown error")
                        logger.error(f"OpenRouter API error: {error_msg}")
                        raise Exception(f"OpenRouter API error: {error_msg}")

                    if "choices" in data and data["choices"]:
                        delta = data["choices"][0].get("delta", {})
                        if "content" in delta:
                            yield delta["content"]

                except json.JSONDecodeError:
                    continue

        except requests.exceptions.Timeout:
            logger.error("OpenRouter API request timeout")
            yield "\n\n[Error: Chat service timeout - please try again]"
        except requests.exceptions.ConnectionError:
            logger.error("OpenRouter API connection error")
            yield "\n\n[Error: Chat service connection error]"
        except Exception as e:
            logger.error(f"OpenRouter API streaming error: {str(e)}")
            yield f"\n\n[Error: {str(e)}]"

    def check_api_key_validity(self) -> bool:
        """
        Check if API key is valid by making a minimal request.

        Returns:
            True if API key is valid, False otherwise
        """
        try:
            # Make a minimal request to check API key
            messages = [{"role": "user", "content": "test"}]
            self.get_completion(messages, max_tokens=1)
            return True
        except Exception as e:
            logger.error(f"API key validation failed: {str(e)}")
            return False

    @staticmethod
    def get_available_models() -> Dict[str, str]:
        """
        Get available free models on OpenRouter.

        Returns:
            Dict mapping model names to display names
        """
        return {
            "meta-llama/llama-3.3-70b-instruct": "Llama 3.3 70B (Recommended)",
            "mistralai/mistral-7b-instruct": "Mistral 7B (Fast)",
            "meta-llama/llama-3.1-8b-instruct": "Llama 3.1 8B (Very Fast)",
        }
