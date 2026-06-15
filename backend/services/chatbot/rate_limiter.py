"""
Rate limiter for chat requests.
Implements per-user rate limiting to prevent abuse and control costs.
"""

from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)


class RateLimiter:
    """Per-user rate limiter for chat requests."""

    def __init__(self, requests_per_minute: int = 5):
        """
        Initialize rate limiter.

        Args:
            requests_per_minute: Max requests allowed per minute per user
        """
        self.limit = requests_per_minute
        # Store timestamps of requests: {user_id: [timestamp1, timestamp2, ...]}
        self.requests: Dict[int, List[datetime]] = defaultdict(list)

    def check_limit(self, user_id: int) -> Tuple[bool, int]:
        """
        Check if user is within rate limit.

        Args:
            user_id: User ID to check

        Returns:
            Tuple of (is_allowed: bool, remaining_requests: int)
        """
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=1)

        # Clean old requests outside the 1-minute window
        self.requests[user_id] = [
            ts for ts in self.requests[user_id] if ts > cutoff
        ]

        current_count = len(self.requests[user_id])

        # Check if under limit
        if current_count < self.limit:
            self.requests[user_id].append(now)
            remaining = self.limit - current_count - 1
            return True, remaining

        # Over limit
        return False, 0

    def get_remaining(self, user_id: int) -> int:
        """
        Get number of remaining requests for user.

        Args:
            user_id: User ID

        Returns:
            Number of requests remaining in current minute
        """
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=1)

        # Count valid requests
        valid_requests = [
            ts for ts in self.requests[user_id] if ts > cutoff
        ]

        remaining = max(0, self.limit - len(valid_requests))
        return remaining

    def get_reset_time(self, user_id: int) -> int:
        """
        Get seconds until rate limit resets for user.

        Args:
            user_id: User ID

        Returns:
            Seconds until next request is allowed (0 if allowed now)
        """
        if not self.requests[user_id]:
            return 0

        now = datetime.utcnow()
        oldest_request = min(self.requests[user_id])
        reset_time = oldest_request + timedelta(minutes=1)

        if reset_time <= now:
            return 0

        return int((reset_time - now).total_seconds())

    def reset_user(self, user_id: int) -> None:
        """
        Reset rate limit for a user (admin only).

        Args:
            user_id: User ID to reset
        """
        if user_id in self.requests:
            self.requests[user_id] = []
            logger.info(f"Rate limit reset for user {user_id}")

    def get_stats(self) -> Dict[str, int]:
        """
        Get statistics about current rate limiter state.

        Returns:
            Dict with stats
        """
        now = datetime.utcnow()
        cutoff = now - timedelta(minutes=1)

        active_users = 0
        total_requests = 0

        for user_id, timestamps in self.requests.items():
            valid = [ts for ts in timestamps if ts > cutoff]
            if valid:
                active_users += 1
                total_requests += len(valid)

        return {
            "active_users": active_users,
            "total_requests": total_requests,
            "requests_per_minute": self.limit,
        }

    def clear_old_data(self) -> None:
        """
        Clear old request data (call periodically to free memory).
        Removes entries older than 2 hours.
        """
        now = datetime.utcnow()
        cutoff = now - timedelta(hours=2)

        cleaned_users = 0
        for user_id in list(self.requests.keys()):
            self.requests[user_id] = [
                ts for ts in self.requests[user_id] if ts > cutoff
            ]

            if not self.requests[user_id]:
                del self.requests[user_id]
                cleaned_users += 1

        if cleaned_users > 0:
            logger.debug(f"Cleaned rate limiter data for {cleaned_users} users")
