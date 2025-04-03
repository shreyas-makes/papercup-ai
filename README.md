# Papercup

Papercup is a WebRTC-based communication platform built with Ruby on Rails, enabling high-quality voice calls with advanced call management features.

## Features

- WebRTC-powered voice calling with low latency
- Secure payment processing with Money-Rails
- User authentication and account management
- Interactive dialer functionality
- Call initiation, handling, and quality monitoring
- Mobile-responsive UI built with Tailwind CSS
- Background job processing via Sidekiq

## Changelog

### April 3, 2025 - WebRTC Backend Foundation

We've established the backend infrastructure for WebRTC communication in the Papercup platform. This included creating a robust configuration initializer with multiple Google STUN servers, developing a secure JWT-based token generation service with built-in expiration, and adding a properly authenticated token API endpoint. To enable real-time communication, we implemented ActionCable channels for WebRTC signaling and designed service classes for connection handling and call routing. Integration with Twilio was completed by adding the twilio-ruby gem and creating a service for outbound PSTN calls, along with configuring the necessary environment variables. We also developed a testing framework with a browser-based interface to validate the token generation functionality.

### April 1, 2025 - User Authentication Enhancements

The Google OAuth integration was significantly improved with more robust error handling and user flow optimizations. We enhanced the authentication process to distinguish between login and signup scenarios with contextual button labels and appropriate redirects. The user model's OAuth handling was streamlined to store only necessary user information from Google profiles, and we implemented proper session management to prevent authentication conflicts.

### March 31, 2025 - Call Processing and Notifications

We implemented a comprehensive notification system throughout the application with different notification types for various scenarios. This included success notifications for completed actions, warning notifications for low credit balances, and error notifications for failed operations. The notification components were designed with auto-dismiss functionality and appropriate visual styling based on the message type. Additionally, we fixed issues with the call initiation process after login, ensuring proper outlet connections and event handling.

### March 30, 2025 - Active Call Interface

The active call screen was fully implemented with a visually appealing overlay that centers perfectly on the screen. The interface includes all specified components: the dialed phone number display, a functional duration timer, current credit balance indicator, and a prominent red end call button. Animations were added for smooth transitions between calling states, and we ensured proper mobile responsiveness. The interface was carefully designed to balance aesthetics with usability, providing clear visual feedback during active calls.

### March 29, 2025 - Call History and Error States

We created a complete call history section with a Stimulus controller that displays past calls in a scrollable list. Each call entry shows the phone number, date/time, duration, and country flag when available. The history component includes a "No calls yet" message for new users and offers one-click redial functionality. Additionally, we implemented various error states and feedback mechanisms throughout the application, including loading spinners, disabled states for buttons during processing, and appropriate error notifications for failed operations.

### March 28, 2025 - Core Database Models

The foundation of the application's data structure was established by creating and implementing all the necessary database models. We developed the User model with Devise integration, the Call model for tracking call details, the CreditTransaction model for financial operations, and the CallRate model for determining call pricing. Money-Rails was integrated for handling currency fields, and we created service objects for managing credit operations and call completions. Comprehensive testing was implemented for all models and services to ensure reliability and data integrity.

## Technology Stack

- **Frontend**: Stimulus, Turbo, Tailwind CSS
- **Backend**: Ruby on Rails
- **Database**: PostgreSQL
- **Background Jobs**: Sidekiq
- **Real-time Communication**: WebRTC
- **Payment Processing**: Money-Rails
- **Deployment**: Hetzner Cloud, Hatchbox

## Environment Setup

### Prerequisites

- Ruby 3.3.5
- Rails 8.0.0
- PostgreSQL
- Redis (for Sidekiq)

### Environment Variables

Papercup uses environment variables for configuration. For local development:

1. Copy the example environment file:
   ```
   cp .env.example .env
   ```

2. Edit the `.env` file with your configuration values.

3. For production, ensure the following environment variables are set:
   - `DATABASE_URL`
   - `REDIS_URL`
   - `RAILS_MASTER_KEY`

### Credentials

Sensitive credentials are stored in Rails encrypted credentials:

- Development/test: `rails credentials:edit --environment development`
- Production: `rails credentials:edit --environment production`

Required credentials:
- Twilio (for SIP gateway)
- Stripe (for payments)

## Getting Started

### Prerequisites

- Ruby 3.x
- Rails 8.x
- PostgreSQL
- Node.js and Yarn
- Redis (for Sidekiq)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/papercup.git
cd papercup
```

2. Install dependencies
```bash
bundle install
yarn install
```

3. Setup the database
```bash
rails db:create db:migrate db:seed
```

4. Start the development server
```bash
bin/dev
```

## Development Guidelines

### Code Standards
- 2-space indentation for all code files
- Snake case for Ruby, camelCase for JavaScript
- Maximum line length of 100 characters
- Include typed parameters where possible

### Frontend Development
- Use Work Sans font family for all UI components
- Follow the defined color scheme (#000000, #FFFFFF, #FFD700, #4CAF50, #FF4444, #F5F5F5, #333333)
- Use Stimulus controllers for all interactive components
- Prefer data attributes for Stimulus targets over IDs
- Use Tailwind CSS utility classes - avoid custom CSS when possible

### Backend Development
- Follow frontend-first development approach
- Create service objects for complex business logic
- Use Active Record scopes for common queries
- All database operations involving credits must be atomic
- Use background jobs for all processing that takes >100ms

## Testing

```bash
# Run all tests
bundle exec rspec

# Run specific test directory
bundle exec rspec spec/models

# Run tests with browser visibility
HEADED=TRUE bundle exec rspec
```

## WebRTC Implementation

- Always use secure connections (SRTP/DTLS)
- Configure public STUN servers (Google STUN used by default)
- Handle browser permissions explicitly
- Implement graceful degradation for unsupported browsers
- Monitor and log connection quality metrics

## Deployment

The application is configured for deployment on Hetzner Cloud using Hatchbox with zero-downtime deployment capabilities.

## Security

- All WebRTC connections are secured with SRTP/DTLS
- Phone numbers are validated with phonelib
- WebRTC tokens have short expiration times
- CSRF protection is implemented on all forms
- All user inputs are sanitized

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add some amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

Please ensure your code adheres to our style guidelines and passes all tests.
