

1. Authentication & User Management (Devise)

Features:

Signup/login via email (Devise)

Optional 2FA via TOTP or SMS (extendable)

Password reset and email confirmations

Account lockout after N failed attempts

Key Models:

User: email, encrypted_password, admin, credits_cents, last_sign_in_ip

Devise modules: :database_authenticatable, :recoverable, :registerable, :trackable, :validatable, :confirmable

Extends Speedrail with:

Custom Devise controllers for onboarding

credits_cents (Money-Rails) for real-time deduction

Admin user roles for Active Admin

2. Billing & Payments (Stripe + Money-Rails)

Features:

Prepaid credit system (no subscriptions)

Stripe Checkout integration (Speedrail already wired)

One-off top-ups with dynamic tiers

Webhook-driven credit refill after payment

Admin-adjustable pricing rates

Key Models:

CreditTransaction: user_id, amount_cents, source (manual, stripe), stripe_payment_id

CallRate: country_code, prefix, rate_per_min_cents

Stripe Webhooks:

checkout.session.completed → create CreditTransaction, increment user.credits_cents

3. WebRTC + PSTN Call Flow

Architecture:

WebRTC in browser (client-to-server)

Rails authorizes session and assigns TURN server credentials

SIP trunk (Twilio/Telnyx/SignalWire) terminates to PSTN

Media routed via Coturn + Janus/FreeSWITCH proxy

Features:

Real-time call initiation from dialpad

Token-based WebRTC auth endpoint (/api/webrtc/token)

Call cost estimation before call

Credit metering every N seconds during call

Key Models:

CallSession: user_id, destination_number, start_time, end_time, duration_sec, rate_cents, cost_cents, status

CallEvent: call_session_id, event_type, timestamp, metadata (used for analytics + fraud detection)

Background Jobs:

CallBillingJob: runs every N seconds, deducts credits (Delayed backend)

CallHangupJob: force-terminates call if user credit ≤ 0

4. Dialer UI (Hotwire + Tailwind UI)

Features:

Keypad dialer (Flowbite or Tailwind UI components)

Real-time call state (connecting, in-call, ended)

Remaining credit meter (Turbo-updated)

Country auto-detection via libphonenumber-js

Turbo Streams:

Live update CallSession status

Auto-refresh credit display during call

StimulusJS Controllers:

dialer_controller.js: handles button presses, AJAX to /calls

webrtc_controller.js: manages media, connects via WebRTC token

5. Admin Panel (ActiveAdmin)

Features:

Manage users, credits, call rates, call logs

Import/export rates CSV

Ban users, flag suspicious calls

System dashboard: call volume, revenue, top destinations

Key Resources:

UserAdmin, CreditTransactionAdmin, CallRateAdmin, CallSessionAdmin

6. Rate Engine & Call Estimation

Features:

Country prefix matching (via CallRate)

Real-time rate lookup and displayed pre-call

Rate import tool: parse SIP provider CSV (e.g. Twilio voice-pricing.csv)

Background Job:

RateImporterJob: parses and seeds new rates from admin-uploaded CSV

7. Analytics & Charts (Chartkick)

Features:

Daily/weekly/monthly call volume

Revenue breakdown

Top countries called

Call success/failure trends

Sources:

CallSession, CreditTransaction, CallRate data

8. Deployment Infrastructure (Hatchbox.io + Hetzner)

Roles:

App: Rails + Redis + Sidekiq + Postgres

Media proxy: Janus/FreeSWITCH (on Hetzner VM or container)

TURN/STUN: Coturn (same or separate host, secured via ephemeral credentials)

Strategy:

Hatchbox deploys Rails app and background workers

Use Hatchbox hooks to:

Restart Sidekiq

Run DB migrations

Hetzner Firewalls restrict SIP/media ports

9. Delayed Jobs / Background Tasks

Use Cases:

Call metering and enforcement (CallBillingJob)

Stripe webhook processing (StripeWebhookJob)

Call cleanup (CallCleanupJob)

Fraud analysis (FraudDetectionJob)

Rate import job (RateImporterJob)

10. Optional Modules for v2

Inbound virtual numbers (DID provisioning)

SIP endpoint registration for advanced users

Referral engine (already scaffolded via Rewardful)

SMS support via the same trunk

Voicemail drop if call fails

CLI interface for developers / API consumers