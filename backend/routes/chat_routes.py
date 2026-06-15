"""
Chat API routes for AI chatbot functionality.
Handles chat requests, history retrieval, and conversation management.
"""

from flask import Blueprint, request, jsonify, session
from datetime import datetime
import uuid
import logging

from models import db, ChatHistory, User
from services.chatbot import (
    OpenRouterClient,
    PromptBuilder,
    ContextExtractor,
    RateLimiter,
)

logger = logging.getLogger(__name__)

# Create blueprint
chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")

# Initialize services
try:
    openrouter = OpenRouterClient()
    logger.info("OpenRouter client initialized successfully")
except ValueError as e:
    logger.error(f"Failed to initialize OpenRouter client: {str(e)}")
    openrouter = None

# Rate limiter: 5 requests per minute per user
rate_limiter = RateLimiter(requests_per_minute=5)


@chat_bp.before_request
def check_auth():
    """Ensure user is authenticated for all chat routes."""
    # Allow preflight requests (OPTIONS) to pass through
    if request.method == "OPTIONS":
        return None

    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401


@chat_bp.route("", methods=["POST"])
def chat():
    """
    POST /api/chat
    Handle chat messages and return AI responses.

    Request JSON:
        - message (str): User message
        - contextType (str): Type of context (job, application, etc)
        - contextData (dict): Context-specific data
        - conversationId (str, optional): Group messages into conversation

    Response JSON:
        - id (int): ChatHistory record ID
        - message (str): User message
        - response (str): AI response
        - timestamp (str): ISO timestamp
        - remaining (int): Remaining requests in minute
    """
    user_id = session["user_id"]

    # Check rate limit
    allowed, remaining = rate_limiter.check_limit(user_id)
    if not allowed:
        reset_seconds = rate_limiter.get_reset_time(user_id)
        return (
            jsonify({
                "error": "Rate limit exceeded",
                "message": f"You can make {rate_limiter.limit} requests per minute",
                "reset_in_seconds": reset_seconds,
            }),
            429,
        )

    # Check OpenRouter client
    if not openrouter:
        return (
            jsonify({
                "error": "Chat service misconfigured",
                "message": "OpenRouter API key not configured",
            }),
            503,
        )

    # Extract request data
    data = request.json or {}
    user_message = data.get("message", "").strip()
    context_type = data.get("contextType", "").strip()
    context_data = data.get("contextData") or {}
    conversation_id = data.get("conversationId") or str(uuid.uuid4())

    # Validate input
    if not user_message:
        return jsonify({"error": "Message cannot be empty"}), 400

    if len(user_message) > 5000:
        return jsonify({"error": "Message too long (max 5000 characters)"}), 400

    if context_type and not PromptBuilder.validate_context_type(context_type):
        return jsonify({
            "error": "Invalid context type",
            "valid_types": [
                "job",
                "application",
                "resume",
                "profile",
                "event",
                "applications",
                "candidates",
                "job_posting",
            ],
        }), 400

    try:
        # Get user info
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        # Build system prompt
        system_prompt = PromptBuilder.build_system_prompt(user.user_type, context_type)

        # Extract context
        context = ContextExtractor.build_context(user_id, context_type, context_data)

        # Get conversation history
        history = (
            ChatHistory.query.filter_by(
                user_id=user_id, conversation_id=conversation_id
            )
            .order_by(ChatHistory.created_at.desc())
            .limit(10)
            .all()
        )

        # Convert history to message format (reverse to get chronological order)
        history_messages = []
        for chat in reversed(history):
            history_messages.append({"role": "user", "content": chat.message})
            history_messages.append({"role": "assistant", "content": chat.response})

        # Build complete message list
        messages = PromptBuilder.build_messages(
            system_prompt=system_prompt,
            context=context,
            history=history_messages,
            user_message=user_message,
        )

        # Get AI response
        logger.debug(f"Requesting completion for user {user_id}, context: {context_type}")

        response_text = openrouter.get_completion(
            messages=messages,
            model="meta-llama/llama-3.3-70b-instruct",
            temperature=0.7,
            max_tokens=1000,
            timeout=30,
        )

        # Save to database
        chat_record = ChatHistory(
            user_id=user_id,
            conversation_id=conversation_id,
            message=user_message,
            response=response_text,
            context_type=context_type if context_type else None,
            context_id=context_data.get("job_id") or context_data.get("application_id"),
            created_at=datetime.utcnow(),
        )

        db.session.add(chat_record)
        db.session.commit()

        logger.info(f"Chat recorded for user {user_id}")

        # Return response
        return (
            jsonify({
                "id": chat_record.id,
                "conversationId": conversation_id,
                "message": user_message,
                "response": response_text,
                "timestamp": chat_record.created_at.isoformat() + "Z",
                "remaining": remaining,
                "contextType": context_type,
            }),
            200,
        )

    except Exception as e:
        logger.error(f"Chat error for user {user_id}: {str(e)}")
        return (
            jsonify({
                "error": "Chat service error",
                "message": str(e),
            }),
            503,
        )


