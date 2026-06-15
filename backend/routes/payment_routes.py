"""Stripe payment routes for the paid Open House Events feature.

Uses Stripe Checkout (hosted redirect) in test mode. Payment is verified on the
success redirect (no webhook required), which works on localhost.

Required environment variables:
    STRIPE_SECRET_KEY        - Stripe test secret key (sk_test_...)
    STRIPE_PUBLISHABLE_KEY   - Stripe test publishable key (pk_test_...) [optional for redirect flow]
    EVENT_CREATION_FEE_CENTS - one-time event fee in the smallest currency unit (default 4900)
    PAYMENT_CURRENCY         - ISO currency code (default 'usd')
"""

import os
from datetime import datetime

from flask import Blueprint, request, jsonify, session

from models import db, OpenHouseEvent

try:
    import stripe
except ImportError:  # library not installed yet
    stripe = None

payment_bp = Blueprint('payment', __name__)


def _fee_cents() -> int:
    try:
        return int(os.environ.get('EVENT_CREATION_FEE_CENTS', '4900'))
    except (TypeError, ValueError):
        return 4900


def _currency() -> str:
    return (os.environ.get('PAYMENT_CURRENCY') or 'usd').lower()


def _stripe_ready() -> bool:
    """Return True and configure the API key when Stripe is usable."""
    key = os.environ.get('STRIPE_SECRET_KEY', '')
    if stripe and key:
        stripe.api_key = key
        return True
    return False


def _frontend_base() -> str:
    """Where to send the user back after checkout.

    Prefer the Origin of the request (the actual running SPA) so the redirect
    always lands on the right host/port, then fall back to FRONTEND_URL / default.
    """
    base = request.headers.get('Origin') or os.environ.get('FRONTEND_URL') or 'http://localhost:5173'
    return base.rstrip('/')


@payment_bp.route('/api/payments/config', methods=['GET'])
def payment_config():
    """Expose pricing + whether payments are configured (for the UI)."""
    fee = _fee_cents()
    cur = _currency()
    return jsonify({
        'configured': _stripe_ready(),
        'publishableKey': os.environ.get('STRIPE_PUBLISHABLE_KEY', ''),
        'amount': fee,
        'currency': cur,
        'amountDisplay': f"{fee / 100:.2f} {cur.upper()}",
    }), 200


@payment_bp.route('/api/events/<int:event_id>/checkout', methods=['POST'])
def create_event_checkout(event_id):
    """Create a Stripe Checkout session for the event hosting fee."""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    if not _stripe_ready():
        return jsonify({
            'error': 'Payments are not configured. Add STRIPE_SECRET_KEY to the backend environment.',
            'configured': False,
        }), 503

    event = OpenHouseEvent.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    if event.host_employer_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403
    if (event.payment_status or 'unpaid') == 'paid':
        return jsonify({'error': 'This event is already paid for.', 'alreadyPaid': True}), 400

    fee = _fee_cents()
    cur = _currency()
    base = _frontend_base()

    try:
        checkout = stripe.checkout.Session.create(
            mode='payment',
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': cur,
                    'unit_amount': fee,
                    'product_data': {
                        'name': f'Open House Event: {event.title}',
                        'description': 'IntelliHire one-time event hosting fee',
                    },
                },
                'quantity': 1,
            }],
            success_url=f'{base}/events/{event_id}/dashboard?payment=success&session_id={{CHECKOUT_SESSION_ID}}',
            cancel_url=f'{base}/events/{event_id}/dashboard?payment=cancelled',
            client_reference_id=str(event_id),
            metadata={'event_id': str(event_id), 'user_id': str(session['user_id'])},
        )
    except Exception as e:  # Stripe / network error
        return jsonify({'error': f'Failed to create checkout session: {str(e)}'}), 502

    event.stripe_session_id = checkout.id
    db.session.commit()
    return jsonify({'url': checkout.url, 'sessionId': checkout.id}), 200


@payment_bp.route('/api/events/<int:event_id>/verify-payment', methods=['GET'])
def verify_event_payment(event_id):
    """Verify a completed checkout session and mark the event paid."""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    event = OpenHouseEvent.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    if event.host_employer_id != session['user_id']:
        return jsonify({'error': 'Forbidden'}), 403

    # Idempotent: already paid.
    if (event.payment_status or 'unpaid') == 'paid':
        return jsonify(event.to_dict()), 200

    if not _stripe_ready():
        return jsonify({'error': 'Payments are not configured.', 'configured': False}), 503

    session_id = request.args.get('session_id') or event.stripe_session_id
    if not session_id:
        return jsonify({'error': 'No payment session found for this event.'}), 400

    try:
        cs = stripe.checkout.Session.retrieve(session_id)
    except Exception as e:
        return jsonify({'error': f'Failed to verify payment: {str(e)}'}), 502

    if getattr(cs, 'payment_status', None) == 'paid':
        event.payment_status = 'paid'
        event.paid_at = datetime.utcnow()
        event.amount_paid = getattr(cs, 'amount_total', None)
        event.stripe_session_id = session_id
        db.session.commit()
        return jsonify(event.to_dict()), 200

    return jsonify({
        'error': 'Payment has not been completed yet.',
        'paymentStatus': event.payment_status or 'unpaid',
    }), 402