@chat_bp.route("/history", methods=["GET"])
def get_chat_history():
    """
    GET /api/chat/history
    Get conversation history for the current user.

    Query params:
        - conversation_id (str, optional): Get specific conversation
        - context_type (str, optional): Filter by context type
        - limit (int, default 50): Max messages to return

    Response JSON:
        - messages (list): List of chat records
        - total (int): Total number of messages
    """
    user_id = session["user_id"]

    # Get query parameters
    conversation_id = request.args.get("conversation_id")
    context_type = request.args.get("context_type")
    limit = request.args.get("limit", 50, type=int)

    # Validate limit
    limit = min(max(limit, 1), 100)  # 1-100 messages

    try:
        # Build query
        query = ChatHistory.query.filter_by(user_id=user_id)

        if conversation_id:
            query = query.filter_by(conversation_id=conversation_id)

        if context_type:
            query = query.filter_by(context_type=context_type)

        # Get results
        messages = query.order_by(ChatHistory.created_at.desc()).limit(limit).all()

        return (
            jsonify({
                "messages": [msg.to_dict() for msg in reversed(messages)],
                "total": len(messages),
            }),
            200,
        )

    except Exception as e:
        logger.error(f"Error retrieving chat history: {str(e)}")
        return (
            jsonify({
                "error": "Failed to retrieve chat history",
                "message": str(e),
            }),
            500,
        )


@chat_bp.route("/history/<int:chat_id>", methods=["DELETE"])
def delete_chat_message(chat_id):
    """
    DELETE /api/chat/history/<id>
    Delete a specific chat message.

    Response JSON:
        - success (bool): Whether deletion was successful
    """
    user_id = session["user_id"]

    try:
        # Get chat record
        chat = ChatHistory.query.get(chat_id)

        if not chat:
            return jsonify({"error": "Chat message not found"}), 404

        # Verify ownership
        if chat.user_id != user_id:
            return jsonify({"error": "Unauthorized"}), 403

        # Delete
        db.session.delete(chat)
        db.session.commit()

        logger.info(f"Deleted chat message {chat_id} for user {user_id}")

        return jsonify({"success": True}), 200

    except Exception as e:
        logger.error(f"Error deleting chat message: {str(e)}")
        return (
            jsonify({
                "error": "Failed to delete chat message",
                "message": str(e),
            }),
            500,
        )


@chat_bp.route("/status", methods=["GET"])
def get_chat_status():
    """
    GET /api/chat/status
    Get status of chat service and user's rate limit.

    Response JSON:
        - service_available (bool): Whether chat service is available
        - remaining_requests (int): Requests remaining this minute
        - reset_seconds (int): Seconds until limit resets
        - openrouter_connected (bool): Whether OpenRouter API is connected
    """
    user_id = session["user_id"]

    return (
        jsonify({
            "service_available": openrouter is not None,
            "remaining_requests": rate_limiter.get_remaining(user_id),
            "reset_seconds": rate_limiter.get_reset_time(user_id),
            "openrouter_connected": openrouter is not None,
            "rate_limit": rate_limiter.limit,
        }),
        200,
    )


@chat_bp.route("/clear-history", methods=["POST"])
def clear_all_chat_history():
    """
    POST /api/chat/clear-history
    Clear all chat history for the current user.

    Response JSON:
        - success (bool): Whether clear was successful
        - deleted (int): Number of messages deleted
    """
    user_id = session["user_id"]

    try:
        # Delete all messages for user
        count = ChatHistory.query.filter_by(user_id=user_id).delete()
        db.session.commit()

        logger.info(f"Cleared {count} chat messages for user {user_id}")

        return (
            jsonify({
                "success": True,
                "deleted": count,
            }),
            200,
        )

    except Exception as e:
        logger.error(f"Error clearing chat history: {str(e)}")
        return (
            jsonify({
                "error": "Failed to clear chat history",
                "message": str(e),
            }),
            500,
        )
